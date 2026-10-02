/**
 * SpaceGuard — Shared Telemetry Analysis Engine
 *
 * A single, dependency-free analysis layer that derives higher-order meaning
 * from the 9 raw NASA DONKI feeds:
 *
 *  1. Mission Control status indicators (CME / Flares / Kp / Radiation / Wind)
 *  2. Event relationship chains (Flare -> CME -> Solar Wind -> Geomagnetic Storm)
 *  3. Trend, comparison, correlation and anomaly analytics
 *  4. A compact natural-language telemetry brief for ORBIT
 *
 * Used by MissionControlPage, EventTimelinePage and the ORBIT copilot so that
 * all three surfaces reason about the *same* derived facts.
 */

// DONKI can return sparse/holey arrays and cached rows may contain nulls after
// partial writes, so every event feed is filtered to real objects before analysis.
const safeArr = (v) => (Array.isArray(v) ? v.filter((x) => x && typeof x === 'object') : []);

// Linked-event references are plain ID strings, NOT event objects, so they must
// not go through safeArr (which would discard every string).
const safeIdArr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.length > 0) : []);

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Parse a DONKI timestamp (ISO w/ optional Z or space) into ms, or NaN. */
export function parseTime(value) {
  if (!value || typeof value !== 'string') return NaN;
  const t = Date.parse(value.replace(' ', 'T'));
  return Number.isFinite(t) ? t : NaN;
}

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/** Difference in hours between two timestamps (to - from). Null if either invalid. */
export function hoursBetween(from, to) {
  const a = parseTime(from);
  const b = parseTime(to);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / HOUR;
}

const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

/** Days covered by the queried window (inclusive, from date strings). */
export function windowLengthDays(startDate, endDate) {
  const a = parseTime(startDate);
  const b = parseTime(endDate);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.max(1, Math.round((b - a) / DAY) + 1);
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1));
}

/** Pearson correlation coefficient (r). Returns null when undefined. */
export function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let numr = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    numr += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return numr / Math.sqrt(dx * dy);
}

/** Linear regression slope of ys over xs (per unit x). */
export function linearTrend(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let numr = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    numr += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : numr / den;
}

/** Bucket a list of { time, ... } into daily counts across the full window. */
function dailySeries(items, timeAccessor, startDate, endDate) {
  const startMs = parseTime(startDate);
  const endMs = parseTime(endDate);
  // Anchor the axis to the requested window so historical ranges are labelled
  // correctly instead of being drawn relative to today.
  const haveWindow = Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs;
  const total = haveWindow ? Math.round((endMs - startMs) / DAY) + 1 : Math.max(items.length, 1);
  const buckets = new Map();
  for (let i = 0; i < total; i++) {
    const base = haveWindow ? startMs + i * DAY : Date.now() - (total - 1 - i) * DAY;
    buckets.set(dayKey(base), 0);
  }
  items.forEach((it) => {
    const t = parseTime(timeAccessor(it));
    if (!Number.isFinite(t)) return;
    const k = dayKey(t);
    buckets.set(k, (buckets.get(k) || 0) + 1);
  });
  return [...buckets.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([date, count]) => ({ date, count }));
}

// ---------------------------------------------------------------------------
// NOAA scale helpers
// ---------------------------------------------------------------------------

export const KP_THRESHOLDS = [
  { kp: 5, g: 'G1', label: 'Minor', color: '#22c55e' },
  { kp: 6, g: 'G2', label: 'Moderate', color: '#0ea5e9' },
  { kp: 7, g: 'G3', label: 'Strong', color: '#f59e0b' },
  { kp: 8, g: 'G4', label: 'Severe', color: '#f43f5e' },
  { kp: 9, g: 'G5', label: 'Extreme', color: '#be123c' }
];

/** NOAA G-scale from a Kp value (G-scale is Kp-only, per NOAA SWPC). */
export function gScaleFromKp(kp) {
  let g = 'G0';
  let label = 'Quiet';
  let color = '#06b6d4';
  KP_THRESHOLDS.forEach((t) => {
    if (kp >= t.kp) {
      g = t.g;
      label = t.label;
      color = t.color;
    }
  });
  return { gScale: g, label, color };
}

/** NOAA R-scale (radio blackout) from a GOES flare class letter. */
export function rScaleFromFlareClass(classType) {
  const letter = (classType || '').toString().trim().charAt(0).toUpperCase();
  if (letter === 'X') return { rScale: 'R3+', tone: 'severe' };
  if (letter === 'M') return { rScale: 'R1-R2', tone: 'moderate' };
  if (letter === 'C') return { rScale: 'R0', tone: 'quiet' };
  return { rScale: 'R0', tone: 'quiet' };
}

/** NOAA S-scale (solar radiation storm) proxy from SEP event count. */
export function sScaleFromSep(count) {
  if (count >= 10) return { sScale: 'S3', tone: 'strong' };
  if (count >= 5) return { sScale: 'S2', tone: 'moderate' };
  if (count >= 1) return { sScale: 'S1', tone: 'minor' };
  return { sScale: 'S0', tone: 'quiet' };
}

const FLARE_RANK = { A: 1, B: 2, C: 3, M: 4, X: 5 };

export function flareRank(classType) {
  const letter = (classType || '').toString().trim().charAt(0).toUpperCase();
  return FLARE_RANK[letter] || 0;
}

// ---------------------------------------------------------------------------
// 1. MISSION CONTROL — status indicators
// ---------------------------------------------------------------------------

/**
 * Build the full Mission Control indicator set from raw telemetry.
 * Each indicator: { key, label, icon, value, unit, status, statusLabel,
 *                   level (0-100 risk), color, detail, subMetrics[] }
 */
