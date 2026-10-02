/**
 * ORBIT reasoning engine.
 *
 * The legacy path in ChatbotSidebar was a long chain of `q.includes(...)` checks:
 * order-dependent, no conversation memory, and unable to answer anything that
 * wasn't anticipated with a hardcoded string. This module replaces that with:
 *
 *   1. classify()  — intent detection with an explicit confidence score
 *   2. extract()   — entity extraction (feed, metric, operator, threshold, unit)
 *   3. runQuery()  — a generic table-query executor (filter / count / stats / rank)
 *   4. context     — follow-up resolution against the previous turn
 *   5. routeViz()  — intent → the SpaceGuard view + tab that actually shows it
 *
 * Everything is pure and synchronous so it can back the OpenRouter system prompt
 * (structured facts) and the local fallback engine (full answers) identically.
 */

// ---------------------------------------------------------------------------
// Feed registry — the 9 DONKI tables ORBIT can query.
// `tab` is the DashboardPage activeTab that renders this feed, so routeViz()
// can actually navigate the user there rather than just naming a chart.
// ---------------------------------------------------------------------------
export const FEEDS = [
  {
    key: 'cmes', arrKey: 'cmes', label: 'CME', plural: 'CMEs',
    idField: 'activityID', timeField: 'startTime', tab: 'cme-earth',
    name: 'Coronal Mass Ejections',
    numeric: { speed: 'km/s', halfAngle: '°', latitude: '°', longitude: '°' },
    icon: '💥'
  },
  {
    key: 'flares', arrKey: 'flares', label: 'FLR', plural: 'Flares',
    idField: 'flareID', timeField: 'peakTime', tab: 'flare',
    name: 'Solar Flares',
    numeric: { flux: 'W/m²' },
    text: { classType: 'GOES class' },
    icon: '☀️'
  },
  {
    key: 'storms', arrKey: 'storms', label: 'GST', plural: 'Storms',
    idField: 'stormID', timeField: 'startTime', tab: 'geomagnetic',
    name: 'Geomagnetic Storms',
    numeric: { maxKpIndex: 'Kp' },
    icon: '⚡'
  },
  {
    key: 'seps', arrKey: 'seps', label: 'SEP', plural: 'SEP events',
    idField: 'sepID', timeField: 'eventTime', tab: 'sep',
    name: 'Solar Energetic Particles',
    icon: '⚛️'
  },
  {
    key: 'ipss', arrKey: 'ipss', label: 'IPS', plural: 'Shocks',
    idField: 'ipsID', timeField: 'eventTime', tab: 'ips',
    name: 'Interplanetary Shocks',
    icon: '🌊'
  },
  {
    key: 'mpcs', arrKey: 'mpcs', label: 'MPC', plural: 'MPC crossings',
    idField: 'mpcID', timeField: 'eventTime', tab: 'mpc',
    name: 'Magnetopause Crossings',
    icon: '🧲'
  },
  {
    key: 'rbes', arrKey: 'rbes', label: 'RBE', plural: 'RBE events',
    idField: 'rbeID', timeField: 'eventTime', tab: 'rbe',
    name: 'Radiation Belt Enhancements',
    icon: '🛰️'
  },
  {
    key: 'hss', arrKey: 'hss', label: 'HSS', plural: 'HSS streams',
    idField: 'hssID', timeField: 'eventTime', tab: 'hss',
    name: 'High-Speed Streams',
    icon: '💨'
  },
  {
    key: 'wes', arrKey: 'wes', label: 'WSA', plural: 'WSA-ENLIL sims',
    idField: 'simulationID', timeField: 'modelCompletionTime', tab: 'cme-earth',
    name: 'WSA-ENLIL Simulations',
    numeric: { speed: 'km/s', halfAngle: '°', kp90: 'Kp', kp135: 'Kp', kp180: 'Kp', rmin_re: 'Re' },
    icon: '🛰️'
  }
];

