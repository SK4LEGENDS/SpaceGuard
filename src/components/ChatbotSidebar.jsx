import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bot, Send, Sparkles, X, RotateCcw,
  Zap, Sun, ShieldAlert, Activity, Compass, Database, Cpu, Sliders, BarChart3, GitBranch, TrendingUp, Sigma, LineChart
} from 'lucide-react';
import {
  buildMissionControlStatus, buildEventChains, buildTrends, buildCorrelations,
  buildAnomalies, buildActivityBreakdown, getAnalysisBrief
} from '../services/telemetryAnalysis';
import {
  resolveContext, runQuery, extractThreshold, routeViz,
  buildFacts, FEEDS, LOW_CONFIDENCE
} from '../services/orbitEngine';

// ORBIT models — Updated Sep 2026: qwen/qwen3-8b:free is now paid-only (404).
// Use resilient free router + stable gemma fallbacks via sequential retry.
const OPENROUTER_MODEL = 'openrouter/free';
const OPENROUTER_FALLBACK_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-20b:free',
];

// Central effective key resolver: prop -> localStorage -> Vite env
const getEffectiveOrbitKey = (propKey) => {
  if (propKey && propKey.trim().length > 10) return propKey.trim();
  try {
    const ls = localStorage.getItem('openrouter_api_key');
    if (ls && ls.trim().length > 10) return ls.trim();
  } catch {}
  try {
    const env = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (env && env.trim().length > 10) return env.trim();
  } catch {}
  return '';
};