export function buildMissionControlStatus(data = {}, startDate, endDate) {
  const cmes = safeArr(data.cmes);
  const flares = safeArr(data.flares);
  const storms = safeArr(data.storms);
  const seps = safeArr(data.seps);
  const ipss = safeArr(data.ipss);
  const mpcs = safeArr(data.mpcs);
  const rbes = safeArr(data.rbes);
  const hss = safeArr(data.hss);
  const wes = safeArr(data.wes);

  const days = windowLengthDays(startDate, endDate) || Math.max(1, cmes.length + flares.length);
  const perDay = (n) => n / days;

  // --- Geomagnetic / Kp ---
  const kpValues = storms.map((s) => num(s.maxKpIndex)).filter((v) => v > 0);
  const maxKp = kpValues.length ? Math.max(...kpValues) : 0;
  const avgKp = kpValues.length ? mean(kpValues) : 0;
  const { gScale, label: gLabel, color: gColor } = gScaleFromKp(maxKp);

  // --- CME ---
  const cmeSpeeds = cmes.map((c) => num(c.speed)).filter((v) => v > 0);
  const peakSpeed = cmeSpeeds.length ? Math.max(...cmeSpeeds) : 0;
  const avgSpeed = cmeSpeeds.length ? mean(cmeSpeeds) : 0;
  const earthCmes = cmes.filter((c) => c.isEarthGB === true);
  const fastCmes = cmes.filter((c) => num(c.speed) >= 1000);
  const cmeLevel = Math.min(100, Math.round((peakSpeed / 2000) * 100));

  // --- Flares ---
  const xFlares = flares.filter((f) => (f.classType || '').startsWith('X'));
  const mFlares = flares.filter((f) => (f.classType || '').startsWith('M'));
  const strongFlares = xFlares.length + mFlares.length;
  const { rScale, tone: rTone } = rScaleFromFlareClass(
    xFlares.length ? 'X' : mFlares.length ? 'M' : 'A'
  );
  const flareLevel = Math.min(100, strongFlares * 20 + xFlares.length * 30);

  // --- Radiation (SEP + RBE) ---
  const linkedSeps = seps.filter((s) => s.linkedCME);
  const { sScale, tone: sTone } = sScaleFromSep(seps.length);
  const radiationLevel = Math.min(100, seps.length * 15 + rbes.length * 5 + (sTone === 'strong' ? 30 : 0));

  // --- Solar wind (HSS + IPS) ---
  const windLevel = Math.min(100, hss.length * 10 + ipss.length * 15 + mpcs.length * 12);

  // --- Radiation belt ---
  const beltLevel = Math.min(100, rbes.length * 12);

  const indicators = [
    {
      key: 'cme',
      label: 'CME Activity',
      icon: 'Globe2',
      value: cmes.length,
      unit: 'events',
      rate: perDay(cmes.length).toFixed(2),
      level: cmeLevel,
      status: cmeLevel >= 75 ? 'critical' : cmeLevel >= 45 ? 'elevated' : cmeLevel > 0 ? 'nominal' : 'quiet',
      statusLabel: cmeLevel >= 75 ? 'Severe' : cmeLevel >= 45 ? 'Elevated' : cmeLevel > 0 ? 'Nominal' : 'Quiet',
      color: '#0d9488',
      detail: `Peak ${peakSpeed} km/s • avg ${Math.round(avgSpeed)} km/s • ${earthCmes.length} Earth-directed • ${fastCmes.length} >1000 km/s`,
      subMetrics: [
        { label: 'Peak speed', value: `${peakSpeed} km/s` },
        { label: 'Avg speed', value: `${Math.round(avgSpeed)} km/s` },
        { label: 'Earth-directed', value: earthCmes.length },
        { label: 'Fast (>1000)', value: fastCmes.length }
      ]
    },
    {
      key: 'flare',
      label: 'Solar Flares',
      icon: 'Sun',
      value: flares.length,
      unit: 'events',
      rate: perDay(flares.length).toFixed(2),
      level: flareLevel,
      status: rTone === 'severe' ? 'critical' : rTone === 'moderate' ? 'elevated' : flares.length ? 'nominal' : 'quiet',
      statusLabel: rTone === 'severe' ? 'Extreme' : rTone === 'moderate' ? 'Strong' : flares.length ? 'Nominal' : 'Quiet',
      color: '#f59e0b',
      detail: `${xFlares.length} X-class • ${mFlares.length} M-class • NOAA ${rScale} radio blackout`,
      subMetrics: [
        { label: 'X-class', value: xFlares.length },
        { label: 'M-class', value: mFlares.length },
        { label: 'NOAA scale', value: rScale },
        { label: 'Per day', value: perDay(flares.length).toFixed(2) }
      ]
    },
    {
      key: 'storm',
      label: 'Geomagnetic Storms',
      icon: 'ShieldAlert',
      value: storms.length,
      unit: 'events',
      rate: perDay(storms.length).toFixed(2),
      level: Math.round((maxKp / 9) * 100),
      status: maxKp >= 8 ? 'critical' : maxKp >= 6 ? 'elevated' : maxKp >= 5 ? 'watch' : storms.length ? 'nominal' : 'quiet',
      statusLabel: maxKp >= 8 ? 'Severe' : maxKp >= 6 ? 'Elevated' : maxKp >= 5 ? 'Watch' : storms.length ? 'Nominal' : 'Quiet',
      color: gColor,
      detail: `NOAA ${gScale} (${gLabel}) • max Kp ${maxKp.toFixed(2)} • avg Kp ${avgKp.toFixed(2)}`,
      subMetrics: [
        { label: 'Max Kp', value: maxKp.toFixed(2) },
        { label: 'Avg Kp', value: avgKp.toFixed(2) },
        { label: 'NOAA scale', value: gScale },
        { label: 'MPC crossings', value: mpcs.length }
      ]
    },
    {
      key: 'radiation',
      label: 'Radiation Activity',
      icon: 'Activity',
      value: seps.length + rbes.length,
      unit: 'events',
      rate: perDay(seps.length + rbes.length).toFixed(2),
      level: radiationLevel,
      status: sTone === 'strong' ? 'critical' : sTone === 'moderate' ? 'elevated' : seps.length || rbes.length ? 'watch' : 'quiet',
      statusLabel: sTone === 'strong' ? 'S3 Strong' : sTone === 'moderate' ? 'S2 Moderate' : seps.length || rbes.length ? 'S1 Minor' : 'Quiet',
      color: '#8b5cf6',
      detail: `${seps.length} SEP (${linkedSeps.length} CME-linked) • ${rbes.length} RBE • NOAA ${sScale}`,
      subMetrics: [
        { label: 'SEP events', value: seps.length },
        { label: 'CME-linked', value: linkedSeps.length },
        { label: 'RBE', value: rbes.length },
        { label: 'NOAA scale', value: sScale }
      ]
    },
    {
      key: 'wind',
      label: 'Solar Wind / Shocks',
      icon: 'Wind',
      value: hss.length + ipss.length,
      unit: 'events',
      rate: perDay(hss.length + ipss.length).toFixed(2),
      level: windLevel,
      status: windLevel >= 60 ? 'elevated' : windLevel > 0 ? 'nominal' : 'quiet',
      statusLabel: windLevel >= 60 ? 'Disturbed' : windLevel > 0 ? 'Nominal' : 'Quiet',
      color: '#0ea5e9',
      detail: `${hss.length} HSS • ${ipss.length} interplanetary shocks • ${mpcs.length} magnetopause crossings`,
      subMetrics: [
        { label: 'HSS streams', value: hss.length },
        { label: 'IPS shocks', value: ipss.length },
        { label: 'MPC crossings', value: mpcs.length },
        { label: 'WSA-ENLIL runs', value: wes.length }
      ]
    },
    {
      key: 'belt',
      label: 'Radiation Belt',
      icon: 'Satellite',
      value: rbes.length,
      unit: 'enhancements',
      rate: perDay(rbes.length).toFixed(2),
      level: beltLevel,
      status: beltLevel >= 60 ? 'elevated' : rbes.length ? 'watch' : 'quiet',
      statusLabel: beltLevel >= 60 ? 'Elevated' : rbes.length ? 'Monitor' : 'Quiet',
      color: '#06b6d4',
      detail: `${rbes.length} RBE detections • belt response to HSS/GST drivers`,
      subMetrics: [
        { label: 'RBE events', value: rbes.length },
        { label: 'Co-located HSS', value: hss.length },
        { label: 'Level', value: `${beltLevel}/100` }
      ]
    }
  ];

  // Composite hazard score: Kp dominates, eruptions and radiation modulate.
  const composite = Math.round(
    (maxKp / 9) * 45 +
      (cmeLevel * 0.2) +
      (flareLevel * 0.1) +
      (radiationLevel * 0.15) +
      (windLevel * 0.1)
  );

  let overall = {
    status: 'quiet',
    label: 'Quiet / Normal Solar Activity',
    color: '#06b6d4',
    score: composite
  };
  if (maxKp >= 9) overall = { status: 'critical', label: 'EXTREME GEOMAGNETIC STORM ALERT', color: '#be123c', score: composite };
  else if (maxKp >= 8) overall = { status: 'critical', label: 'SEVERE SPACE WEATHER ALERT', color: '#f43f5e', score: composite };
  else if (maxKp >= 7) overall = { status: 'elevated', label: 'STRONG GEOMAGNETIC STORM', color: '#f59e0b', score: composite };
  else if (maxKp >= 6) overall = { status: 'elevated', label: 'MODERATE GEOMAGNETIC STORM', color: '#eab308', score: composite };
  else if (maxKp >= 5) overall = { status: 'watch', label: 'MINOR STORM ALERT (G1)', color: '#06b6d4', score: composite };
  else if (composite >= 35) overall = { status: 'watch', label: 'Elevated Solar Activity — No G-Scale Storm', color: '#0ea5e9', score: composite };

  return {
    indicators,
    overall,
    maxKp,
    avgKp,
    gScale,
    gLabel,
    gColor,
    rScale,
    sScale,
    peakSpeed,
    avgSpeed,
    avgKp: avgKp,
    days,
    totals: {
      cmes: cmes.length,
      flares: flares.length,
      storms: storms.length,
      seps: seps.length,
      ipss: ipss.length,
      mpcs: mpcs.length,
      rbes: rbes.length,
      hss: hss.length,
      wes: wes.length,
      xFlares: xFlares.length,
      mFlares: mFlares.length,
      strongFlares
    },
    earthCmes: earthCmes.length,
    earthWsa: wes.filter((w) => w.isEarthGB).length
  };
}