const FEED_BY_KEY = Object.fromEntries(FEEDS.map((f) => [f.key, f]));

/** Words that map a free-text query onto a feed. Ordered by specificity. */
const FEED_ALIASES = [
  { key: 'wes', words: ['wsa', 'enlil', 'simulation', 'forecast', 'prediction', 'cone model'] },
  { key: 'cmes', words: ['cme', 'coronal', 'mass ejection', 'ejection', 'halo'] },
  { key: 'flares', words: ['flare', 'flr', 'x-class', 'm-class', 'xray', 'x-ray'] },
  { key: 'storms', words: ['gst', 'geomagnetic storm', 'storm', 'kp', 'substorm'] },
  { key: 'seps', words: ['sep', 'energetic particle', 'proton', 'solar radiation'] },
  { key: 'ipss', words: ['ips', 'shock', 'interplanetary'] },
  { key: 'mpcs', words: ['mpc', 'magnetopause', 'crossing'] },
  { key: 'rbes', words: ['rbe', 'radiation belt', 'electron'] },
  { key: 'hss', words: ['hss', 'high-speed stream', 'high speed stream', 'cir', 'solar wind stream'] }
];

/** Metric words → the field they aggregate over. */
const METRIC_ALIASES = [
  { metric: 'speed', words: ['speed', 'velocity', 'fast', 'slow', 'fastest', 'slowest', 'km/s'] },
  { metric: 'halfAngle', words: ['half angle', 'halfangle', 'width', 'angular width', 'cone', 'span'] },
  { metric: 'maxKpIndex', words: ['kp', 'maxkp', 'index'] },
  { metric: 'kp90', words: ['kp90', 'kp 90'] },
  { metric: 'latitude', words: ['latitude', 'lat'] },
  { metric: 'longitude', words: ['longitude', 'lon', 'long'] },
  { metric: 'rmin_re', words: ['rmin', 'standoff'] }
];

const COMPARATORS = {
  'above': '>', 'over': '>', 'greater than': '>', 'more than': '>', 'higher than': '>', 'exceeds': '>', 'at least': '>=',
  'below': '<', 'under': '<', 'less than': '<', 'lower than': '<', 'at most': '<=',
  'exactly': '==', 'equal to': '=='
};

const AGGREGATORS = [
  { op: 'average', words: ['average', 'mean', 'avg', 'typical'] },
  { op: 'max', words: ['maximum', 'max', 'highest', 'largest', 'biggest', 'fastest', 'strongest', 'most extreme'] },
  { op: 'min', words: ['minimum', 'min', 'lowest', 'smallest', 'slowest', 'weakest'] },
  { op: 'sum', words: ['sum', 'total of', 'combined'] },
  { op: 'count', words: ['how many', 'count', 'number of', 'how much'] }
];

// ---------------------------------------------------------------------------
// 1. Classification
// ---------------------------------------------------------------------------

/**
 * Intent taxonomy. Ordered roughly by specificity — `pick` returns the first
 * intent whose keyword list matches, so put narrow intents above broad ones.
 */