export default function ChatbotSidebar({
  data,
  startDate,
  endDate,
  hasQueried,
  threatLevel,
  maxKp,
  dataOrigin,
  sqliteCounts,
  isOpen,
  setIsOpen,
  openRouterApiKey,
  onNavigate,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `👋 **Hello! I am ORBIT** — the intelligence layer of SpaceGuard.\n\nI read your live 9-feed window *and* the persisted 10-table database, then reason over the same analysis engine behind Mission Control and the Event Relationship Timeline. I don't just return rows — I calculate, compare, correlate and explain.\n\n- 🔎 **Ask in plain language** — *"how many CMEs faster than 1000?"*, *"average storm Kp"*, *"widest CME this week"*\n- 📊 **Real calculations** — count, average, median, min/max, spread and filtered subsets over any of the 9 feeds\n- 🔗 **Event correlation** — CME speed vs. peak Kp (Pearson r), flare→CME and SEP→parent rates, full stage chains\n- 📈 **Comparison & trends** — first vs. second half, activity share, velocity regression\n- 🚨 **Briefings** — threat assessment, hazard score, NOAA scales, anomaly watch list\n- 📊 **Visualization help** — ask *"show me the direction plot"* and I'll take you to the right tab\n- 🧠 **Conversational** — follow-ups like *"why?"* or *"tell me more"* keep the same subject\n- 🛡️ **Offline fallback** — works with no API key, using the local engine\n\nTry a quick prompt below, or ask *"how many CMEs above 1200 km/s?"*`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Last turn's classification, so follow-ups ("why?", "more") inherit the
  // subject instead of falling through to the generic help message.
  const lastIntentRef = useRef(null);

  // ---- ORBIT data-awareness layer -----------------------------------------
  // ORBIT reasons over derived analytics (status / chains / trends / correlations)
  // instead of echoing raw arrays. Identical layer powers Mission Control + Timeline.
  const analysis = useMemo(() => {
    const safeData = data || {};
    const status = buildMissionControlStatus(safeData, startDate, endDate);
    const chains = buildEventChains(safeData, startDate, endDate);
    const trends = buildTrends(safeData, startDate, endDate);
    const correlations = buildCorrelations(safeData, chains);
    const anomalies = buildAnomalies(safeData, chains);
    const breakdown = buildActivityBreakdown(safeData);
    const brief = getAnalysisBrief(safeData, startDate, endDate, { dataOrigin, sqliteCounts });
    return { status, chains, trends, correlations, anomalies, breakdown, brief };
  }, [data, startDate, endDate, dataOrigin, sqliteCounts]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // =========================================================================
  // ORBIT v2 — engine-driven handlers.
  // These run BEFORE the legacy keyword chain below. Anything the engine
  // handles confidently returns early; otherwise we defer to generateLocalResponse.
  // =========================================================================

  const fmtTime = (t) => (t && t !== 'N/A' ? String(t).slice(0, 16).replace('T', ' ') : '—');

  /**
   * Visualization assistance — resolves the query to a view + tab and, when a
   * navigator was supplied, actually moves the user there. Returns a message.
   */
  const handleVizRequest = (query, feedKey) => {
    const route = routeViz(query, feedKey);
    if (!route) {
      return `📊 I can take you to any view. Try:\n- *"show me the CME direction plot"* → CME Earth tab\n- *"open the stage flow"* → Event Relationship Timeline\n- *"mission control"* → threat briefing\n- *"engine specs"* → algorithms & theory\n\nOr name a feed: *"chart the RBE data"*.`;
    }

    const { view, tab, label, chart } = route;
    let msg = `📊 **${label}**\n\nBest view for that: **${chart}**`;

    if (onNavigate) {
      onNavigate(view, tab);
      msg += `\n\n✅ Taking you there now.`;
    } else {
      msg += `\n\n_(Open ORBIT from the Dashboard or Timeline to let me navigate for you.)_`;
    }
    return msg;
  };

  /**
   * Structured data query — the capability the old engine could not do at all.
   * Handles "how many X above N", "average X", "fastest X", "widest X" etc.
   */
  const handleDataQuery = (query, cls) => {
    if (!hasQueried) {
      return `⚠️ **Nothing loaded yet.**\n\nI query live telemetry, so I need a window first. The current range is \`${startDate}\` → \`${endDate}\` — set it and hit **"Query Live API"**, then ask me things like *"how many CMEs above 1000 km/s?"*.`;
    }

    // extractThreshold resolves both explicit comparators ("above 1000") and
    // comparatives ("faster than 800"), the latter also yielding a metric.
    const { comparator: cmp, threshold, metric: adjMetric } = extractThreshold(query);
    const metric = cls.metric || adjMetric || null;
    const operator = cmp || null;
    const value = threshold ?? cls.number;

    // Which feed? Use the one named, else infer from the metric.
    let feedKey = cls.feed;
    if (!feedKey) {
      if (metric === 'maxKpIndex' || metric === 'kp90') feedKey = 'storms';
      else if (metric === 'speed' || metric === 'halfAngle') feedKey = 'cmes';
      else if (metric === 'latitude' || metric === 'longitude') feedKey = 'cmes';
    }

    if (!feedKey) {
      const counts = FEEDS.map((f) => `${f.icon} ${f.label}: ${(data?.[f.arrKey] || []).length}`).join('  ·  ');
      return `🔎 **Which feed do you mean?**\n\n${counts}\n\nTry *"how many CMEs above 1000 km/s?"*, *"average storm Kp"*, or *"fastest flare"*.`;
    }

    // Aggregate: max for "fastest/largest/widest/strongest", etc.
    const l = query.toLowerCase();
    let aggregate = 'count';
    if (/average|mean|avg/.test(l)) aggregate = 'average';
    else if (/median/.test(l)) aggregate = 'median';
    else if (/fastest|highest|largest|biggest|strongest|maximum|most extreme|widest|newest|latest|most recent/.test(l)) aggregate = 'max';
    else if (/slowest|lowest|smallest|weakest|minimum|narrowest|oldest/.test(l)) aggregate = 'min';
    else if (/total|sum|combined/.test(l)) aggregate = 'sum';
    else if (/top|list|show|first/.test(l)) aggregate = 'max';

    // "fastest flare" has no numeric metric — rank by a sensible default.
    let effectiveMetric = metric;
    if (!effectiveMetric) {
      if (feedKey === 'flares') effectiveMetric = null;
      else if (feedKey === 'storms') effectiveMetric = 'maxKpIndex';
      else if (feedKey === 'wes') effectiveMetric = 'speed';
      else effectiveMetric = 'speed';
    }

    const res = runQuery(data, feedKey, {
      metric: effectiveMetric,
      comparator: operator,
      threshold: value,
      aggregate,
      limit: 5
    });

    if (!res) return `⚠️ I couldn't run that — unknown feed \`${feedKey}\`.`;

    const feed = res.feed;
    const unit = res.unit;
    const filterNote = res.applied.filter ? ` (${res.applied.filter})` : '';
    const win = `\`${startDate}\`→\`${endDate}\``;

    if (!res.matched) {
      return `🔎 **No ${feed.plural} match** ${filterNote} in ${win}.\n\nThe window has **${res.total}** ${feed.plural} in total. Try relaxing the threshold — ask *"fastest ${feed.label}"* to see the top of the range.`;
    }

    // --- Scalar answer ------------------------------------------------------
    if (aggregate === 'count' && !['top', 'list', 'show', 'first'].some((w) => l.includes(w))) {
      const s = res.stats;
      let extra = '';
      if (s && effectiveMetric) {
        extra = `\n\nAcross the ${s.n} matching event${s.n === 1 ? '' : 's'}, ${feed.numeric?.[effectiveMetric] ? effectiveMetric : 'the metric'} ranged **${Math.round(s.min)}–${Math.round(s.max)}${unit}** (mean **${Math.round(s.mean)}${unit}**, σ ${Math.round(s.stdDev)}).`;
      }
      const viz = routeViz('', feedKey);
      return `🔎 **${res.matched} ${feed.plural}**${filterNote} out of ${res.total} in ${win}.${extra}\n\n_Best chart: ${viz?.chart || '—'}_`;
    }

    // --- Ranked / aggregate list -------------------------------------------
    const head = aggregate === 'average' ? `**Average**` : aggregate === 'median' ? `**Median**` : aggregate === 'sum' ? `**Sum**` : aggregate === 'min' ? `**Lowest**` : `**Top**`;
    const scalarLine = res.value != null
      ? `${head} ${feed.label} ${effectiveMetric || ''} = **${res.value}${unit}**\n\n`
      : '';

    const list = res.rows.map((r, i) => {
      const id = r[feed.idField] || 'N/A';
      const val = effectiveMetric ? numericVal(r[effectiveMetric]) : null;
      const time = fmtTime(r[feed.timeField]);
      const valStr = val != null ? ` — **${val}${unit}**` : '';
      return `${i + 1}. \`${id}\`${valStr} @ \`${time}\``;
    }).join('\n');

    const spread = res.stats
      ? `\n\n**Distribution**: min **${Math.round(res.stats.min)}${unit}** · median **${Math.round(res.stats.median)}${unit}** · mean **${Math.round(res.stats.mean)}${unit}** · max **${Math.round(res.stats.max)}${unit}** · σ **${Math.round(res.stats.stdDev)}**`
      : '';

    const viz = routeViz('', feedKey);
    const nav = onNavigate ? `\n\n_📊 Say "show me the chart" to open **${viz?.label}**._` : '';

    return `${scalarLine}**${feed.icon} ${res.matched} of ${res.total} ${feed.plural}**${filterNote} in ${win}:\n\n${list}${spread}${nav}`;
  };

  const numericVal = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  };

  // =========================================================================
  // Legacy keyword engine (unchanged) — handles explain/db/engine/team and the
  // long-form narrative branches the engine doesn't cover.
  // =========================================================================
  const generateLocalResponse = (rawQuery) => {
    const q = rawQuery.toLowerCase().trim();

    // Helpers for DB-aware answers
    const totalCmes = data.cmes?.length || 0;
    const totalFlares = data.flares?.length || 0;
    const totalStorms = data.storms?.length || 0;
    const totalSeps = data.seps?.length || 0;
    const totalIpss = data.ipss?.length || 0;
    const totalMpcs = data.mpcs?.length || 0;
    const totalRbes = data.rbes?.length || 0;
    const totalHss = data.hss?.length || 0;
    const totalWes = data.wes?.length || 0;
    const db = sqliteCounts || {};

    // 6.5 INTELLIGENT ANALYTICS — summaries, comparisons, trends, relationships
    const { status: mc, chains, trends, correlations, anomalies, breakdown } = analysis;

    const noData = () =>
      `⚠️ **No Telemetry Analysed Yet**\n\nI need a queried window before I can analyse it. Set a range (currently \`${startDate}\` → \`${endDate}\`) and click **"Query Live API"**. Once loaded, ask me: *"summarise"*, *"what changed"*, *"how does X compare to Y"*, *"what caused the storm"* or *"any anomalies"*.`;

    // 6.5a. Anomaly / watch list
    if (q.includes('anomal') || q.includes('outlier') || q.includes('unusual') || q.includes('weird') || q.includes('watch list') || q.includes('standout')) {
      if (!hasQueried) return noData();
      if (!anomalies.length) return `✅ **No anomalies detected** in \`${startDate}→${endDate}\`.\n\nAll CME speeds sit within 2σ of the window mean, no storm reached Kp ≥ 7, and no X-class flares were recorded.`;
      return `⚠️ **Anomalies & Watch List — ${anomalies.length} flagged** (${startDate}→${endDate})\n\n` +
        anomalies.slice(0, 8).map((a, i) => {
          const when = a.time ? ` @ \`${String(a.time).slice(0, 16).replace('T', ' ')}\`` : '';
          return `${i + 1}. **\`${a.id}\`**${when} — ${a.note}`;
        }).join('\n');
    }

    // 6.5b. Relationship / cause / why questions
    if ((q.includes('caus') || q.includes('why') || q.includes('relat') || q.includes('connect') || q.includes('sequence') || q.includes('chain') || q.includes('trigger') || q.includes('led to') || q.includes('because of')) &&
        !q.includes('g3') && !q.includes('g1') && !q.includes('g5')) {
      if (!hasQueried) return noData();
      if (!chains.length) return `🔗 **No multi-stage chains resolved** in this window.\n\nA chain needs at least two causally-linked events (e.g. a flare preceding a CME, or a shock followed by a storm). Open **Event Relationship Timeline** to inspect the reconstruction logic.`;
      const full = chains.filter((c) => c.stages.length >= 3);
      return `🔗 **Event Relationships — ${chains.length} chains reconstructed** (${full.length} spanning 3+ stages)\n\n` +
        chains.slice(0, 5).map((c) => {
          const path = c.nodes.filter((n) => !n.id.startsWith('mpc-')).map((n) => {
            const stageName = { flare: 'Flare', cme: 'CME', wind: 'Wind', storm: 'Storm', radiation: 'Radiation' }[n.stage];
            return `**${stageName}** \`${String(n.time || '—').slice(0, 16).replace('T', ' ')}\``;
          }).join(' → ');
          return `- \`${c.root}\` (confidence ${Math.round(c.confidence * 100)}%, span ${c.durationHours != null ? c.durationHours.toFixed(1) : '—'} h)\n  ${path}`;
        }).join('\n') +
        (correlations.length ? `\n\n**Measured associations**:\n` + correlations.map((c) => `- ${c.pair}: ${c.strength} ${c.direction} (r=${c.r.toFixed(2)}) — ${c.note}`).join('\n') : '');
    }

    // 6.5c. Trends / change over time
    if (q.includes('trend') || q.includes('what changed') || q.includes('rising') || q.includes('falling') || q.includes('increase') || q.includes('decrease') || q.includes('over time') || q.includes('getting')) {
      if (!hasQueried) return noData();
      const lines = trends.rows.map((r) => {
        const arrow = r.direction === 'rising' ? '▲ rising' : r.direction === 'falling' ? '▼ falling' : '— flat';
        const pct = r.pctChange != null ? ` (${r.pctChange > 0 ? '+' : ''}${r.pctChange}%)` : '';
        return `- **${r.label}**: ${r.first} → ${r.second} ${arrow}${pct}`;
      });
      const st = trends.speedTrend;
      return `📈 **Trends — first vs second half of** \`${startDate}→${endDate}\` **(${trends.days} days)**\n\n` +
        lines.join('\n') +
        (st ? `\n\n**CME velocity distribution**\n- mean **${Math.round(st.mean)} km/s**, median **${Math.round(st.median)} km/s**, σ **${Math.round(st.stdDev)} km/s**\n- regression slope **${st.slopePerDay.toFixed(1)} km/s per day** (${st.slopePerDay > 0.5 ? 'accelerating' : st.slopePerDay < -0.5 ? 'decelerating' : 'stable'})` : '') +
        `\n\nComposite hazard score: **${mc.overall.score}/100** (${mc.overall.label}).`;
    }

    // 6.5d. Comparisons (X vs Y, or most/least active)
    if (q.includes('compare') || q.includes('comparison') || q.includes(' vs ') || q.includes('versus') || q.includes('which is more') || q.includes('most active') || q.includes('most common') || q.includes('difference between') || q.includes('share')) {
      if (!hasQueried) return noData();
      const sorted = [...breakdown].sort((a, b) => b.value - a.value);
      const totalEvents = breakdown.reduce((s, b) => s + b.value, 0);
      const top = sorted[0];
      const least = sorted[sorted.length - 1];
      const rising = trends.rows.filter((r) => r.direction === 'rising').sort((a, b) => b.delta - a.delta)[0];
      const falling = trends.rows.filter((r) => r.direction === 'falling').sort((a, b) => a.delta - b.delta)[0];
      return `⚖️ **Comparison — ${startDate}→${endDate}** (${totalEvents} total events)\n\n` +
        `**Activity share by feed**:\n` +
        sorted.map((b) => `- **${b.name}**: ${b.value} events (${b.share}%)`).join('\n') +
        `\n\n**Head-to-head**\n- Most active feed: **${top.name}** (${top.value} events, ${top.share}%)\n- Least active feed: **${least.name}** (${least.value} events)\n- Biggest riser (2nd half vs 1st): **${rising ? rising.label : 'none'}** ${rising ? `(+${rising.delta})` : ''}\n- Biggest faller: **${falling ? falling.label : 'none'}** ${falling ? `(${falling.delta})` : ''}\n\n` +
        `**Hazard comparison**\n- Eruption risk (CME ${mc.totals.cmes} events, peak ${mc.peakSpeed} km/s) vs geomagnetic risk (${mc.totals.storms} storms, max Kp ${mc.maxKp.toFixed(2)}, NOAA ${mc.gScale})\n- Radiation load: ${mc.totals.seps} SEP + ${mc.totals.rbes} RBE (NOAA ${mc.sScale})\n- Solar wind: ${mc.totals.hss} HSS + ${mc.totals.ipss} shocks + ${mc.totals.mpcs} MPC crossings`;
    }

    // 6.5e. Full analytical summary (default for "summarise/analys/brief")
    if (q.includes('summar') || q.includes('analys') || q.includes('analyz') || q.includes('brief') || q.includes('report') || q.includes('situation') || q.includes('assess') || q.includes('mission control') || q.includes('overview')) {
      if (!hasQueried) return noData();
      return `🛰️ **ORBIT Telemetry Analysis — ${startDate}→${endDate}** (${mc.days} days)\n` +
        `📡 Source: **${dataOrigin === 'cache' ? 'SQLite cache' : 'NASA DONKI live API'}**\n\n` +
        `**Overall assessment**: ${mc.overall.label} — composite hazard **${mc.overall.score}/100**\n` +
        `- NOAA **${mc.gScale}** (${mc.gLabel}) from max Kp **${mc.maxKp.toFixed(2)}**, avg Kp ${mc.avgKp.toFixed(2)}\n` +
        `- Radio blackout **${mc.rScale}**, radiation storm **${mc.sScale}**\n\n` +
        `**Indicator breakdown**\n` +
        mc.indicators.map((i) => `- ${i.label}: **${i.value}** ${i.unit} — ${i.statusLabel} (risk ${i.level}/100, ${i.rate}/day). ${i.detail}`).join('\n') +
        `\n\n**Relationships**: ${chains.length} causal chains reconstructed; ${chains.filter((c) => c.stages.length >= 4).length} fully resolve Flare → CME → Solar Wind → Storm.\n` +
        (correlations.length ? correlations.slice(0, 3).map((c) => `- ${c.pair}: ${c.strength} ${c.direction} (r=${c.r.toFixed(2)})`).join('\n') : '') +
        `\n\n**Trend**: ` +
        (trends.rows.filter((r) => r.direction !== 'flat').length
          ? trends.rows.filter((r) => r.direction !== 'flat').map((r) => `${r.label} ${r.direction} (${r.first}→${r.second})`).join(', ')
          : 'activity is flat across the window') +
        (anomalies.length ? `\n\n**Watch list**: ${anomalies.slice(0, 3).map((a) => `\`${a.id}\` ${a.value}`).join(' • ')}` : '');
    }

    // 6.5f. Follow-up to a specific CME / chain by name
    const idMatch = rawQuery.match(/\b(20\d{2}-\d{2}-\d{2}T\d{6}|\d{4}-\d{2}-\d{2})\b/);
    if (idMatch) {
      const hit = chains.find((c) => (c.root || '').toLowerCase().includes(idMatch[1].toLowerCase()));
      if (hit) {
        return `🔎 **Chain trace for \`${hit.root}\`** (confidence ${Math.round(hit.confidence * 100)}%)\n\n` +
          hit.nodes.filter((n) => !n.id.startsWith('mpc-')).map((n) => {
            const stageName = { flare: 'Flare', cme: 'CME', wind: 'Solar Wind', storm: 'Storm', radiation: 'Radiation' }[n.stage];
            return `- **${stageName}** @ \`${String(n.time || '—').slice(0, 16).replace('T', ' ')}\` → ${n.label}\n  ${n.detail}`;
          }).join('\n') +
          `\n\n${hit.summary} Full span: ${hit.durationHours != null ? `${hit.durationHours.toFixed(1)} h` : '—'}.`;
      }
    }


    // 0. DATABASE / SQLITE intent — explicit DB access
    if (q.includes('database') || q.includes('sqlite') || q.includes('sql.js') || q.includes('db count') || q.includes('how many in db') || q.includes('storage') || q.includes('cache') && (q.includes('how') || q.includes('count') || q.includes('stored'))) {
      if (q.includes('export') || q.includes('download') || q.includes('.db')) {
        return `💾 **SQLite Database — Export**\n\n` +
          `SpaceGuard runs **sql.js (WASM SQLite 3)** in-browser.\n` +
          `- Click **".db Export"** (top bar) to download \`spaceguard.db\` — contains all 9 tables.\n` +
          `- File includes \`${db.queries||0}\` cached date-range queries.\n\n` +
          `**Tip**: Query a range once → revisit instantly (0 API calls) — see \`query_cache\` table.`;
      }
      return `💾 **SQLite WASM — 9-Table Store (DB Access Active)**\n\n` +
        `**Browser DB (sql.js WASM)** — live cache behind the dashboard:\n` +
        `- **Live window (\`${startDate}→${endDate}\`)**: CME \`${totalCmes}\`, FLR \`${totalFlares}\`, GST \`${totalStorms}\`, SEP \`${totalSeps}\`, IPS \`${totalIpss}\`, MPC \`${totalMpcs}\`, RBE \`${totalRbes}\`, HSS \`${totalHss}\`, WSA-ENLIL inputs \`${totalWes}\`\n` +
        `- **Persisted DB totals (all queried ranges)**: CMEs \`${db.cmes||0}\`, Flares \`${db.flares||0}\`, Storms \`${db.storms||0}\`, SEP \`${db.seps||0}\`, IPS \`${db.ipss||0}\`, MPC \`${db.mpcs||0}\`, RBE \`${db.rbes||0}\`, HSS \`${db.hss||0}\`, WSA \`${db.wes||0}\`, Queries \`${db.queries||0}\`\n` +
        `- **Source now**: **${dataOrigin === 'cache' ? 'SQLite Browser Cache (0 API Calls)' : 'NASA DONKI Live REST API (9 feeds)'}**\n` +
        `- **Schema**: \`cme_events\`(11 cols incl. lat/lon/linked), \`solar_flare_events\`, \`geomagnetic_storm_events\`, \`sep_events\`, \`ips_events\`, \`mpc_events\`, \`rbe_events\`, \`hss_events\`, \`wsa_enlil_events\`\n\n` +
        `Ask: *"list fastest CME"* or *"show WSA Earth arrivals"* — I read directly from \`data\` (live) and \`sqliteCounts\` (DB).`;
    }

    // 1. Live Telemetry Briefing — now 9 feeds
    if (q.includes('current') || q.includes('status') || q.includes('summar') || q.includes('telemetry') || q.includes('live') || q.includes('brief')) {
      if (!hasQueried) {
        return `⚠️ **No Data Queried Yet**\n\nPlease select a date range (currently set to \`${startDate}\` to \`${endDate}\`) and click **"Query Live API"** in the top bar to ingest 9 solar feeds (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSA-ENLIL).`;
      }

      const peakSpeed = totalCmes > 0 ? Math.max(...data.cmes.map(c => c.speed || 0)) : 0;
      const earthCmes = data.cmes?.filter(c => c.isEarthGB) || [];
      const earthWsa = data.wes?.filter(w => w.isEarthGB) || [];
      const xFlares = data.flares?.filter(f => (f.classType || '').startsWith('X')) || [];
      const mFlares = data.flares?.filter(f => (f.classType || '').startsWith('M')) || [];

      return `🛰️ **Live Space Weather Status — 9 Feeds / 8 Phenomena**\n` +
        `📅 **Window**: \`${startDate}\` to \`${endDate}\`\n` +
        `🗄️ **Source**: **${dataOrigin === 'cache' ? 'SQLite Browser Cache (0 API Calls)' : 'NASA DONKI Live REST API (9 feeds, parallel Futures, 120s Await)'}**\n\n` +
        `**Hazard Assessment**:\n` +
        `- **Threat Level**: **${threatLevel?.level || 'Quiet'}** (${threatLevel?.gScale || 'G0'})\n` +
        `- **Max Planetary Kp**: \`${maxKp?.toFixed(2) || '0.00'}\` (Kp-only G-scale: G1≥5 G2≥6 G3≥7 G4≥8 G5≥9)\n\n` +
        `**Telemetry Events (live window)**:\n` +
        `- 💥 **CME**: **${totalCmes}** (Peak **${peakSpeed} km/s**, Earth-GB **${earthCmes.length}**)\n` +
        `- ☀️ **Flares**: **${totalFlares}** (X **${xFlares.length}**, M **${mFlares.length}**)\n` +
        `- ⚡ **GST Storms**: **${totalStorms}**\n` +
        `- ⚛️ **SEP**: **${totalSeps}** (linked CME **${data.seps?.filter(s=>s.linkedCME)?.length||0}**)\n` +
        `- 🌊 **IPS**: **${totalIpss}**\n` +
        `- 🧲 **MPC Crossings**: **${totalMpcs}**\n` +
        `- 🛰️ **RBE**: **${totalRbes}** (electron flux proxy)\n` +
        `- 💨 **HSS Streams**: **${totalHss}**\n` +
        `- 🛰️ **WSA-ENLIL Simulations**: **${totalWes}** inputs (Earth-GB **${earthWsa.length}**)\n\n` +
        `**Persisted DB totals**: see *"how many in db"* — I have full DB access via \`sqliteCounts\`.`;
    }

    // 1b. Explain threat / G-scale (handles "why G3/strong alert" without truncation)
    if ((q.includes('why') || q.includes('explain')) && (q.includes('g3') || q.includes('g1') || q.includes('g5') || q.includes('strong') || q.includes('threat') || q.includes('alert') || q.includes('storm'))) {
      return `✅ **Threat Level: ${threatLevel?.level || 'Quiet'} (${threatLevel?.gScale || 'G0'})**\n- **Rule**: NOAA G-scale is **Kp-only** — G1 Kp≥5, G2 Kp≥6, G3 Kp≥7, G4 Kp≥8, G5 Kp≥9 (from GST \`/GST\` data).\n- **Current max Kp**: \`${maxKp?.toFixed(2) || '0.00'}\` from ${data.storms?.length || 0} GST events in \`${startDate}→${endDate}\`.\n- **CME speed / M-X flares do NOT set G-scale** — they are R-scale/eruption metrics. If Kp is 0.00 → **G0 Quiet** is correct, even with ${data.cmes?.length || 0} CMEs (peak ${(() => { const s = data.cmes?.map(c=>c.speed||0); return s?.length?Math.max(...s):0; })()} km/s).\n*If you saw G3 with Kp 0.00, it was old flare-weighted logic — now fixed to Kp-only.*`;
    }

    // 2. 6 Core Scala Algorithms
    if (q.includes('algorithm') || q.includes('scala') || q.includes('math') || q.includes('engine') || q.includes('processing')) {
      return `⚙️ **The 6 Core Scala Algorithms**:\n\n` +
        `1. **Multi-Stream Ingestion**: Parallel non-blocking \`Future[Seq[Event]]\` pipelines across 5 DONKI endpoints.\n\n` +
        `2. **CME Trajectory Filter**: Triangulates CME half-width cone angle \`θ\`, 3D vector, and radial speed (\`v_r > 500\\text{ km/s}\`) to isolate Earth-directed halo events.\n\n` +
        `3. **Flare Flux Ranking**: Normalizes GOES soft X-ray flux into logarithmic irradiance (\`10^{-8}\` to \`10^{-4}\\text{ W/m}^2\`), ranking A, B, C, M, and X flares.\n\n` +
        `4. **Kp Hazard Reduction**: Folds multi-station 3-hour planetary Kp arrays to compute \`Kp_{max}\` and categorize NOAA G1–G5 storm scales.\n\n` +
        `5. **Descriptive Statistics**: One-pass \\(O(N)\\) calculation of mean velocity, variance, and speed histograms.\n\n` +
        `6. **Idempotent SQLite Persistence**: Uses \`INSERT OR IGNORE\` batch transactions to eliminate duplicate entries on repeat date queries.`;
    }

    // 3. Difference between CME & Solar Flare
    if ((q.includes('difference') || q.includes('vs') || q.includes('compare')) && (q.includes('cme') || q.includes('flare'))) {
      return `🔭 **CME vs Solar Flare**:\n\n` +
        `☀️ **Solar Flare**:\n` +
        `- **Nature**: Flash burst of electromagnetic radiation (photons, X-rays).\n` +
        `- **Speed**: Travels at the **speed of light** (reaches Earth in **8.3 minutes**).\n` +
        `- **Impact**: Ionizes upper atmosphere, causing **HF radio blackouts (R1–R5)**.\n\n` +
        `💥 **Coronal Mass Ejection (CME)**:\n` +
        `- **Nature**: Massive cloud of magnetized plasma (electrons & protons).\n` +
        `- **Speed**: Moves at **300 to 3,000+ km/s** (takes **1 to 4 days** to reach Earth).\n` +
        `- **Impact**: Compresses Earth's magnetosphere, causing **Geomagnetic Storms (G1–G5)** and auroras.`;
    }

    // 3b. List / DB sample — direct data access (e.g., "list MPC", "fastest CME", "show WSA")
    if ((q.includes('list') || q.includes('show') || q.includes('top') || q.includes('fastest') || q.includes('largest') || q.includes('recent') || q.includes('example')) && (q.includes('cme') || q.includes('flare') || q.includes('flr') || q.includes('storm') || q.includes('gst') || q.includes('sep') || q.includes('ips') || q.includes('mpc') || q.includes('rbe') || q.includes('hss') || q.includes('wsa') || q.includes('enlil'))) {
      if (q.includes('cme') && !q.includes('rbe') && !q.includes('hss')) {
        const sorted = [...(data.cmes||[])].sort((a,b)=>(b.speed||0)-(a.speed||0)).slice(0,3);
        if (!sorted.length) return `💥 **CME List** — No CMEs in \`${startDate}→${endDate}\` (live window). Try a stormier range or check DB totals: \`${db.cmes||0}\` CMEs persisted.`;
        const fastest = sorted[0];
        return `💥 **CME Sample — Fastest First (live window \`${startDate}→${endDate}\`)** — Total **${totalCmes}**, DB total \`${db.cmes||0}\`\n` +
          sorted.map((c,i)=> `${i+1}. \`${c.activityID}\` — **${c.speed} km/s**, half-angle **${c.halfAngle}°**, lat **${c.latitude??'N/A'}**, lon **${c.longitude??'N/A'}**, type **${c.cmeType}**, Earth-GB **${c.isEarthGB?'YES':'no'}**${c.enlilArrival?`, WSA arrival \`${c.enlilArrival}\``:''}\n   Source: \`${c.sourceLocation}\``).join('\n') +
          (q.includes('fastest') && fastest? `\n\n**Fastest**: \`${fastest.activityID}\` @ **${fastest.speed} km/s**` : '');
      }
      if (q.includes('flare') || q.includes('flr')) {
        const sorted = [...(data.flares||[])].sort((a,b)=> (b.classType||'').localeCompare(a.classType||'')).slice(0,3);
        if (!sorted.length) return `☀️ **Flare List** — No flares in window. DB: \`${db.flares||0}\` flares.`;
        return `☀️ **Flares Sample (live)** — Total **${totalFlares}**, DB \`${db.flares||0}\`\n` + sorted.map((f,i)=> `${i+1}. \`${f.flareID}\` — **${f.classType}**, peak \`${f.peakTime}\`, region \`${f.sourceLocation}\``).join('\n');
      }
      if (q.includes('mpc')) {
        const sample = (data.mpcs||[]).slice(0,3);
        if (!sample.length) return `🧲 **MPC List** — No MPC crossings in \`${startDate}→${endDate}\`. DB totals: \`${db.mpcs||0}\` MPC.`;
        return `🧲 **MPC Sample — Magnetopause Crossings** — Live **${totalMpcs}**, DB \`${db.mpcs||0}\`\n` + sample.map((m,i)=> `${i+1}. \`${m.mpcID}\` @ \`${m.eventTime}\` via \`${m.instrument}\` linked: \`${(m.linkedEvents||[]).slice(0,2).join(',')||'none'}\``).join('\n');
      }
      if (q.includes('rbe')) {
        const sample = (data.rbes||[]).slice(0,3);
        if (!sample.length) return `🛰️ **RBE List** — No RBE in window. DB: \`${db.rbes||0}\` RBE.`;
        return `🛰️ **RBE Sample — Radiation Belt Enhancements** — Live **${totalRbes}**, DB \`${db.rbes||0}\`\n` + sample.map((r,i)=> `${i+1}. \`${r.rbeID}\` @ \`${r.eventTime}\` instr \`${r.instrument}\``).join('\n');
      }
      if (q.includes('hss')) {
        const sample = (data.hss||[]).slice(0,3);
        if (!sample.length) return `💨 **HSS List** — No HSS in window. DB: \`${db.hss||0}\` HSS.`;
        return `💨 **HSS Sample — High-Speed Streams** — Live **${totalHss}**, DB \`${db.hss||0}\`\n` + sample.map((h,i)=> `${i+1}. \`${h.hssID}\` @ \`${h.eventTime}\` instr \`${h.instrument?.substring(0,40)}\``).join('\n');
      }
      if (q.includes('wsa') || q.includes('enlil')) {
        const sample = (data.wes||[]).filter(w=>w.isEarthGB).slice(0,3);
        const pool = sample.length? sample : (data.wes||[]).slice(0,3);
        if (!pool.length) return `🛰️ **WSA-ENLIL List** — No simulations in window. DB: \`${db.wes||0}\` inputs.`;
        return `🛰️ **WSA-ENLIL Sample — Predictions (Earth-GB first)** — Live **${totalWes}** inputs, **${data.wes?.filter(w=>w.isEarthGB)?.length||0}** Earth-GB, DB \`${db.wes||0}\`\n` + pool.map((w,i)=> `${i+1}. \`${w.simulationID}\` CME \`${w.cmeID||'N/A'}\` → arrival \`${w.estimatedShockArrivalTime||'pending'}\` GB:${w.isEarthGB?'YES':'no'} Kp90:${w.kp90??'N/A'} speed:${w.speed??'N/A'}km/s`).join('\n');
      }
      if (q.includes('ips') || q.includes('shock')) {
        const sample = (data.ipss||[]).slice(0,3);
        if (!sample.length) return `🌊 **IPS List** — No shocks. DB: \`${db.ipss||0}\` IPS.`;
        return `🌊 **IPS Sample — Shock Arrivals** — Live **${totalIpss}**, DB \`${db.ipss||0}\`\n` + sample.map((s,i)=> `${i+1}. \`${s.ipsID}\` @ \`${s.eventTime}\` loc \`${s.location}\` instr \`${s.instrument}\``).join('\n');
      }
      if (q.includes('sep')) {
        const sample = (data.seps||[]).slice(0,3);
        if (!sample.length) return `⚛️ **SEP List** — No SEP in window. DB: \`${db.seps||0}\` SEP.`;
        return `⚛️ **SEP Sample** — Live **${totalSeps}**, DB \`${db.seps||0}\`\n` + sample.map((s,i)=> `${i+1}. \`${s.sepID}\` @ \`${s.eventTime}\` instr \`${s.instrument}\` linked CME \`${s.linkedCME||'none'}\``).join('\n');
      }
      if (q.includes('storm') || q.includes('gst') || q.includes('kp')) {
        const sorted = [...(data.storms||[])].sort((a,b)=>(b.maxKpIndex||0)-(a.maxKpIndex||0)).slice(0,3);
        if (!sorted.length) return `⚡ **GST List** — No storms in window (Kp max ${maxKp.toFixed(2)}). DB: \`${db.storms||0}\` storms.`;
        return `⚡ **GST Sample — Max Kp First** — Live **${totalStorms}**, max Kp \`${maxKp.toFixed(2)}\` (${threatLevel?.gScale||'G0'}), DB \`${db.storms||0}\`\n` + sorted.map((s,i)=> `${i+1}. \`${s.stormID}\` Kp **${s.maxKpIndex?.toFixed(2)}** @ \`${s.startTime}\``).join('\n');
      }
    }

    // 4. 8 Space Weather Phenomena + 9 DONKI Feeds — table-aware, covers all event types
    if (q.includes('phenomena') || q.includes('cme') || q.includes('flare') || q.includes('storm') || q.includes('sep') || q.includes('ips') || q.includes('mpc') || q.includes('rbe') || q.includes('hss') || q.includes('wsa') || q.includes('enlil') || q.includes('magnetopause') || q.includes('radiation belt') || q.includes('high speed') || q.includes('solar wind') || q.includes('what is') || q.includes('explain')) {
      // Specific: MPC
      if (q.includes('mpc') || q.includes('magnetopause')) {
        const c = totalMpcs;
        const ex = data.mpcs?.[0];
        return `🧲 **Magnetopause Crossing (MPC)**:\nBoundary where solar-wind pressure balances Earth's magnetosphere (~10 Re subsolar). Modelled via SWMF, crossings signal sudden compression (SSC).\n- **Measured**: \`eventTime\`, \`instrument\` (MODEL: SWMF), \`linkedEvents\` (CME/GST/IPS/HSS linkage)\n- **Dashboard**: \`MPC\` tab — timeline marker ⭐ + solar-wind multi-line (MPC+HSS+GST) ⭐ + Kp line\n- **Live window**: **${c}** MPC events${ex? ` — e.g. \`${ex.mpcID}\` @ \`${ex.eventTime}\`` : ''}\n- **Hazard**: indicates geosynchronous orbit exposure during high dynamic pressure.`;
      }
      if (q.includes('rbe') || q.includes('radiation belt')) {
        const c = totalRbes;
        const ex = data.rbes?.[0];
        return `🛰️ **Radiation Belt Enhancement (RBE)**:\nTransient elevation of outer belt relativistic electrons (>2 MeV, GOES/SEISS). Driven by HSS-induced wave acceleration or GST.\n- **Measured**: \`eventTime\`, \`instrument\` (GOES-P: SEISS >2MeV), \`linkedEvents\` (HSS/GST)\n- **Dashboard**: \`RBE\` tab — electron flux line chart ⭐, Kp line, HSS/RBE/GST multi-line, type pie\n- **Live**: **${c}** RBE${ex? ` — e.g. \`${ex.rbeID}\` @ \`${ex.eventTime}\` via \`${ex.instrument}\``:''}\n- **Proxy**: daily RBE count = flux proxy (table ⭐).`;
      }
      if (q.includes('hss') || (q.includes('high') && q.includes('speed')) || q.includes('solar wind stream')) {
        const c = totalHss;
        const ex = data.hss?.[0];
        return `💨 **High-Speed Stream (HSS) / Solar-Wind Stream**:\nCoronal-hole-origin fast solar wind (500–800 km/s) overtaking slow wind, forming corotating interaction region (CIR).\n- **Measured**: \`eventTime\`, \`instruments\` (DSCOVR: PLASMAG, ACE: SWEPAM/MAG, STEREO A: PLASTIC)\n- **Dashboard**: \`HSS\` tab — speed vs time line ⭐, Kp line, RBE flux series, HSS/RBE/GST multi-line\n- **Live**: **${c}** HSS${ex? ` — e.g. \`${ex.hssID}\` @ \`${ex.eventTime}\``:''}\n- **Effect**: recurrent G1–G2 storms, RBE seeding.`;
      }
      if (q.includes('wsa') || q.includes('enlil') || q.includes('prediction') || q.includes('arrival')) {
        const c = totalWes;
        const earth = data.wes?.filter(w=>w.isEarthGB)?.length || 0;
        const fastest = data.wes?.length ? Math.max(...data.wes.map(w=>w.speed||0)) : 0;
        const ex = data.wes?.find(w=>w.isEarthGB) || data.wes?.[0];
        return `🛰️ **WSA-ENLIL Heliospheric Prediction**:\nNASA CCMC coupled Wang-Sheeley-Arge + ENLIL MHD cone model forecasting shock arrival, duration, Kp, glancing blow.\n- **Inputs**: CME \`latitude/longitude/speed/halfAngle/featureCode\` → outputs \`estimatedShockArrivalTime\`, \`isEarthGB\`, \`kp_90/135/180\`, \`rmin_re\`, \`impactList\`\n- **Dashboard**: \`CME Earth\` tab — WSA-ENLIL Earth-arrival timeline ⭐ + direction 2D scatter + width gauge + speed bar\n- **Live**: **${c}** inputs, **${earth}** Earth-GB direct impacts, max input **${fastest} km/s**${ex? `\n- **Example**: \`${ex.simulationID}\` CME \`${ex.cmeID||'N/A'}\` @ \`${ex.estimatedShockArrivalTime||'pending'}\` Kp90 ${ex.kp90??'N/A'}`:''}`;
      }
      if (q.includes('sep') || q.includes('particle') || q.includes('radiation') && q.includes('sep')) {
        const linked = data.seps?.filter(s=>s.linkedCME)?.length||0;
        const ex = data.seps?.[0];
        return `⚛️ **Solar Energetic Particles (SEP) / Solar Radiation**:\nRelativistic protons/electrons (MeV–GeV) accelerated at flare reconnection or CME shock, funnelled to polar caps (PCA).\n- **Measured**: \`eventTime\`, \`instrument\` (GOES/ACE/SOHO), \`linkedEvents\`→ parent CME/FLR\n- **Dashboard**: \`SEP\` tab — instrument pie, linkage donut, particle flux line chart ⭐, Flare→CME→SEP timeline ⭐, daily flux proxy\n- **Live**: **${totalSeps}** SEPs, **${linked}** CME-linked${ex? ` — e.g. \`${ex.sepID}\` @ \`${ex.eventTime}\``:''}\n- **Scale**: NOAA S1–S5 radiation storm.`;
      }
      if (q.includes('ips') || q.includes('shock') && !q.includes('mpc')) {
        const ex = data.ipss?.[0];
        return `🌊 **Interplanetary Shock (IPS)**:\nSupersonic MHD discontinuity ahead of fast CME/HSS, Mach>1, compresses upstream medium. Detected at L1 (ACE/DSCOVR/SOHO) 30–60 min before SSC.\n- **Measured**: \`eventTime\`, \`location\` (Earth/STEREO A), \`catalog\`, \`instrument\`, \`linkedEvents\`\n- **Dashboard**: \`IPS Shock\` tab — instrument bar, shock arrival timeline ⭐, solar-wind before/after change bar ⭐ (IPS vs HSS split), CME association timeline\n- **Live**: **${totalIpss}** shocks${ex? ` — e.g. \`${ex.ipsID}\` @ \`${ex.eventTime}\` ${ex.location}`:''}`;
      }
      if (q.includes('gst') || q.includes('geomagnetic') || (q.includes('storm') && !q.includes('radiation'))) {
        const ex = data.storms?.[0];
        return `⚡ **Geomagnetic Storm (GST)**:\nRing-current intensification depressing horizontal field, measured via planetary Kp (0–9, 3-hour) → NOAA G1 (Kp5)…G5 (Kp9).\n- **Measured**: \`gstID/startTime/allKpIndex→maxKpIndex\`\n- **Dashboard**: \`Geomagnetic\` tab — Kp line chart ⭐, multi-source timeline (CME+IPS+HSS+MPC+GST) ⭐, MPC timeline marker, solar-wind multi-line, severity donut\n- **Live**: **${totalStorms}** storms, max Kp \`${maxKp.toFixed(2)}\` (${threatLevel?.gScale||'G0'})${ex? ` — e.g. \`${ex.stormID}\``:''}`;
      }
      if (q.includes('flare') || q.includes('flr')) {
        const m = data.flares?.filter(f=>(f.classType||'').startsWith('M'))?.length||0;
        const x = data.flares?.filter(f=>(f.classType||'').startsWith('X'))?.length||0;
        const ex = data.flares?.[0];
        return `☀️ **Solar Flare (FLR)**:\nImpulsive X/EUV burst from coronal reconnection over sunspots, heats plasma to 10 MK, photons reach Earth in 8.3 min.\n- **Measured**: \`classType\` (GOES A/B/C/M/X — flux 1e-7→1e-4 W/m²), \`peakTime/beginTime/sourceLocation/activeRegion\`\n- **Dashboard**: \`Flare\` tab — class donut, peak intensity rank timeline ⭐, active-region bar, GOES timeline ⭐ + location plot\n- **Live**: **${totalFlares}** flares (M **${m}**, X **${x}**)${ex? ` — e.g. \`${ex.flareID}\` \`${ex.classType}\` @ \`${ex.peakTime}\``:''}`;
      }
      if (q.includes('cme') || q.includes('coronal') || q.includes('ejection') || q.includes('earth') && q.includes('direct')) {
        const peak = totalCmes? Math.max(...data.cmes.map(c=>c.speed||0)) : 0;
        const earth = data.cmes?.filter(c=>c.isEarthGB)?.length || 0;
        const wsaE = data.wes?.filter(w=>w.isEarthGB)?.length || 0;
        const ex = data.cmes?.[0];
        return `💥 **Coronal Mass Ejection (CME) — Earth-Directed / WSA-ENLIL**:\nBillion-ton magnetized plasma cloud (cavity+core+front), speed 250–3000 km/s, Sun→Earth 15–72h, Bz southward → G-storm.\n- **Measured**: \`speed/halfAngle/type\` via \`cmeAnalyses.isMostAccurate\`, \`latitude/longitude\` (direction), \`sourceLocation\` (N/S/E/W), \`linkedEvents/flare\`, WSA \`estimatedShockArrivalTime/isEarthGB\`\n- **Dashboard**: \`CME Earth\` tab — direction 2D scatter (lat vs lon, bubble=width, color=speed) ⭐, speed bar ⭐, width gauge ⭐, WSA-ENLIL arrival timeline ⭐, multi-day timeline\n- **Live**: **${totalCmes}** CMEs peak **${peak} km/s**, **${earth}** isEarthGB (CME) + **${wsaE}** WSA Earth-GB inputs${ex? ` — e.g. \`${ex.activityID}\` ${ex.speed}km/s lon ${ex.longitude} lat ${ex.latitude}`:''}`;
      }
      if (q.includes('visual') || q.includes('chart') || q.includes('best')) {
        return `📊 **Best Visualizations per Phenomenon (Table)**:\n` +
        `- **🌍 Geomagnetic**: CME speed line/bar + arrival marker, IPS timeline, Solar-wind multi-line, Kp line ⭐, MPC timeline marker\n` +
        `- **☢️ SEP**: Flare timeline, CME speed/trajectory, particle flux line ⭐, Timing Flare→CME→SEP timeline ⭐\n` +
        `- **🛰️ RBE**: electron flux line ⭐, Kp line, CME timeline, HSS speed line\n` +
        `- **☄️ CME Earth**: direction 2D plot ⭐, speed bar ⭐, width gauge ⭐, WSA-ENLIL arrival timeline ⭐, linked FLR timeline\n` +
        `- **⚡ Flare**: class timeline ⭐, peak intensity line, active-region plot\n` +
        `- **💨 HSS**: speed vs time line ⭐, Kp line, RBE flux series\n` +
        `- **🌊 IPS**: arrival timeline ⭐, before/after wind change line ⭐, CME association timeline\n` +
        `- **🧲 MPC**: crossing timeline, solar-wind multi-line, Kp line`;
      }
      return `🪐 **8 Monitored Phenomena — 9 DONKI Feeds** (ask any by name for deep dive):\n` +
        `1. **🌍 Geomagnetic Storm (GST)** — CME+IPS+HSS+Kp+MPC → Kp line ⭐, multi-source timeline\n` +
        `2. **☢️ Solar Radiation / SEP (SEP+FLR+CME)** — particle flux line ⭐, Flare→CME→SEP timeline ⭐\n` +
        `3. **🛰️ Radiation Belt Enhancement (RBE)** — electron flux line ⭐, belt vs wind vs storm\n` +
        `4. **☄️ Earth-Directed CME (CME+WSA-ENLIL)** — direction 2D ⭐, speed bar ⭐, width gauge ⭐, arrival timeline ⭐\n` +
        `5. **⚡ Solar Flare (FLR)** — class timeline ⭐, intensity line, AR plot\n` +
        `6. **💨 HSS High-Speed Stream (HSS)** — wind speed line ⭐, Kp, RBE series\n` +
        `7. **🌊 Interplanetary Shock (IPS)** — arrival timeline ⭐, before/after wind bar ⭐\n` +
        `8. **🧲 Magnetopause Crossing (MPC)** — timeline + wind multi-line + Kp\n\n` +
        `Try: *"what is RBE?"*, *"explain HSS"*, *"WSA prediction for this window?"*, *"best viz for MPC?"* — I have live counts + DB.`;
    }

    // 5. SQLite WASM Caching — extended 9 tables
    if (q.includes('sqlite') || q.includes('cache') || q.includes('storage') || q.includes('sql.js') || q.includes('export') || q.includes('how many in db') || q.includes('db count')) {
      const counts = sqliteCounts || { cmes: 0, flares: 0, storms: 0, seps: 0, ipss: 0, mpcs: 0, rbes: 0, hss: 0, wes: 0, queries: 0 };
      if (q.includes('export') || q.includes('download') || q.includes('.db') || q.includes('binary')) {
        return `💾 **Export Browser DB**:\nClick **".db Export"** (top toolbar) → downloads \`spaceguard.db\` (WASM SQLite). Contains 9 tables + \`query_cache\` (${counts.queries||0} ranges). Works offline, zero API quota.`;
      }
      return `💾 **SQLite WASM In-Browser Database — 9 Tables, Full DB Access**:\n\n` +
        `SpaceGuard runs **SQLite 3** in-browser via \`sql.js\` WebAssembly:\n` +
        `- **Speed**: sub-ms retrieval for cached ranges; **quota**: 0 API calls for cached \`${startDate}→${endDate}\` (\`${dataOrigin==='cache'?'CACHE':'LIVE'}\`)\n` +
        `- **Persisted totals (all ranges you’ve queried)**: CMEs \`${counts.cmes||0}\`, Flares \`${counts.flares||0}\`, Storms \`${counts.storms||0}\`, SEP \`${counts.seps||0}\`, IPS \`${counts.ipss||0}\`, MPC \`${counts.mpcs||0}\`, RBE \`${counts.rbes||0}\`, HSS \`${counts.hss||0}\`, WSA-ENLIL \`${counts.wes||0}\`, cached queries \`${counts.queries||0}\`\n` +
        `- **Live window counts**: CME \`${totalCmes}\`, FLR \`${totalFlares}\`, GST \`${totalStorms}\`, SEP \`${totalSeps}\`, IPS \`${totalIpss}\`, MPC \`${totalMpcs}\`, RBE \`${totalRbes}\`, HSS \`${totalHss}\`, WSA inputs \`${totalWes}\`\n` +
        `- **Schema**: \`cme_events(lat,lon,linked,enfl)\`, \`solar_flare_events\`, \`geomagnetic_storm_events(max_kp)\`, \`sep_events\`, \`ips_events\`, \`mpc_events\`, \`rbe_events\`, \`hss_events\`, \`wsa_enlil_events(sim,arrival,GB,Kp)\` + \`query_cache\`\n` +
        `- **Idempotent**: \`INSERT OR REPLACE\` per primary key (activityID/flareID/gstID…) — re-querying same dates never duplicates.\n` +
        `- **Ask me**: *"list fastest CME"*, *"show 3 MPC events"*, *"WSA Earth arrivals?"* — I read from live \`data\` + DB \`sqliteCounts\`.`;
    }

    // 6. Creators & Team
    if (q.includes('team') || q.includes('creator') || q.includes('author') || q.includes('who built') || q.includes('kailash') || q.includes('sriviknesh') || q.includes('who made')) {
      return `👥 **SpaceGuard Engineering Team**:\n\n` +
        `1. **Kailash** — *Lead Data Engineer & Backend Architect*\n` +
        `   - Built the Scala 3 telemetry processing engine and parallel \`Future\` pipeline.\n` +
        `   - Formulated the 9 core filtering, statistical and rendering algorithms.\n` +
        `   - Engineered SQLite schema design and NASA API integrations.\n\n` +
        `2. **SriViknesh** — *Frontend Architect & Visualization Lead*\n` +
        `   - Designed the React 18 frontend architecture and state persistence.\n` +
        `   - Built the interactive Apache ECharts multi-chart visualization suite.\n` +
        `   - Developed the dark cosmic UI design system and AI copilot interface.`;
    }


    // Default Fallback Response — now DB-aware
    const hintCounts = `Live window: CME ${totalCmes}, FLR ${totalFlares}, GST ${totalStorms}, SEP ${totalSeps}, IPS ${totalIpss}, MPC ${totalMpcs}, RBE ${totalRbes}, HSS ${totalHss}, WSA ${totalWes} | DB: ${db.cmes||0}/${db.flares||0}/${db.storms||0}/${db.seps||0}/${db.ipss||0}/${db.mpcs||0}/${db.rbes||0}/${db.hss||0}/${db.wes||0}`;
    return `🛰️ **ORBIT Assistant** — data-aware, with full DB access.\n` +
      `I received: *"${rawQuery}"*.\n\n` +
      `**Ask me analytical questions** (I read the telemetry, not just raw rows):\n` +
      `- 📊 *"Summarise the situation"* — status + hazard score + trend\n` +
      `- 📈 *"What are the trends?"* — first vs second half, CME velocity regression\n` +
      `- ⚖️ *"Compare the feeds"* / *"which is most active?"* — share + head-to-head\n` +
      `- 🔗 *"Why did the storm happen?"* / *"show event relationships"* — Flare → CME → Wind → Storm chains\n` +
      `- ⚠️ *"Any anomalies?"* — outliers, Kp≥7 storms, X-class flares, full chains\n` +
      `- 🪐 *"What is RBE / HSS / MPC / WSA-ENLIL?"* — deep dive per phenomenon\n` +
      `- 💾 *"How many in DB?"* / *"list fastest CME"* — live \`data\` + \`sqliteCounts\`\n\n` +
      `_Live: ${hintCounts}_\n` +
      (hasQueried ? `_Derived: ${chains.length} chains, hazard ${mc.overall.score}/100, NOAA ${mc.gScale}_` : '_Query a date range to unlock analysis._');
  };

  // Dispatch query to OpenRouter or Local Engine
  const handleQuery = async (userText) => {
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // ---- ORBIT engine gate -------------------------------------------------
    // Classification, follow-up resolution and structured querying happen here,
    // before any API call. Two reasons: (1) exact answers like "how many CMEs
    // above 1200?" must not be at the mercy of a 700-token LLM sample, and
    // (2) the engine is what makes ORBIT useful with no API key at all.
    const cls = resolveContext(lastIntentRef.current, userText);
    lastIntentRef.current = { intent: cls.intent, feed: cls.feed, metric: cls.metric, subject: userText };

    const engineReply = (() => {
      if (cls.intent === 'viz') return handleVizRequest(userText, cls.feed);
      if (cls.intent === 'dataQuery' && cls.confidence >= LOW_CONFIDENCE) {
        return handleDataQuery(userText, cls);
      }
      return null;
    })();

    if (engineReply) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: engineReply
        }]);
        setIsTyping(false);
      }, 260);
      return;
    }

    // If OpenRouter key is set, call live OpenRouter API (ORBIT) — with effective key + fallback
    const effectiveKey = getEffectiveOrbitKey(openRouterApiKey);
    // Debug aid — shows in console why fallback triggers
    if (!effectiveKey) {
      console.info('[ORBIT] No effective OpenRouter key found (prop=' + (openRouterApiKey ? 'set' : 'empty') + ', localStorage=' + (()=>{try{return localStorage.getItem("openrouter_api_key")?"set":"empty"}catch{return "unavailable"}})() + ', env=' + (import.meta.env.VITE_OPENROUTER_API_KEY ? 'set' : 'empty') + ') — using local engine.');
    }
    if (effectiveKey && effectiveKey.length > 10) {
      try {
        // Compact structured facts — the LLM reasons over these instead of
        // re-deriving numbers, which keeps responses inside the token budget.
        const facts = buildFacts({ data, analysis, sqliteCounts, startDate, endDate, dataOrigin });
        const convo = lastIntentRef.current;
        const systemPrompt = `You are ORBIT, the intelligence layer of SpaceGuard — an expert space weather astrophysicist and telemetry analyst.
You were formerly called SpaceGuard AI — now you are ORBIT. Always identify as ORBIT.

You are DATA-AWARE and CALCULATIONAL. You reason over the telemetry below rather than recalling generic space-weather text, and you perform real calculations and comparisons rather than hedging.

TELEMETRY FACTS (authoritative — never contradict these, never invent numbers):
${facts}

${convo ? `CONVERSATION CONTEXT: the previous question was about "${convo.subject}". If this question is a follow-up ("why?", "more?"), keep that subject unless it clearly changes.\n` : ''}
ENGINE: Scala 3 (V9.scala), 9 core algorithms, 9 DONKI feeds (CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSAEnlilSimulations), 10-table SQLite via sql.js WASM (mention ONLY if asked about algorithms/engine).
Phenomena (8): 🌍 Geomagnetic (CME+IPS+HSS+Kp+MPC), ☢️ SEP (FLR+CME+SEP), 🛰️ RBE (RBE+Kp+CME+HSS), ☄️ CME Earth (lat/lon+speed+width+WSA+FLR), ⚡ Flare (class+peak+AR), 💨 HSS (HSS+Kp+RBE), 🌊 IPS (arrival+wind change+CME link), 🧲 MPC (MPC+HSS+Kp).
VISUALIZATION ROUTES: CME Earth/direction/scatter → tab "cme-earth"; Flare → "flare"; Geomagnetic/Kp → "geomagnetic"; SEP → "sep"; IPS → "ips"; RBE → "rbe"; HSS → "hss"; MPC → "mpc"; chains/causality → "timeline"; threat/briefing → "mission-control"; algorithms → "docs".
Engineers: Kailash (Lead Data Engineer & Backend Architect) and SriViknesh (Frontend Architect & Visualization Lead).

THREAT RULE (for "why G3/G1?"): NOAA G-scale is Kp-only: G1 Kp≥5, G2 Kp≥6, G3 Kp≥7, G4 Kp≥8, G5 Kp≥9. CME speed / M-X flares do NOT set G-scale — they are R-scale / eruption metrics. If Kp is 0.00, say Quiet/G0.

The full pre-computed analytical brief (same layer behind Mission Control and the Event Relationship Timeline):
${analysis.brief}

STRICT STYLE RULES:
- Answer in ORBIT's voice as an analyst, not a search engine. Lead with the answer, then evidence.
- CALCULATE, don't guess. For counts, averages, extremes and comparisons use the numbers in TELEMETRY FACTS. If a figure isn't there, say so — never invent one.
- For "how many X above N" style questions, state the filtered count and then give the range (min–max) so the answer has context.
- When the user asks to see or open a chart, name the view from VISUALIZATION ROUTES and say you're taking them there.
- For simple definitions like "what are CME Events?" give a SHORT answer: 2-4 sentences or 3-5 bullets, 80-120 words max. No tables. No live telemetry dump. No algorithm section. No impact tables unless asked.
- Only include live telemetry numbers when user asks about current/live/summary/telemetry/status/counts/threat/analysis. Never dump all metrics unsolicited.
- For analytical questions (summarise / compare / trends / relationships / anomalies), lead with the conclusion in one sentence, then 3-5 bullets of supporting numbers drawn from the TELEMETRY FACTS. Cite derived figures (hazard score, chain confidence, r values, % changes) rather than restating every row.
- Be honest about weak signal: if a correlation is weak or a window is sparse, say so rather than overstating it.
- For “why G3?” etc: explain G-scale is from max Kp in GST data, not CME count/speed. If Kp is 0.00, say Quiet/G0 and note flare/CME are separate risks. Keep to 3-5 bullets, no truncation.
- Only explain the 9 algorithms when user asks about algorithms/engine/processing.
- Keep markdown minimal: bold keywords, no full tables unless user requests a table.
- Be direct and concise. Prefer 1 short paragraph + 3 bullets over long reports. Never stop mid-sentence.`;

        // helper to call ORBIT with model fallback
        const callOrbit = async (model) => {
          return await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${effectiveKey}`,
              'HTTP-Referer': window.location.origin,
              'X-Title': 'ORBIT - SpaceGuard Telemetry Platform',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              temperature: 0.3,
              max_tokens: 700,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.slice(-6).map(m => ({
                  role: m.sender === 'user' ? 'user' : 'assistant',
                  content: m.text
                })),
                { role: 'user', content: userText }
              ]
            })
          });
        };

        const response = await callOrbit(OPENROUTER_MODEL);

        if (response.ok) {
          const json = await response.json();
          const replyText = json.choices?.[0]?.message?.content || generateLocalResponse(userText);
          const botMsg = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: replyText
          };
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
          return;
        } else {
          let errBody = '';
          let errJson = null;
          try { errJson = await response.json(); errBody = errJson.error?.message || JSON.stringify(errJson); } catch {}
          console.warn('OpenRouter API returned non-OK status:', response.status, errBody);
          // 404/400 often means model not found or not free — sequential retry through fallback list
          if ((response.status === 404 || response.status === 400) && errBody.toLowerCase().includes('model')) {
            for (const fbModel of OPENROUTER_FALLBACK_MODELS) {
              console.info('[ORBIT] Retrying with fallback model', fbModel);
              try {
                const retry = await callOrbit(fbModel);
                if (retry.ok) {
                  const j = await retry.json();
                  const txt = j.choices?.[0]?.message?.content || generateLocalResponse(userText);
                  setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: txt + '\n\n*— via fallback model ' + fbModel + '*'}]);
                  setIsTyping(false);
                  return;
                }
                let rBody = ''; try{ const rj=await retry.json(); rBody=rj.error?.message||JSON.stringify(rj);}catch{}
                errBody += ' | fallback ' + fbModel + ' also failed (' + retry.status + '): ' + rBody;
                // continue to next fallback if this one also 404
                if (retry.status !== 404 && retry.status !== 400) break;
              } catch (e) { console.error('Fallback model error', fbModel, e); errBody += ' | ' + fbModel + ' error: ' + (e.message||e); }
            }
          }
          // Surface *all* non-OK to user instead of silent fallback
          const isAuth = response.status === 401 || response.status === 403;
          const botMsg = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `⚠️ **ORBIT – OpenRouter ${isAuth ? 'Auth' : 'API'} Error (${response.status})**\n\n${errBody || response.statusText || 'Unknown error'}\n\n${isAuth ? 'Please verify the key at openrouter.ai/keys and re-save it in Settings (or set VITE_OPENROUTER_API_KEY in .env).' : 'Check model `' + OPENROUTER_MODEL + '` availability or try again.'}\n\nFalling back to local engine below.`
          };
          setMessages(prev => [...prev, botMsg]);
          setIsTyping(false);
          // Inject local fallback after a moment so user still gets an answer
          setTimeout(() => {
            const fb = generateLocalResponse(userText);
            setMessages(prev => [...prev, { id: `bot-${Date.now()+1}`, sender: 'bot', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: fb }]);
          }, 700);
          return;
        }
      } catch (err) {
        console.error('OpenRouter request error:', err);
        // Network/CORS error — surface it
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `⚠️ **ORBIT – Network Error**\n\n\`${err.message || err}\`\n\nCould not reach OpenRouter. Check internet/CORS and that \`openrouter_api_key\` is set. Falling back to local engine.`
        };
        setMessages(prev => [...prev, botMsg]);
        // let fallback handler below also push local answer
      }
    }

    // Fallback: Local Rule Intelligence Engine
    setTimeout(() => {
      const responseText = generateLocalResponse(userText);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: responseText
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 300);
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isTyping) return;
    handleQuery(inputVal.trim());
  };

  const handleQuickPrompt = (promptQuery) => {
    handleQuery(promptQuery);
  };

  const QUICK_PROMPTS = [
    { icon: BarChart3, label: 'Briefing', q: 'Give me a space weather briefing' },
    { icon: Sigma, label: 'Fast CMEs', q: 'How many CMEs are above 1000 km/s?' },
    { icon: TrendingUp, label: 'Trends', q: 'What are the trends in this window?' },
    { icon: GitBranch, label: 'Causes', q: 'Why did the geomagnetic activity happen?' },
    { icon: Activity, label: 'Anomalies', q: 'Any anomalies worth watching?' },
    { icon: LineChart, label: 'Show me', q: 'Show me the CME direction plot' }
  ];

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `🧹 **Chat Cleared**\n\nAsk me anything about space weather, algorithms, telemetry, or system architecture!`
      }
    ]);
  };

  // Helper to render markdown-like formatting with clean high-contrast text
  const renderMessageContent = (text) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (!line) return <div key={idx} className="h-1.5" />;
      return (
        <div key={idx} className="leading-relaxed">
          {line.split(/(\*\*.*?\*\*|\`.*?\`)/g).map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-950/80 font-mono text-[11px] text-cyan-300 border border-slate-750">{part.slice(1, -1)}</code>;
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return <em key={pIdx} className="italic text-slate-300">{part.slice(1, -1)}</em>;
            }
            return part;
          })}
        </div>
      );
    });
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Launcher Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-5 sm:right-6 bottom-5 sm:bottom-6 z-50 px-4 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-850 text-white shadow-[0_12px_36px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] hover:shadow-cyan-500/30 backdrop-blur-xl border border-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-3 group cursor-pointer"
          title="Open ORBIT Copilot"
        >
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/30 group-hover:rotate-6 transition-transform">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div className="text-left pr-1 hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 font-sans">
              <span>ORBIT</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Space Weather Intelligence</div>
          </div>
        </button>
      )}

      {/* Floating Chatbot Window Card (Bottom-Right) */}
      {isOpen && (
        <div 
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 ${
            isExpanded 
              ? 'w-[calc(100vw-32px)] sm:w-[580px] h-[680px] max-h-[calc(100vh-80px)]' 
              : 'w-[calc(100vw-32px)] sm:w-[410px] h-[560px] max-h-[calc(100vh-100px)]'
          } rounded-2xl bg-[#080e22]/95 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.2)] flex flex-col overflow-hidden transition-all duration-200 text-slate-100 animate-in fade-in zoom-in-95`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 border-b border-slate-800/90 bg-slate-900/90 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-xs sm:text-sm text-white">ORBIT</h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {getEffectiveOrbitKey(openRouterApiKey) ? 'Data-aware · openrouter/free' : 'Data-aware · Built-in Engine'}
                </p>
              </div>
            </div>

            {/* Header Action Controls — key injection removed, manage via Settings → ORBIT */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Clear Chat History"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                title={isExpanded ? 'Standard Window Size' : 'Expand Window Size'}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Close AI Copilot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Minimal Live Status Strip */}
          <div className="px-3.5 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="truncate font-mono text-[10px]">
              {hasQueried ? `${startDate} → ${endDate}` : 'No telemetry query loaded'}
            </span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[9px] ${threatLevel?.bg || 'bg-cyan-950'} ${threatLevel?.color || 'text-cyan-300'}`}>
              {threatLevel?.gScale || 'G0'} {threatLevel?.level ? `• ${threatLevel.level}` : ''}
            </span>
          </div>


          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl shadow-sm text-xs leading-relaxed max-w-[90%] ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-sm'
                      : 'bg-slate-900/90 text-slate-200 rounded-tl-sm border border-slate-800'
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit text-slate-400 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[11px] ml-1 text-slate-400">Thinking...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick analytical prompts */}
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {QUICK_PROMPTS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.label}
                    onClick={() => handleQuickPrompt(p.q)}
                    disabled={isTyping}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300 text-slate-300 text-[10px] font-semibold whitespace-nowrap transition-all disabled:opacity-40"
                  >
                    <Icon className="w-3 h-3" />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simple Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about trends, relationships, anomalies..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-750 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 transition-all font-sans"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white shadow-sm transition-all shrink-0 cursor-pointer"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