// ---------------------------------------------------------------------------
// 2. EVENT RELATIONSHIPS — causal chain reconstruction
// ---------------------------------------------------------------------------

export const CHAIN_STAGES = [
  { key: 'flare', label: 'Solar Flare', short: 'Flare', color: '#f59e0b', order: 0 },
  { key: 'cme', label: 'CME Eruption', short: 'CME', color: '#0d9488', order: 1 },
  { key: 'wind', label: 'Solar Wind Propagation', short: 'Wind', color: '#0ea5e9', order: 2 },
  { key: 'storm', label: 'Geomagnetic Storm', short: 'Storm', color: '#f43f5e', order: 3 },
  { key: 'radiation', label: 'Radiation Event', short: 'Radiation', color: '#8b5cf6', order: 4 }
];

const nearestWithin = (items, timeAccessor, target, windowHrs) => {
  let best = null;
  let bestDelta = Infinity;
  items.forEach((it) => {
    const t = parseTime(timeAccessor(it));
    if (!Number.isFinite(t)) return;
    const delta = Math.abs(t - target) / HOUR;
    if (delta <= windowHrs && delta < bestDelta) {
      bestDelta = delta;
      best = it;
    }
  });
  return best;
};

/**
 * Reconstruct causal event chains such as
 *   Solar Flare -> CME -> Solar Wind Propagation -> Geomagnetic Storm
 *
 * Linking strategy, in order of confidence:
 *  1. Explicit DONKI `linkedEvents` / `linkedCME` / `cmeID` references (confidence 0.95)
 *  2. WSA-ENLIL predicted shock arrival for the CME (confidence 0.9)
 *  3. Physical propagation window: shock at L1 within ~12h of predicted arrival,
 *     storm onset within ~24h of the shock (confidence 0.7)
 */