const INTENTS = [
  { id: 'viz', words: ['visual', 'visualis', 'visualiz', 'chart', 'graph', 'plot', 'show me the', 'dashboard', 'open the', 'take me to', 'navigate'] },
  { id: 'dataQuery', words: ['how many', 'count', 'average', 'mean', 'median', 'maximum', 'minimum', 'fastest', 'slowest', 'list', 'show', 'top', 'filter', 'above', 'below', 'over', 'under', 'greater than', 'percentage', 'percent', 'statistic', 'calculate', 'compute', 'average speed'] },
  { id: 'anomaly', words: ['anomal', 'outlier', 'unusual', 'weird', 'standout', 'watch list', 'worth watching', 'strange'] },
  { id: 'correlation', words: ['correlat', 'relationship between', 'related to', 'association', 'pearson', 'r value', 'cause', 'why did', 'why does', 'led to', 'trigger', 'because', 'chain'] },
  { id: 'trend', words: ['trend', 'what changed', 'rising', 'falling', 'increase', 'decrease', 'over time', 'getting', 'evolving', 'deteriorat', 'improv'] },
  { id: 'compare', words: ['compare', 'comparison', ' vs ', 'versus', 'which is more', 'most active', 'most common', 'difference between', 'share', 'head to head', 'head-to-head'] },
  { id: 'briefing', words: ['summar', 'brief', 'report', 'situation', 'overview', 'assess', 'mission control', 'how is', 'how bad', 'status', 'current', 'telemetry', 'live'] },
  { id: 'db', words: ['database', 'sqlite', 'sql.js', 'db count', 'how many in db', 'storage', 'export', 'cached', 'persist'] },
  { id: 'explain', words: ['what is', 'what are', 'explain', 'define', 'meaning of', 'tell me about', 'teach me', 'how does', 'why is', 'learn'] },
  { id: 'engine', words: ['algorithm', 'scala', 'engine', 'processing', 'architecture', 'how are you built', 'stack', 'technology'] },
  { id: 'team', words: ['team', 'creator', 'author', 'who built', 'kailash', 'sriviknesh', 'who made', 'developer'] }
];

/**
 * Classify a query. Returns { intent, confidence, feed }.
 *
 * Confidence is deliberately coarse and honest: an exact keyword hit on a
 * specific intent is high, a single weak hit is low. Callers should treat
 * anything under `LOW_CONFIDENCE` as "ask what they meant" rather than
 * guessing, because a confidently wrong answer is worse than a question.
 */
export function classify(query) {
  const q = ` ${String(query || '').toLowerCase()} `;
  const feed = detectFeed(q);
  const metric = detectMetric(q);
  const number = extractNumber(q);

  let intent = null;
  let confidence = 0;

  for (const candidate of INTENTS) {
    const hits = candidate.words.filter((w) => q.includes(w));
    if (!hits.length) continue;
    // A bare "show"/"list" is weak evidence; a multi-word phrase is strong.
    const weight = hits.some((w) => w.includes(' ')) ? 0.85 : 0.6;
    if (weight > confidence) { confidence = weight; intent = candidate.id; }
    if (hits.length > 1) confidence = Math.min(0.95, confidence + 0.15);
  }

  // A concrete feed + metric + threshold is effectively a data query even if
  // none of the "how many / average" phrasings appeared.
  if (feed && (metric || number != null) && !intent) {
    intent = 'dataQuery';
    confidence = 0.7;
  }

  // Vague pronouns ("tell me more") inherit the previous turn's intent.
  if (!intent || confidence < 0.5) {
    const followUp = /^(tell me more|more|go on|and\?|why\??|elaborate|explain that|and then|what about that|continue|details?|really\??|ok|okay)/.test(q.trim());
    if (followUp) return { intent: 'followUp', confidence: 0.6, feed, metric, number };
  }

  return { intent: intent || 'unknown', confidence, feed, metric, number };
}

export const LOW_CONFIDENCE = 0.5;

function detectFeed(q) {
  // Longest aliases first so "radiation belt" beats "radiation".
  const hits = [];
  for (const { key, words } of FEED_ALIASES) {
    for (const w of words) if (q.includes(w)) hits.push({ key, len: w.length });
  }
  if (!hits.length) return null;
  hits.sort((a, b) => b.len - a.len);
  return hits[0].key;
}

function detectMetric(q) {
  for (const { metric, words } of METRIC_ALIASES) {
    if (words.some((w) => q.includes(w))) return metric;
  }
  return null;
}

