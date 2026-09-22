import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, Sparkles, X, RotateCcw,
  Zap, Sun, ShieldAlert, Activity, Compass, Database, Cpu, Sliders
} from 'lucide-react';

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
}) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `👋 **Hello! I am ORBIT**, your solar telemetry copilot — with **full DB access**.\n\nI can assist you with:\n- 📊 **Live Status (9 feeds / 8 phenomena)** — CME, FLR, GST, SEP, IPS, **MPC, RBE, HSS, WSA-ENLIL**\n- ⚡ **6 Core Scala Algorithms**\n- 🪐 **Phenomena Details + Best Visualizations** (table-aware)\n- 🧲 **MPC / 🛰️ RBE / 💨 HSS / 🛰️ WSA Predictions**\n- 💾 **SQLite WASM DB — 9 tables, counts, sample rows ("list MPC", "fastest CME", "WSA arrivals")**\n- 👥 **Engineers (Kailash & SriViknesh)**\n\nAsk me anything — e.g., *"What is RBE?"*, *"list 3 HSS events"*, *"how many in DB?"*, *"WSA Earth arrivals?"*`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Local fallback intelligence engine (ORBIT) — now covers 9 DONKI feeds / 8 phenomena + DB
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
      const fmt = (arr, fields, n=3) => arr.slice(0,n).map((o,i)=> `${i+1}. \`${fields.map(f=>o[f]||'N/A').join('` | `')}\``).join('\n');
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
        `   - Formulated the 6 core filtering and statistical algorithms.\n` +
        `   - Engineered SQLite schema design and NASA API integrations.\n\n` +
        `2. **SriViknesh** — *Frontend Architect & Visualization Lead*\n` +
        `   - Designed the React 18 frontend architecture and state persistence.\n` +
        `   - Built the interactive Apache ECharts multi-chart visualization suite.\n` +
        `   - Developed the dark cosmic UI design system and AI copilot interface.`;
    }

    // Default Fallback Response — now DB-aware
    const hintCounts = `Live window: CME ${totalCmes}, FLR ${totalFlares}, GST ${totalStorms}, SEP ${totalSeps}, IPS ${totalIpss}, MPC ${totalMpcs}, RBE ${totalRbes}, HSS ${totalHss}, WSA ${totalWes} | DB: ${db.cmes||0}/${db.flares||0}/${db.storms||0}/${db.seps||0}/${db.ipss||0}/${db.mpcs||0}/${db.rbes||0}/${db.hss||0}/${db.wes||0}`;
    return `🛰️ **ORBIT Assistant** — I have full DB access.\n` +
      `I received: *"${rawQuery}"*.\n\n` +
      `Try these (all 8 phenomena + DB):\n` +
      `- 📊 *"Summarize live telemetry"* — 9 feeds now\n` +
      `- 🛰️ *"What is RBE / HSS / MPC / WSA-ENLIL?"* — deep dive per feed\n` +
      `- 📈 *"Best visualization for geomagnetic storm?"* — table-aware\n` +
      `- 💾 *"How many in DB?"* or *"list 3 MPC events"* / *"fastest CME"* / *"WSA Earth arrivals"* — I read from \`data\` + \`sqliteCounts\`\n` +
      `- ⚡ *"Explain the 6 Scala algorithms"* | *"Difference CME vs Flare"* | *"Who built SpaceGuard?"*\n\n` +
      `_Hint — ${hintCounts}_`;
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

    // If OpenRouter key is set, call live OpenRouter API (ORBIT) — with effective key + fallback
    const effectiveKey = getEffectiveOrbitKey(openRouterApiKey);
    // Debug aid — shows in console why fallback triggers
    if (!effectiveKey) {
      console.info('[ORBIT] No effective OpenRouter key found (prop=' + (openRouterApiKey ? 'set' : 'empty') + ', localStorage=' + (()=>{try{return localStorage.getItem("openrouter_api_key")?"set":"empty"}catch{return "unavailable"}})() + ', env=' + (import.meta.env.VITE_OPENROUTER_API_KEY ? 'set' : 'empty') + ') — using local engine.');
    }
    if (effectiveKey && effectiveKey.length > 10) {
      try {
        const totalCmes = data.cmes?.length || 0;
        const peakSpeed = totalCmes > 0 ? Math.max(...data.cmes.map(c => c.speed || 0)) : 0;
        const totalMpcs = data.mpcs?.length || 0;
        const totalRbes = data.rbes?.length || 0;
        const totalHss = data.hss?.length || 0;
        const totalWes = data.wes?.length || 0;
        const db = sqliteCounts || {};
        const systemPrompt = `You are ORBIT, an expert space weather astrophysicist and telemetry assistant for the SpaceGuard NASA DONKI platform. 
You were formerly called SpaceGuard AI — now you are ORBIT. Always identify as ORBIT.
You have FULL DATABASE ACCESS via sql.js WASM (9 tables) — use sqliteCounts when asked about DB totals, and live data arrays when asked about current window.

Current Live Telemetry State (use ONLY when user explicitly asks about current/live/summary/stats):
- Date Range: ${startDate} to ${endDate}
- Ingestion Source: ${dataOrigin === 'cache' ? 'SQLite WASM Browser Cache (0 API Calls)' : 'NASA DONKI Live REST API (9 feeds, parallel Future, 120s Await)'}
- Threat Assessment: ${threatLevel?.level || 'Quiet'} (${threatLevel?.gScale || 'G0'})
- Peak Planetary Kp: ${maxKp?.toFixed(2) || '0.00'}
- Live window: CME ${totalCmes} (Peak ${peakSpeed} km/s, Earth-GB ${data.cmes?.filter(c=>c.isEarthGB)?.length||0}), Flares ${data.flares?.length||0}, GST ${data.storms?.length||0}, SEP ${data.seps?.length||0}, IPS ${data.ipss?.length||0}, MPC ${totalMpcs}, RBE ${totalRbes}, HSS ${totalHss}, WSA-ENLIL ${totalWes} (Earth-GB ${data.wes?.filter(w=>w.isEarthGB)?.length||0})
- Persisted DB totals: CMEs ${db.cmes||0}, Flares ${db.flares||0}, Storms ${db.storms||0}, SEP ${db.seps||0}, IPS ${db.ipss||0}, MPC ${db.mpcs||0}, RBE ${db.rbes||0}, HSS ${db.hss||0}, WSA ${db.wes||0}, queries ${db.queries||0}
Core Engine: Scala 3 (V9.scala) with 6 core algorithms + 9 DONKI feeds (CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSAEnlilSimulations) (mention ONLY if user asks about algorithms/engine).
Phenomena table (8): 🌍 Geomagnetic (CME+IPS+HSS+Kp+MPC), ☢️ SEP (FLR+CME+SEP), 🛰️ RBE (RBE+Kp+CME+HSS), ☄️ CME Earth (lat/lon+speed+width+WSA+FLR), ⚡ Flare (class+peak+AR), 💨 HSS (HSS+Kp+RBE), 🌊 IPS (arrival+wind change+CME link), 🧲 MPC (MPC+HSS+Kp).
Best visualizations per table available — cite when asked.
Engineers: Kailash (Lead Data Engineer & Backend Architect) and SriViknesh (Frontend Architect & Visualization Lead).
Threat rule (for “why G3/G1?”): NOAA G-scale is Kp-only: G1 Kp≥5, G2 Kp≥6, G3 Kp≥7, G4 Kp≥8, G5 Kp≥9. CME speed / M/X flares do NOT set G-scale — they are R-scale / eruption metrics.

STRICT STYLE RULES:
- For simple definitions like "what are CME Events?" give a SHORT answer: 2-4 sentences or 3-5 bullets, 80-120 words max. No tables. No live telemetry dump. No algorithm section. No impact tables unless asked.
- Only include live telemetry numbers when user asks about current/live/summary/telemetry/status/counts/threat. Never dump all metrics unsolicited.
- For “why G3?” etc: explain G-scale is from max Kp in GST data, not CME count/speed. If Kp is 0.00, say Quiet/G0 and note flare/CME are separate risks. Keep to 3-5 bullets, no truncation.
- Only explain the 6 algorithms when user asks about algorithms/engine/processing.
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
            <div className="text-[10px] text-slate-400 font-medium">Solar Telemetry Copilot</div>
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
                  {getEffectiveOrbitKey(openRouterApiKey) ? `ORBIT · openrouter/free · OpenRouter` : 'ORBIT · Built-in Engine (no key)'}
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

          {/* Simple Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask about solar telemetry, algorithms..."
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