export function buildEventChains(data = {}, startDate, endDate) {
  const cmes = safeArr(data.cmes);
  const flares = safeArr(data.flares);
  const storms = safeArr(data.storms);
  const seps = safeArr(data.seps);
  const ipss = safeArr(data.ipss);
  const mpcs = safeArr(data.mpcs);
  const wes = safeArr(data.wes);
  const hss = safeArr(data.hss);

  const chains = [];
  const usedFlares = new Set();
  const usedStorms = new Set();
  const usedIps = new Set();

  // Build CME -> Flare association index from explicit links.
  const flareById = new Map(flares.filter((f) => f && f.flareID).map((f) => [f.flareID, f]));

  // Prefer peak time, fall back to begin time when peak is missing/unparseable
  // (DONKI occasionally returns partial timestamps).
  const flareTime = (f) => {
    const peak = parseTime(f.peakTime);
    if (Number.isFinite(peak)) return peak;
    return parseTime(f.beginTime);
  };

  const cmeList = [...cmes].sort(
    (a, b) => parseTime(a.startTime) - parseTime(b.startTime)
  );

  cmeList.forEach((cme) => {
    const cmeTime = parseTime(cme.startTime);
    if (!Number.isFinite(cmeTime)) return;

    const nodes = [];
    const links = [];
    let confidence = 0.5;

    // --- Stage 1: Solar Flare (must precede the CME) ---
    let flare = null;
    let flareConfidence = 0;
    const explicitFlareIds = safeIdArr(cme.linkedEvents);
    explicitFlareIds.forEach((id) => {
      if (flareById.has(id)) {
        const f = flareById.get(id);
        const ft = flareTime(f);
        if (Number.isFinite(ft) && ft <= cmeTime + HOUR && !usedFlares.has(f.flareID)) {
          flare = f;
          flareConfidence = 0.95;
        }
      }
    });
    if (!flare) {
      // Physical co-location: M/X flare within 3h before CME onset
      const cand = nearestWithin(
        flares.filter((f) => f && f.flareID && !usedFlares.has(f.flareID) && Number.isFinite(flareTime(f)) && flareTime(f) <= cmeTime),
        flareTime,
        cmeTime,
        3
      );
      if (cand && flareRank(cand.classType) >= 3) {
        flare = cand;
        flareConfidence = 0.65;
      }
    }

    if (flare) {
      usedFlares.add(flare.flareID);
      const ft = Number.isFinite(flareTime(flare)) ? new Date(flareTime(flare)).toISOString() : flare.peakTime || flare.beginTime;
      nodes.push({
        id: `flare-${flare.flareID}`,
        stage: 'flare',
        label: flare.classType || 'Flare',
        time: ft,
        detail: `${flare.flareID} • ${flare.sourceLocation || 'Unknown region'} • ${rScaleFromFlareClass(flare.classType).rScale}`,
        severity: flareRank(flare.classType)
      });
      links.push({ from: `flare-${flare.flareID}`, to: `cme-${cme.activityID}`, confidence: flareConfidence });
      confidence = Math.max(confidence, flareConfidence);
    }

    // --- Stage 2: CME ---
    const wsa = wes.find((w) => w.cmeID && w.cmeID === cme.activityID);
    nodes.push({
      id: `cme-${cme.activityID}`,
      stage: 'cme',
      label: `${cme.speed} km/s`,
      time: cme.startTime,
      detail: `${cme.activityID} • half-angle ${cme.halfAngle}° • ${cme.cmeType || 'Unknown'} • ${cme.sourceLocation || 'Unknown'}${
        cme.latitude != null && cme.longitude != null
          ? ` • ${cme.latitude}°, ${cme.longitude}°`
          : ''
      }`,
      severity: Math.min(5, Math.round(num(cme.speed) / 500)),
      // Machine-readable values so analytics never re-parses display labels.
      metric: { speed: num(cme.speed) }
    });

    // --- Stage 3: Solar wind propagation (WSA-ENLIL arrival + L1 shock) ---
    const predictedArrival = cme.enlilArrival || wsa?.estimatedShockArrivalTime || null;
    let windTime = null;
    let windDetail = '';
    let windConfidence = 0;

    if (predictedArrival) {
      windTime = predictedArrival;
      const transit = hoursBetween(cme.startTime, predictedArrival);
      windDetail = `WSA-ENLIL predicted arrival • transit ${transit != null ? transit.toFixed(1) : '—'} h${
        cme.isEarthGB ? ' • Earth geometrically b-directed' : ''
      }`;
      windConfidence = 0.9;
    }

    // Look for a measured L1 shock / magnetopause crossing near the arrival
    const searchTarget = Number.isFinite(parseTime(predictedArrival))
      ? parseTime(predictedArrival)
      : cmeTime + 36 * HOUR;

    let cmeToWind = null;
    const shock = nearestWithin(
      ipss.filter((s) => !usedIps.has(s.ipsID) && parseTime(s.eventTime) >= cmeTime - HOUR),
      (s) => s.eventTime,
      searchTarget,
      14
    );
    let mpc = null;

    if (shock) {
      usedIps.add(shock.ipsID);
      const measured = parseTime(shock.eventTime);
      const latency = hoursBetween(cme.startTime, shock.eventTime);
      windTime = shock.eventTime;
      windDetail = `Interplanetary shock at L1 • ${shock.location || 'Earth'} • transit ${latency != null ? latency.toFixed(1) : '—'} h • ${shock.instrument || 'n/a'}`;
      windConfidence = predictedArrival ? Math.max(0.85, windConfidence) : 0.8;
      cmeToWind = { from: `cme-${cme.activityID}`, to: `wind-${cme.activityID}`, confidence: windConfidence };

      mpc = nearestWithin(mpcs, (m) => m.eventTime, measured, 24);
    } else if (windTime) {
      cmeToWind = { from: `cme-${cme.activityID}`, to: `wind-${cme.activityID}`, confidence: windConfidence };
    }

    if (windTime) {
      nodes.push({
        id: `wind-${cme.activityID}`,
        stage: 'wind',
        label: predictedArrival && shock ? 'Shock + Arrival' : predictedArrival ? 'Predicted' : 'In Transit',
        time: windTime,
        detail: windDetail,
        severity: mpc ? 4 : shock ? 3 : 2
      });
      if (cmeToWind) links.push(cmeToWind);
      if (mpc) {
        nodes.push({
          id: `mpc-${mpc.mpcID}`,
          stage: 'wind',
          label: 'Magnetopause Crossing',
          time: mpc.eventTime,
          detail: `${mpc.mpcID} • ${mpc.instrument || 'n/a'}`,
          severity: 4
        });
        links.push({ from: `wind-${cme.activityID}`, to: `mpc-${mpc.mpcID}`, confidence: 0.7, selfStage: true });
      }
    }

    // --- Stage 4: Geomagnetic storm ---
    const stormTarget = windTime ? parseTime(windTime) : cmeTime + 48 * HOUR;
    const storm = nearestWithin(
      storms.filter((s) => !usedStorms.has(s.stormID)),
      (s) => s.startTime,
      stormTarget,
      windTime ? 30 : 12
    );
    if (storm) {
      usedStorms.add(storm.stormID);
      const kp = num(storm.maxKpIndex);
      const onset = hoursBetween(windTime || cme.startTime, storm.startTime);
      nodes.push({
        id: `storm-${storm.stormID}`,
        stage: 'storm',
        label: `Kp ${kp.toFixed(1)}`,
        time: storm.startTime,
        detail: `${storm.stormID} • max Kp ${kp.toFixed(2)} • NOAA ${gScaleFromKp(kp).gScale}`,
        severity: kp,
        metric: { kp }
      });
      const fromId = windTime ? `wind-${cme.activityID}` : `cme-${cme.activityID}`;
      if (!links.some((l) => l.from === fromId && l.to === `storm-${storm.stormID}`)) {
        links.push({ from: fromId, to: `storm-${storm.stormID}`, confidence: windTime ? 0.75 : 0.5 });
      }
      confidence = Math.max(confidence, windTime ? 0.75 : 0.5);
    }

    // --- Stage 5: Radiation ---
    const explicitSep = seps.find(
      (s) => s.linkedCME === cme.activityID || safeArr(cme.linkedEvents).includes(s.sepID)
    );
    const sep =
      explicitSep ||
      nearestWithin(
        seps,
        (s) => s.eventTime,
        windTime ? parseTime(windTime) : cmeTime + 12 * HOUR,
        36
      );
    if (sep) {
      nodes.push({
        id: `sep-${sep.sepID}`,
        stage: 'radiation',
        label: 'SEP / Proton Event',
        time: sep.eventTime,
        detail: `${sep.sepID} • ${sep.instrument || 'n/a'}${sep.linkedCME ? ` • linked CME ${sep.linkedCME}` : ' • association inferred'}`,
        severity: 3
      });
      const fromId = windTime ? `wind-${cme.activityID}` : `cme-${cme.activityID}`;
      links.push({ from: fromId, to: `sep-${sep.sepID}`, confidence: explicitSep ? 0.95 : 0.6 });
      if (explicitSep) confidence = Math.max(confidence, 0.9);
    }

    if (nodes.length < 2) return;

    // Present nodes in true chronological order so the UI stepper and the
    // timeline chart read as a physical sequence (e.g. SEP can be detected
    // before the L1 shock arrives, and the magnetopause crossing can lag the
    // storm onset, so stage order alone is not time order).
    nodes.sort((a, b) => {
      const ta = parseTime(a.time);
      const tb = parseTime(b.time);
      if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
      if (Number.isFinite(ta)) return -1;
      if (Number.isFinite(tb)) return 1;
      return 0;
    });

    const nodeCount = new Set(nodes.map((n) => n.stage)).size;
    confidence = Math.min(0.99, confidence + (nodeCount - 2) * 0.05);

    chains.push({
      id: `chain-${cme.activityID}`,
      root: cme.activityID,
      nodes,
      links,
      stages: [...new Set(nodes.map((n) => n.stage))].sort(
        (a, b) =>
          CHAIN_STAGES.findIndex((s) => s.key === a) - CHAIN_STAGES.findIndex((s) => s.key === b)
      ),
      start: nodes[0].time,
      end: nodes.reduce((acc, n) => (parseTime(n.time) > parseTime(acc) ? n.time : acc), nodes[0].time),
      durationHours: hoursBetween(nodes[0].time, nodes.reduce((acc, n) => (parseTime(n.time) > parseTime(acc) ? n.time : acc), nodes[0].time)),
      confidence,
      severity: Math.max(...nodes.map((n) => num(n.severity))),
      summary: buildChainSummary(nodes, cme)
    });
  });

  // Standalone HSS-driven recurrent storm chains (no CME required)
  hss.forEach((h) => {
    const t = parseTime(h.eventTime);
    if (!Number.isFinite(t)) return;
    if (chains.some((c) => c.nodes.some((n) => n.stage === 'wind' && n.time === h.eventTime))) return;
    const storm = nearestWithin(storms, (s) => s.startTime, t, 72);
    const nodes = [
      {
        id: `wind-hss-${h.hssID}`,
        stage: 'wind',
        label: 'HSS / CIR',
        time: h.eventTime,
        detail: `${h.hssID} • ${(h.instrument || 'n/a').split(',')[0]}`,
        severity: 2
      }
    ];
    const links = [];
    if (storm) {
      usedStorms.add(storm.stormID);
      const kp = num(storm.maxKpIndex);
      nodes.push({
        id: `storm-${storm.stormID}`,
        stage: 'storm',
        label: `Kp ${kp.toFixed(1)}`,
        time: storm.startTime,
        detail: `${storm.stormID} • NOAA ${gScaleFromKp(kp).gScale}`,
        severity: kp
      });
      links.push({ from: `wind-hss-${h.hssID}`, to: `storm-${storm.stormID}`, confidence: 0.6 });
    }
    if (nodes.length < 2) return;
    nodes.sort((a, b) => {
      const ta = parseTime(a.time);
      const tb = parseTime(b.time);
      if (Number.isFinite(ta) && Number.isFinite(tb)) return ta - tb;
      if (Number.isFinite(ta)) return -1;
      if (Number.isFinite(tb)) return 1;
      return 0;
    });
    chains.push({
      id: `chain-hss-${h.hssID}`,
      root: h.hssID,
      nodes,
      links,
      stages: [...new Set(nodes.map((n) => n.stage))],
      start: h.eventTime,
      end: nodes.reduce((acc, n) => (parseTime(n.time) > parseTime(acc) ? n.time : acc), h.eventTime),
      durationHours: hoursBetween(nodes[0].time, nodes.reduce((acc, n) => (parseTime(n.time) > parseTime(acc) ? n.time : acc), nodes[0].time)),
      confidence: 0.6,
      severity: Math.max(...nodes.map((n) => num(n.severity))),
      summary: `High-speed stream ${h.hssID} drove ${storm ? `Kp ${num(storm.maxKpIndex).toFixed(1)} disturbance` : 'no recorded storm response'}.`
    });
  });

  return chains.sort((a, b) => b.severity - a.severity || parseTime(b.start) - parseTime(a.start));
}