function extractNumber(q) {
  const m = q.match(/(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// ---------------------------------------------------------------------------
// 2. Query executor — the part the old engine could not do
// ---------------------------------------------------------------------------

const numericOf = (row, field) => {
  const v = Number(row?.[field]);
  return Number.isFinite(v) ? v : null;
};

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const stdDev = (xs) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
const fmt = (n, digits = 1) => (Number.isFinite(n) ? Number(n.toFixed(digits)) : n);

export function stats(values) {
  if (!values.length) return null;
  return {
    n: values.length,
    mean: mean(values),
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    sum: values.reduce((a, b) => a + b, 0),
    stdDev: stdDev(values)
  };
}

/**
 * Execute a structured query against a feed.
 *
 * opts: { metric, comparator, threshold, aggregate, limit, sortBy, order }
 * Returns { rows, matched, stats, applied } — `applied` records what was
 * understood so ORBIT can echo it and the user can correct a misread.
 */
export function runQuery(data, feedKey, opts = {}) {
  const feed = FEED_BY_KEY[feedKey];
  if (!feed) return null;

  const rows = Array.isArray(data?.[feed.arrKey]) ? data[feed.arrKey] : [];
  const { metric, comparator, threshold, aggregate = 'count', limit = 5 } = opts;

  // --- filter -------------------------------------------------------------
  let matched = rows;
  if (comparator && threshold != null && metric) {
    matched = rows.filter((r) => {
      const v = numericOf(r, metric);
      if (v == null) return false;
      switch (comparator) {
        case '>': return v > threshold;
        case '>=': return v >= threshold;
        case '<': return v < threshold;
        case '<=': return v <= threshold;
        case '==': return v === threshold;
        default: return true;
      }
    });
  }

  // --- rank ---------------------------------------------------------------
  if (metric && (aggregate === 'max' || aggregate === 'min')) {
    const withVal = matched.filter((r) => numericOf(r, metric) != null);
    const sorted = [...withVal].sort((a, b) => numericOf(b, metric) - numericOf(a, metric));
    matched = aggregate === 'max' ? sorted : sorted.reverse();
  }

  // --- aggregate ----------------------------------------------------------
  const values = metric ? matched.map((r) => numericOf(r, metric)).filter((v) => v != null) : [];
  const s = stats(values);
  const unit = feed.numeric?.[metric] || '';

  const result = {
    feed, metric, unit,
    comparator, threshold,
    aggregate,
    total: rows.length,
    matched: matched.length,
    rows: matched.slice(0, limit),
    stats: s,
    applied: {
      filter: comparator && threshold != null ? `${metric} ${comparator} ${threshold}` : null,
      aggregate
    }
  };

  // Scalar answers for aggregate queries.
  if (aggregate === 'count') result.value = matched.length;
  if (aggregate === 'average' && s) result.value = fmt(s.mean, 1);
  if (aggregate === 'median' && s) result.value = fmt(s.median, 1);
  if (aggregate === 'max' && s) result.value = fmt(s.max, 1);
  if (aggregate === 'min' && s) result.value = fmt(s.min, 1);
  if (aggregate === 'sum' && s) result.value = fmt(s.sum, 1);

  return result;
}

// Comparative adjectives imply both an operator and a metric, so they must be
// resolved before the bare-comparator table below — "faster than 800" contains
// no word in COMPARATORS, yet is unambiguous.
const ADJECTIVES = [
  { words: ['faster', 'quicker'], comparator: '>', metric: 'speed' },
  { words: ['slower'], comparator: '<', metric: 'speed' },
  { words: ['wider', 'broader'], comparator: '>', metric: 'halfAngle' },
  { words: ['narrower', 'tighter'], comparator: '<', metric: 'halfAngle' },
  { words: ['stronger', 'worse', 'higher'], comparator: '>', metric: 'maxKpIndex' },
  { words: ['weaker', 'better', 'lower'], comparator: '<', metric: 'maxKpIndex' },
  { words: ['higher kp', 'bigger kp', 'greater kp'], comparator: '>', metric: 'maxKpIndex' },
  { words: ['lower kp', 'smaller kp', 'less kp'], comparator: '<', metric: 'maxKpIndex' }
];

/**
 * Parse an operator, threshold and (where implied) metric out of a query.
 *
 * Handles both explicit comparators ("above 1000", "under 500") and comparatives
 * ("faster than 800", "wider than 40") — the latter carry their metric in the
 * adjective itself. Returns { comparator, threshold, metric }.
 */
export function extractThreshold(q) {
  const lower = String(q || '').toLowerCase();
  const firstNumber = () => {
    const m = lower.match(/(-?\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : null;
  };

  // Adjectives first — they are more specific than a bare comparator.
  for (const adj of ADJECTIVES) {
    if (adj.words.some((w) => lower.includes(w))) {
      const threshold = firstNumber();
      if (threshold != null) return { comparator: adj.comparator, threshold, metric: adj.metric };
    }
  }

  for (const [word, op] of Object.entries(COMPARATORS)) {
    if (lower.includes(word)) {
      // Prefer a number following the operator; fall back to any number.
      const after = lower.slice(lower.indexOf(word) + word.length);
      const m = after.match(/(-?\d+(?:\.\d+)?)/) || lower.match(/(-?\d+(?:\.\d+)?)/);
      if (m) return { comparator: op, threshold: Number(m[1]), metric: null };
    }
  }

  return { comparator: null, threshold: null, metric: null };
}

// ---------------------------------------------------------------------------
// 3. Visualization routing — actually moves the user, not just names a chart
// ---------------------------------------------------------------------------

/**
 * Map a query to the SpaceGuard view + tab that renders it.
 * Returns { view, tab, label, chart } or null.
 */
export function routeViz(query, feedKey) {
  const q = String(query || '').toLowerCase();
  const feed = feedKey ? FEED_BY_KEY[feedKey] : null;

  // Explicit view requests win over feed inference.
  if (/\b(mission control|briefing|threat)\b/.test(q)) {
    return { view: 'mission-control', label: 'Mission Control', chart: 'Threat briefing + status indicators' };
  }
  if (/\b(timeline|relationship|chain|sequence|causal)\b/.test(q)) {
    return { view: 'timeline', label: 'Event Relationship Timeline', chart: 'Stage-to-stage Sankey + chronology' };
  }
  if (/\b(engine spec|documentation|algorithm|architecture)\b/.test(q)) {
    return { view: 'docs', label: 'Engine Specs', chart: 'Algorithms & space weather theory' };
  }
  if (/\b(direction|scatter|lat vs lon|position|where.*launch|geographic)\b/.test(q)) {
    return { view: 'dashboard', tab: 'cme-earth', label: 'CME Earth tab', chart: 'CME direction scatter (lat vs lon)' };
  }

  if (feed) {
    return { view: 'dashboard', tab: feed.tab, label: `${feed.name} (${feed.label})`, chart: bestChartFor(feed.key) };
  }
  return null;
}

/** The single most informative chart for a feed. */
export function bestChartFor(feedKey) {
  switch (feedKey) {
    case 'cmes': return 'CME direction scatter (lat vs lon, bubble = width, colour = speed)';
    case 'wes': return 'WSA-ENLIL Earth-arrival timeline';
    case 'flares': return 'Flare class donut + intensity rank timeline';
    case 'storms': return 'Kp area chart with G1/G3/G5 markers';
    case 'seps': return 'SEP particle-flux proxy line + Flare→CME→SEP timing';
    case 'ipss': return 'IPS arrival timeline + before/after wind change';
    case 'mpcs': return 'MPC crossing timeline + MPC/HSS/GST multi-line';
    case 'rbes': return 'RBE electron-flux proxy line + HSS/RBE/GST';
    case 'hss': return 'HSS wind speed line + RBE series';
    default: return 'Daily activity timeline';
  }
}

// ---------------------------------------------------------------------------
// 4. Conversation context
// ---------------------------------------------------------------------------

/**
 * Resolve a follow-up against the previous exchange.
 *
 * The old engine answered every message in isolation, so "why?" or "tell me
 * more" produced the generic fallback. This carries the last intent/feed/metric
 * forward so a follow-up inherits the subject.
 */
export function resolveContext(previous, query) {
  const c = classify(query);
  if (c.intent !== 'followUp') return { ...c, inherited: false };

  const prev = previous || {};
  return {
    intent: prev.intent || 'briefing',
    feed: c.feed || prev.feed || null,
    metric: c.metric || prev.metric || null,
    number: c.number ?? prev.number ?? null,
    confidence: 0.7,
    inherited: true
  };
}

// ---------------------------------------------------------------------------
// 5. Structured facts for the OpenRouter system prompt
// ---------------------------------------------------------------------------

/**
 * Compact, factual telemetry snapshot. Injected into the system prompt so the
 * LLM reasons over numbers rather than inventing them, and so a 700-token
 * response budget is spent on analysis instead of restating context.
 */
export function buildFacts({ data = {}, analysis = {}, sqliteCounts = {}, startDate, endDate, dataOrigin }) {
  const { status = {}, trends = {}, correlations = [], chains = [], anomalies = [] } = analysis || {};
  const db = sqliteCounts || {};

  const feedLines = FEEDS.map((f) => {
    const arr = data?.[f.arrKey] || [];
    return `${f.label}=${arr.length}`;
  }).join(' ');

  const trendLines = (trends.rows || [])
    .filter((r) => r.total > 0)
    .map((r) => `${r.label} ${r.direction} (${r.first}→${r.second})`)
    .join('; ') || 'flat across window';

  const corrLines = (correlations || [])
    .map((c) => `${c.pair} r=${Number(c.r).toFixed(2)} (${c.strength})`)
    .join('; ') || 'none measurable';

  const chainLines = (chains || [])
    .slice(0, 3)
    .map((c) => `${c.root}:${c.stages.join('>')}`)
    .join('; ') || 'none';

  return [
    `WINDOW ${startDate}→${endDate} source=${dataOrigin === 'cache' ? 'sqlite-cache' : 'donki-live'}`,
    `LIVE ${feedLines}`,
    `DB cmes=${db.cmes || 0} flares=${db.flares || 0} storms=${db.storms || 0} seps=${db.seps || 0} ipss=${db.ipss || 0} mpcs=${db.mpcs || 0} rbes=${db.rbes || 0} hss=${db.hss || 0} wes=${db.wes || 0} queries=${db.queries || 0}`,
    `THREAT ${status.overall?.label || 'n/a'} score=${status.overall?.score ?? 'n/a'}/100 gscale=${status.gScale || 'G0'} maxKp=${Number(status.maxKp || 0).toFixed(2)} avgKp=${Number(status.avgKp || 0).toFixed(2)} rscale=${status.rScale || 'n/a'} sscale=${status.sScale || 'n/a'}`,
    `CME peak=${status.peakSpeed ?? 'n/a'}km/s earthGB=${(data.cmes || []).filter((c) => c.isEarthGB).length}`,
    `TRENDS ${trendLines}`,
    `CORR ${corrLines}`,
    `CHAINS n=${(chains || []).length} complete=${(chains || []).filter((c) => c.stages.length >= 4).length} sample=[${chainLines}]`,
    `ANOMALIES n=${(anomalies || []).length}`,
    trends.speedTrend
      ? `SPEED mean=${Math.round(trends.speedTrend.mean)} median=${Math.round(trends.speedTrend.median)} sd=${Math.round(trends.speedTrend.stdDev)} slope=${trends.speedTrend.slopePerDay.toFixed(1)}/day`
      : 'SPEED n/a'
  ].join('\n');
}

export { FEED_BY_KEY };