function buildChainSummary(nodes, cme) {
  const byStage = (k) => nodes.filter((n) => n.stage === k);
  const parts = [];
  const flare = byStage('flare')[0];
  if (flare) parts.push(`A ${flare.label} flare`);
  parts.push(`a ${cme.speed} km/s CME`);
  const wind = byStage('wind')[0];
  if (wind) parts.push('interplanetary propagation');
  const storm = byStage('storm')[0];
  if (storm) parts.push(`a ${storm.label} geomagnetic storm`);
  const rad = byStage('radiation')[0];
  if (rad) parts.push('a solar radiation event');
  return `${parts.join(' → ')}.`;
}

// ---------------------------------------------------------------------------
// 3. TRENDS, COMPARISONS, CORRELATIONS, ANOMALIES
// ---------------------------------------------------------------------------

/** Compare the first half of the window against the second half for every feed. */
export function buildTrends(data = {}, startDate, endDate) {
  const days = windowLengthDays(startDate, endDate) || 1;
  // Anchor the split to the *requested* window, not "now" — otherwise a
  // historical range would be compared against today's date.
  const endMs = parseTime(endDate);
  const startMs = parseTime(startDate);
  const anchorEnd = Number.isFinite(endMs) ? endMs : Date.now();
  const midpoint = Number.isFinite(startMs)
    ? startMs + (anchorEnd - startMs) / 2
    : anchorEnd - (days / 2) * DAY;

  const split = (arr, timeAccessor) => {
    const first = [];
    const second = [];
    arr.forEach((it) => {
      const t = parseTime(timeAccessor(it));
      if (!Number.isFinite(t)) return;
      (t < midpoint ? first : second).push(it);
    });
    return { first, second };
  };

  const feeds = [
    { key: 'cmes', label: 'CME', arr: safeArr(data.cmes), time: (c) => c.startTime, color: '#0d9488' },
    { key: 'flares', label: 'Flares', arr: safeArr(data.flares), time: (f) => f.peakTime, color: '#f59e0b' },
    { key: 'storms', label: 'Storms', arr: safeArr(data.storms), time: (s) => s.startTime, color: '#f43f5e' },
    { key: 'seps', label: 'SEP', arr: safeArr(data.seps), time: (s) => s.eventTime, color: '#8b5cf6' },
    { key: 'ipss', label: 'IPS', arr: safeArr(data.ipss), time: (s) => s.eventTime, color: '#10b981' },
    { key: 'rbes', label: 'RBE', arr: safeArr(data.rbes), time: (s) => s.eventTime, color: '#06b6d4' },
    { key: 'hss', label: 'HSS', arr: safeArr(data.hss), time: (s) => s.eventTime, color: '#0ea5e9' }
  ];

  const rows = feeds.map((f) => {
    const { first, second } = split(f.arr, f.time);
    const total = first.length + second.length;
    const delta = second.length - first.length;
    let direction = 'flat';
    if (total >= 4) {
      if (delta > total * 0.15) direction = 'rising';
      else if (delta < -total * 0.15) direction = 'falling';
    }
    return {
      key: f.key,
      label: f.label,
      color: f.color,
      first: first.length,
      second: second.length,
      total,
      delta,
      direction,
      pctChange: first.length ? Math.round((delta / first.length) * 100) : null
    };
  });

  // Daily activity series for sparkline-style charts
  const series = feeds.map((f) => ({
    key: f.key,
    label: f.label,
    color: f.color,
    points: dailySeries(f.arr, f.time, startDate, endDate)
  }));

  // CME speed trend over time
  const speedPoints = safeArr(data.cmes)
    .map((c) => ({ t: parseTime(c.startTime), v: num(c.speed) }))
    .filter((p) => Number.isFinite(p.t) && p.v > 0)
    .sort((a, b) => a.t - b.t);
  const speedTrend = speedPoints.length
    ? {
        slopePerDay: linearTrend(
          speedPoints.map((p) => p.t / DAY),
          speedPoints.map((p) => p.v)
        ),
        mean: mean(speedPoints.map((p) => p.v)),
        median: median(speedPoints.map((p) => p.v)),
        stdDev: stdDev(speedPoints.map((p) => p.v))
      }
    : null;

  return { rows, series, speedTrend, days, midpoint };
}

/** Cross-feed correlations and event associations. */
export function buildCorrelations(data = {}, chains = []) {
  const results = [];

  // CME speed vs. resulting Kp
  const cmeStormPairs = chains
    .filter((c) => c.nodes.some((n) => n.stage === 'cme') && c.nodes.some((n) => n.stage === 'storm'))
    .map((c) => ({
      speed: num(c.nodes.find((n) => n.stage === 'cme')?.metric?.speed),
      kp: num(c.nodes.find((n) => n.stage === 'storm')?.metric?.kp)
    }))
    .filter((p) => p.speed > 0 && p.kp > 0);
  if (cmeStormPairs.length >= 3) {
    const r = pearson(cmeStormPairs.map((p) => p.speed), cmeStormPairs.map((p) => p.kp));
    if (r != null) {
      results.push({
        pair: 'CME speed vs. peak Kp',
        r,
        strength: Math.abs(r) >= 0.7 ? 'strong' : Math.abs(r) >= 0.4 ? 'moderate' : 'weak',
        direction: r > 0 ? 'positive' : 'negative',
        note:
          Math.abs(r) >= 0.4
            ? `Faster CMEs are associated with ${r > 0 ? 'stronger' : 'weaker'} geomagnetic response in this window.`
            : 'CME speed alone does not determine geomagnetic response in this window — magnetic orientation (Bz) matters.'
      });
    }
  }

  // Flare -> CME association rate
  const cmes = safeArr(data.cmes);
  const flareLinked = chains.filter((c) => c.stages.includes('flare') && c.stages.includes('cme')).length;
  if (cmes.length) {
    const rate = flareLinked / cmes.length;
    results.push({
      pair: 'Flare → CME association rate',
      r: rate,
      strength: rate >= 0.6 ? 'strong' : rate >= 0.3 ? 'moderate' : 'weak',
      direction: 'positive',
      note: `${flareLinked} of ${cmes.length} CMEs (${Math.round(rate * 100)}%) are linked to a precursor solar flare in this window.`
    });
  }

  // SEP linkage
  const seps = safeArr(data.seps);
  if (seps.length) {
    const linked = seps.filter((s) => s.linkedCME).length;
    const rate = linked / seps.length;
    results.push({
      pair: 'SEP → parent CME linkage',
      r: rate,
      strength: rate >= 0.6 ? 'strong' : rate >= 0.3 ? 'moderate' : 'weak',
      direction: 'positive',
      note: `${linked} of ${seps.length} SEP events (${Math.round(rate * 100)}%) carry an explicit DONKI parent-CME reference.`
    });
  }

  // Chain completeness
  if (chains.length) {
    const complete = chains.filter((c) => c.stages.length >= 4).length;
    results.push({
      pair: 'Fully-resolved event chains',
      r: complete / chains.length,
      strength: complete / chains.length >= 0.4 ? 'strong' : complete / chains.length > 0 ? 'moderate' : 'weak',
      direction: 'positive',
      note: `${complete} of ${chains.length} reconstructed chains span 4+ stages (Flare → CME → Wind → Storm).`
    });
  }

  return results;
}

/** Statistical outliers worth flagging in Mission Control / ORBIT. */
export function buildAnomalies(data = {}, chains = []) {
  const out = [];
  const cmes = safeArr(data.cmes);
  const speeds = cmes.map((c) => num(c.speed)).filter((v) => v > 0);
  if (speeds.length >= 4) {
    const m = mean(speeds);
    const sd = stdDev(speeds);
    // Robust threshold: on small samples a single extreme value inflates σ and
    // hides itself behind a strict 2σ gate, so also flag anything beyond
    // 1.5× the interquartile-style band, and always flag >1200 km/s ejections
    // which are notable in their own right.
    const sorted = [...speeds].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const zLimit = sd > 0 ? 2 : Infinity;
    const iqrHigh = q3 + 1.5 * iqr;
    cmes.forEach((c) => {
      const v = num(c.speed);
      if (v <= 0) return;
      const zScore = sd > 0 ? Math.abs(v - m) / sd : 0;
      const isZOutlier = zScore > zLimit;
      const isIqrOutlier = iqr > 0 && v > iqrHigh;
      const isNotablyFast = v >= 1200;
      if (isZOutlier || isIqrOutlier || isNotablyFast) {
        out.push({
          type: 'cme',
          id: c.activityID,
          value: `${v} km/s`,
          note: `CME speed ${v} km/s is ${v > m ? 'far above' : 'far below'} the window mean (${Math.round(m)} km/s, σ=${Math.round(sd)}).`,
          time: c.startTime,
          severity: v >= 1500 ? 4 : 3
        });
      }
    });
  }
  safeArr(data.storms).forEach((s) => {
    const kp = num(s.maxKpIndex);
    if (kp >= 7) {
      out.push({
        type: 'storm',
        id: s.stormID,
        value: `Kp ${kp.toFixed(1)}`,
        note: `${gScaleFromKp(kp).gScale} (${gScaleFromKp(kp).label}) geomagnetic storm — grid/transport impact likely.`,
        time: s.startTime,
        severity: kp
      });
    }
  });
  safeArr(data.flares)
    .filter((f) => (f.classType || '').startsWith('X'))
    .forEach((f) => {
      out.push({
        type: 'flare',
        id: f.flareID,
        value: f.classType,
        note: `X-class flare — ${rScaleFromFlareClass(f.classType).rScale} radio blackout conditions on the sun-facing hemisphere.`,
        time: f.peakTime,
        severity: 5
      });
    });
  chains
    .filter((c) => c.stages.length >= 4)
    .forEach((c) => {
      out.push({
        type: 'chain',
        id: c.id,
        value: `${c.stages.length}-stage chain`,
        note: `Full causal sequence resolved (${Math.round(c.confidence * 100)}% confidence): ${c.summary}`,
        time: c.start,
        severity: c.severity
      });
    });
  return out.sort((a, b) => b.severity - a.severity).slice(0, 20);
}

/** Rank/compare feeds by activity share (for donut + comparison widgets). */
export function buildActivityBreakdown(data = {}) {
  const totals = {
    CME: safeArr(data.cmes).length,
    Flares: safeArr(data.flares).length,
    Storms: safeArr(data.storms).length,
    SEP: safeArr(data.seps).length,
    IPS: safeArr(data.ipss).length,
    MPC: safeArr(data.mpcs).length,
    RBE: safeArr(data.rbes).length,
    HSS: safeArr(data.hss).length,
    'WSA-ENLIL': safeArr(data.wes).length
  };
  const colors = {
    CME: '#0d9488',
    Flares: '#f59e0b',
    Storms: '#f43f5e',
    SEP: '#8b5cf6',
    IPS: '#10b981',
    MPC: '#6366f1',
    RBE: '#06b6d4',
    HSS: '#0ea5e9',
    'WSA-ENLIL': '#ec4899'
  };
  const sum = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
  return Object.entries(totals).map(([name, value]) => ({
    name,
    value,
    color: colors[name],
    share: Math.round((value / sum) * 100)
  }));
}

// ---------------------------------------------------------------------------
// 4. NATURAL-LANGUAGE TELEMETRY BRIEF FOR ORBIT
// ---------------------------------------------------------------------------

/** Compact, model-friendly snapshot of derived analytics. */
export function buildAnalysisBrief(data = {}, startDate, endDate, meta = {}) {
  const status = buildMissionControlStatus(data, startDate, endDate);
  const chains = buildEventChains(data, startDate, endDate);
  const trends = buildTrends(data, startDate, endDate);
  const correlations = buildCorrelations(data, chains);
  const anomalies = buildAnomalies(data, chains);

  const lines = [];
  lines.push('== DERIVED MISSION CONTROL STATUS ==');
  lines.push(
    `Overall: ${status.overall.label} | composite hazard score ${status.overall.score}/100 | NOAA ${status.gScale} (${status.gLabel}), max Kp ${status.maxKp.toFixed(2)}, avg Kp ${status.avgKp.toFixed(2)}`
  );
  status.indicators.forEach((i) => {
    lines.push(
      `- ${i.label}: ${i.value} ${i.unit} (${i.statusLabel}, risk ${i.level}/100, ${i.rate}/day) — ${i.detail}`
    );
  });
  lines.push(`Window length: ${status.days} days. Source: ${meta.dataOrigin === 'cache' ? 'SQLite cache' : 'NASA DONKI live API'}.`);

  lines.push('');
  lines.push('== EVENT RELATIONSHIP CHAINS (Flare -> CME -> Solar Wind -> Storm) ==');
  if (!chains.length) {
    lines.push('- No multi-stage causal chains could be reconstructed in this window.');
  } else {
    const full = chains.filter((c) => c.stages.length >= 3);
    lines.push(
      `- ${chains.length} chains reconstructed (${full.length} spanning 3+ stages, ${chains.filter((c) => c.stages.length >= 4).length} spanning 4+ stages).`
    );
    chains.slice(0, 6).forEach((c) => {
      const path = c.nodes
        .filter((n) => n.id.includes('mpc-') === false)
        .map((n) => `${n.stage}(${n.time ? String(n.time).slice(0, 16).replace('T', ' ') : '—'})`)
        .join(' -> ');
      lines.push(
        `- [conf ${Math.round(c.confidence * 100)}%] ${path}${c.durationHours != null ? ` | span ${c.durationHours.toFixed(1)} h` : ''}`
      );
    });
  }

  lines.push('');
  lines.push('== TRENDS (first half vs second half of window) ==');
  trends.rows.forEach((r) => {
    lines.push(
      `- ${r.label}: ${r.first} -> ${r.second} (${r.direction}${r.pctChange != null ? `, ${r.pctChange > 0 ? '+' : ''}${r.pctChange}%` : ''})`
    );
  });
  if (trends.speedTrend) {
    lines.push(
      `- CME speed: mean ${Math.round(trends.speedTrend.mean)} km/s, median ${Math.round(trends.speedTrend.median)} km/s, σ ${Math.round(trends.speedTrend.stdDev)} km/s, slope ${trends.speedTrend.slopePerDay.toFixed(1)} km/s per day`
    );
  }

  lines.push('');
  lines.push('== RELATIONSHIPS / CORRELATIONS ==');
  if (!correlations.length) lines.push('- Not enough paired events in this window to compute associations.');
  correlations.forEach((c) => {
    lines.push(
      `- ${c.pair}: ${c.strength} ${c.direction} (r=${c.r.toFixed(2)}) — ${c.note}`
    );
  });

  lines.push('');
  lines.push('== NOTABLE ANOMALIES ==');
  if (!anomalies.length) lines.push('- None detected.');
  anomalies.slice(0, 8).forEach((a) => lines.push(`- [${a.type}] ${a.id}: ${a.note}`));

  if (meta.sqliteCounts && Object.values(meta.sqliteCounts).some((v) => v > 0)) {
    const c = meta.sqliteCounts;
    lines.push('');
    lines.push(
      `== PERSISTED DB TOTALS == CME ${c.cmes || 0}, FLR ${c.flares || 0}, GST ${c.storms || 0}, SEP ${c.seps || 0}, IPS ${c.ipss || 0}, MPC ${c.mpcs || 0}, RBE ${c.rbes || 0}, HSS ${c.hss || 0}, WSA ${c.wes || 0}, cached queries ${c.queries || 0}`
    );
  }

  return lines.join('\n');
}

/** Cached memoised analysis so ORBIT/dashboard do not recompute per keystroke. */
let briefCache = { key: null, value: null };

export function getAnalysisBrief(data = {}, startDate, endDate, meta = {}) {
  const totals = buildMissionControlStatus(data, startDate, endDate).totals;
  const key = JSON.stringify([startDate, endDate, totals, meta.dataOrigin, meta.sqliteCounts]);
  if (briefCache.key === key) return briefCache.value;
  const value = buildAnalysisBrief(data, startDate, endDate, meta);
  briefCache = { key, value };
  return value;
}

export function clearAnalysisCache() {
  briefCache = { key: null, value: null };
}
