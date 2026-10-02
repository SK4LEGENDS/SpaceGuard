import React, { useRef } from 'react';
import {
  Rocket, Zap, Activity, ShieldAlert, ArrowRight, Sun, Bot,
  Compass, Radio, Database, BarChart3, LineChart, PieChart, Sparkles,
  Satellite, AlertTriangle, ShieldCheck, WifiOff, Navigation,
  BatteryCharging, Wind, Magnet, Orbit, GitBranch as GitBranchIcon,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import useReveal from '../hooks/useReveal';

const FEEDS = [
  { code: 'CME', name: 'Coronal Mass Ejections', color: 'text-cyan-400' },
  { code: 'FLR', name: 'Solar Flares', color: 'text-amber-400' },
  { code: 'GST', name: 'Geomagnetic Storms', color: 'text-rose-400' },
  { code: 'SEP', name: 'Energetic Particles', color: 'text-purple-400' },
  { code: 'IPS', name: 'Interplanetary Shocks', color: 'text-emerald-400' },
  { code: 'MPC', name: 'Magnetopause Crossings', color: 'text-indigo-400' },
  { code: 'RBE', name: 'Radiation Belt Enhancements', color: 'text-cyan-400' },
  { code: 'HSS', name: 'High-Speed Streams', color: 'text-sky-400' },
  { code: 'WSA', name: 'ENLIL Forecasts', color: 'text-amber-400' }
];

const PHENOMENA = [
  { abbr: 'CME', title: 'Coronal Mass Ejections', icon: Zap, tint: 'text-cyan-400', desc: 'Billion-ton plasma at 300–3000+ km/s, 11-col (lat/lon, half-angle, linkedEvents, WSA arrival/GB) for the 2D direction scatter & WSA arrival timeline.' },
  { abbr: 'FLR', title: 'Solar Flares', icon: Sun, tint: 'text-amber-400', desc: 'GOES X-ray bursts A/B/C/M/X — tuple-rank sort drives the flare intensity timeline & active-region breakdown.' },
  { abbr: 'GST', title: 'Geomagnetic Storms', icon: ShieldAlert, tint: 'text-rose-400', desc: 'Kp max-reduce (G0 <5 → G5 ≥9, Kp-only) feeding the Kp area chart and the live threat banner.' },
  { abbr: 'SEP', title: 'Solar Energetic Particles', icon: Activity, tint: 'text-purple-400', desc: 'Relativistic protons + linked parent CME — particle-flux proxy line and Flare→CME→SEP timing bar.' },
  { abbr: 'IPS', title: 'Interplanetary Shocks', icon: Compass, tint: 'text-emerald-400', desc: 'L1 shock fronts from ACE/DSCOVR — arrival timeline with before/after solar-wind comparison.' },
  { abbr: 'MPC', title: 'Magnetopause Crossings', icon: Magnet, tint: 'text-indigo-400', desc: 'SWMF-modelled eventTime + linkedEvents for the MPC timeline and the MPC+HSS+GST multi-line.' },
  { abbr: 'RBE', title: 'Radiation Belt Enhancements', icon: Radio, tint: 'text-cyan-400', desc: 'GOES-P >2 MeV electrons — daily RBE count as an electron-flux proxy, charted against HSS and GST.' },
  { abbr: 'HSS', title: 'High-Speed Streams', icon: Wind, tint: 'text-sky-400', desc: 'Coronal-hole wind at 500–800 km/s — daily HSS count and speed-vs-time line.' },
  { abbr: 'WSA', title: 'WSA-ENLIL Forecasts', icon: Orbit, tint: 'text-amber-400', desc: 'Cone inputs lat/lon/speed/halfAngle → arrival, Kp and rmin_re, flattened per simulationID::cmeID for the Earth-arrival timeline.' }
];

const HAZARDS = [
  { icon: BatteryCharging, tint: 'text-amber-400', title: 'Power Grid Transformers', desc: 'Geomagnetically Induced Currents from extreme storms can saturate high-voltage transformer cores, causing blackouts and grid failure.' },
  { icon: Navigation, tint: 'text-cyan-400', title: 'GNSS & GPS Precision', desc: 'Ionospheric scintillations delay and refract L-band signals, producing positioning errors for aviation, maritime and defence navigation.' },
  { icon: Satellite, tint: 'text-purple-400', title: 'Satellite Orbital Drag', desc: 'Extreme UV and X-ray heating expands the upper thermosphere, dramatically increasing atmospheric drag on LEO satellites and stations.' },
  { icon: WifiOff, tint: 'text-rose-400', title: 'HF Radio Communications', desc: 'Solar flares ionise the ionospheric D-layer, causing total high-frequency radio blackouts across the sunlit side for hours.' }
];

const ORBIT_PILLARS = [
  { icon: Database, tint: 'text-cyan-400', title: '10-Table DB Access', desc: 'Reads live data plus persisted sqliteCounts — CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSA and the query cache. Try “list 3 MPC” or “DB totals”.' },
  { icon: Sparkles, tint: 'text-purple-400', title: '8 Phenomena Expert', desc: 'Plain-language answers on RBE, HSS, MPC and WSA-ENLIL, each with the best visualisation for that table.' },
  { icon: Bot, tint: 'text-amber-400', title: 'Resilient Router', desc: 'openrouter/free auto-picks the best free model, with sequential Gemma → Llama → GPT-OSS fallbacks on 404.' },
  { icon: GitBranchIcon, tint: 'text-teal-400', title: 'Causal Chain Reasoning', desc: 'Reconstructs Flare → CME → Solar Wind → Storm → Radiation sequences, so “why did the storm happen?” gets the real timeline.' },
  { icon: TrendingUpIcon, tint: 'text-emerald-400', title: 'Statistics & Correlations', desc: 'Pearson r for CME speed vs. peak Kp, linear trend slopes, flare→CME and SEP→parent linkage rates, chain completeness.' },
  { icon: AlertTriangle, tint: 'text-rose-400', title: 'Anomaly & Threat Watch', desc: 'Flags velocity and Kp outliers, Kp≥7 storms, X-class flares and hazard-score escalation before you go looking for it.' }
];

const PIPELINE = [
  { n: '01', title: 'NASA DONKI', tint: 'text-cyan-400', desc: 'Nine REST endpoints — CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations — fanned out in parallel with a 120s barrier.' },
  { n: '02', title: 'Scala 3 Engine', tint: 'text-amber-400', desc: 'Future-based 9-way fan-out plus 9 algorithms: trajectory, GOES ranking, Kp reduction, statistics, persistence, binning, theming.' },
  { n: '03', title: 'SQLite × 10', tint: 'text-purple-400', desc: '9 feed tables plus a query cache, ACID idempotent writes, 11-column CME records and flattened WSA-ENLIL rows.' },
  { n: '04', title: 'Render & Reason', tint: 'text-cyan-300', desc: 'ECharts visualises 15+ palette-aware charts; ORBIT reasons over the same telemetry layer to answer in plain language.' }
];

const SCALES = [
  { tag: 'G', range: 'G1 – G5', title: 'Geomagnetic Storms', tint: 'text-rose-300', bar: 'from-rose-500/70', desc: 'Driven by CME plasma impact. G1 causes weak grid fluctuations; G5 collapses transformers and drags aurora to the equator.' },
  { tag: 'R', range: 'R1 – R5', title: 'Radio Blackouts', tint: 'text-amber-300', bar: 'from-amber-500/70', desc: 'Driven by X-ray solar flares. R1 degrades HF comms; R5 blacks out HF entirely across the sunlit hemisphere.' },
  { tag: 'S', range: 'S1 – S5', title: 'Radiation Storms', tint: 'text-purple-300', bar: 'from-purple-500/70', desc: 'Driven by high-energy SEP protons. S1 is minor satellite noise; S5 is an unavoidable hazard for astronauts and polar flight.' }
];

const CHARTS = [
  { icon: BarChart3, tint: 'text-cyan-400', title: 'CME Velocity & 2D Direction', desc: 'Speed bars plus the lat/lon scatter — bubble area encodes angular width, colour encodes speed across all 6 palettes.' },
  { icon: PieChart, tint: 'text-amber-400', title: 'Flare & Flux Timelines', desc: 'GOES class donut and rank timeline, with daily count proxies standing in for SEP particle flux, RBE electron flux and HSS wind speed.' },
  { icon: LineChart, tint: 'text-rose-400', title: 'Kp & Multi-Source Lines', desc: 'Kp area with G1/G3/G5 markers, the five-line geomagnetic overlay, and the stage-to-stage flow Sankey.' }
];

export default function LandingPage({ setCurrentView }) {
  const pageRef = useRef(null);
  useReveal(pageRef);

  return (
    <div ref={pageRef} className="space-y-28 sm:space-y-36 py-8 text-slate-100">

      {/* ================= HERO ================= */}
      <section className="sg-panel overflow-hidden px-6 sm:px-12 py-20 sm:py-28 text-center">
        {/* Aurora wash — the page's only large decorative layer */}
        <div className="sg-aurora bg-gradient-to-br from-cyan-500/20 via-violet-500/15 to-emerald-500/10" />
        <div className="sg-aurora bg-gradient-to-tr from-fuchsia-500/10 via-transparent to-cyan-400/15" style={{ animationDelay: '-9s' }} />

        <div className="relative max-w-4xl mx-auto space-y-8">
          <div data-reveal className="sg-chip">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            NASA DONKI Telemetry &amp; Space Weather Engine
          </div>

          <h1
            data-reveal
            style={{ '--reveal-delay': '80ms' }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans leading-[1.05]"
          >
            <span className="text-white">Space Weather</span><br />
            <span className="sg-gradient-text">Intelligence, in Real Time</span>
          </h1>

          <p
            data-reveal
            style={{ '--reveal-delay': '160ms' }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Nine DONKI feeds from NASA GSFC and CCMC Kauai, pulled in parallel by a
            Scala 3 engine, persisted to SQLite, and rendered as fifteen-plus live
            charts — with <span className="text-cyan-300 font-semibold">ORBIT</span>,
            a copilot that reads the same telemetry you do.
          </p>

          <div data-reveal style={{ '--reveal-delay': '240ms' }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="group w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:gap-3.5 hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.7)]"
            >
              <Database className="w-4 h-4" />
              Launch Main Dashboard
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setCurrentView('docs')}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-slate-300 font-semibold text-sm sg-underline hover:text-white transition-colors duration-300"
            >
              Read the Engine Specs
            </button>
          </div>
        </div>
      </section>

      {/* ================= LIVE FEED TICKER ================= */}
      <section className="sg-strip relative rounded-2xl overflow-hidden py-4" aria-label="NASA DONKI feeds monitored">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="sg-marquee">
          <div className="sg-marquee-track">
            {[...FEEDS, ...FEEDS].map((f, i) => (
              <span key={`${f.code}-${i}`} className="flex items-center gap-3 px-8 whitespace-nowrap">
                <span className={`px-2 py-0.5 rounded-md bg-slate-900/70 border border-slate-700/70 text-sm font-bold font-mono ${f.color}`}>{f.code}</span>
                <span className="text-sm text-slate-400">{f.name}</span>
                <span className="w-1 h-1 rounded-full bg-slate-700" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PHENOMENA ================= */}
      <section className="sg-panel p-8 sm:p-12 space-y-14">
        <div data-reveal className="max-w-2xl space-y-4">
          <span className="sg-chip">Coverage</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans leading-tight">
            Nine feeds, eight phenomena,<br className="hidden sm:block" /> one timeline
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Every observation DONKI publishes is ingested, reduced, and mapped onto a
            phenomenon view — from a fast CME's launch coordinates to the geomagnetic
            storm it eventually triggers.
          </p>
        </div>

        {/* Translucent rows with hairline borders — lifts and glows on hover */}
        <ul className="space-y-2.5">
          {PHENOMENA.map((p, i) => {
            const Icon = p.icon;
            return (
              <li
                key={p.abbr}
                data-reveal="up"
                style={{ '--reveal-delay': `${Math.min(i, 6) * 60}ms` }}
                className="sg-row group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-4 sm:py-5 px-4 sm:px-6">
                  <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
                    <Icon className={`w-5 h-5 ${p.tint} transition-transform duration-300 group-hover:scale-110`} />
                    <span className={`font-mono text-sm font-bold ${p.tint}`}>{p.abbr}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white sm:w-60 sm:shrink-0">{p.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ================= ORBIT ================= */}
      <section className="sg-panel sg-panel-glow overflow-hidden p-8 sm:p-12 space-y-14">
        <div className="sg-aurora bg-gradient-to-tr from-violet-500/15 via-transparent to-cyan-500/15" />

        <div className="relative space-y-14">
          <div data-reveal className="max-w-2xl space-y-5">
            <span className="sg-chip">
              <Bot className="w-3.5 h-3.5" />
              The Copilot
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-sans leading-tight">
              Meet <span className="sg-gradient-text">ORBIT</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Not a chat window bolted onto a dashboard. ORBIT is wired to the same{' '}
              <code className="text-cyan-300 font-mono text-sm">telemetryAnalysis</code> layer
              that drives Mission Control and the Event Relationship Timeline, so it reasons
              over your actual rows — answering <em>“why did the storm happen?”</em> with the
              real chain, not a generic paragraph.
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Auto-routed through <code className="text-cyan-300 font-mono text-sm">openrouter/free</code>{' '}
              with sequential model fallbacks, and a local analysis engine when no key is set —
              so it always answers, even offline.
            </p>
          </div>

          {/* Pillars as translucent cells on a wide grid — no nested cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ORBIT_PILLARS.map((o, i) => {
              const Icon = o.icon;
              return (
                <div
                  key={o.title}
                  data-reveal="up"
                  style={{ '--reveal-delay': `${(i % 3) * 90}ms` }}
                  className="sg-row sg-row-lift group p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-9 w-9 items-center justify-center">
                      <span className="sg-ping-ring absolute inset-0" />
                      <Icon className={`w-5 h-5 ${o.tint} relative`} />
                    </span>
                    <h3 className="sg-underline text-base font-bold text-white">{o.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{o.desc}</p>
                </div>
              );
            })}
          </div>

          <div data-reveal className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="group px-7 py-3.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center gap-2.5 transition-all duration-300 hover:gap-3.5 hover:shadow-[0_0_36px_-6px_rgba(34,211,238,0.6)]"
            >
              <Bot className="w-4 h-4" />
              Launch ORBIT
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <span className="text-[11px] text-slate-600 font-mono">
              Settings → ORBIT AI Copilot to add a key
            </span>
          </div>
        </div>
      </section>

      {/* ================= IMPACT ================= */}
      <section className="sg-panel p-8 sm:p-12 space-y-14">
        <div data-reveal className="max-w-2xl space-y-4">
          <span className="sg-chip !border-rose-500/30 !bg-rose-950/50 !text-rose-200">Why it matters</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans leading-tight">
            When the Sun misbehaves, this is what breaks
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Solar disturbances are not abstract. They reach the ground as induced currents,
            refracted navigation signals, atmospheric drag and radio blackouts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HAZARDS.map((h, i) => {
            const Icon = h.icon;
            return (
              <div
                key={h.title}
                data-reveal="up"
                style={{ '--reveal-delay': `${(i % 2) * 100}ms` }}
                className="sg-row sg-row-lift group flex gap-4 p-5"
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${h.tint} transition-transform duration-300 group-hover:-translate-y-0.5`} />
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{h.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= PIPELINE ================= */}
      <section className="sg-panel p-8 sm:p-12 space-y-14">
        <div data-reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <span className="sg-chip !border-amber-500/30 !bg-amber-950/50 !text-amber-200">Under the hood</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans leading-tight">
              From NASA sensor to SQLite in four steps
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              A Scala 3 engine fans out across nine endpoints, reduces each feed with
              dedicated algorithms, persists idempotently, and hands the result to the charts.
            </p>
          </div>
          <button
            onClick={() => setCurrentView('docs')}
            className="group shrink-0 text-sm font-semibold text-cyan-300 sg-underline hover:text-cyan-200 transition-colors flex items-center gap-2 self-start"
          >
            Inspect 9 Algorithms
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>

        {/* Numbered steps as translucent rows */}
        <ol className="space-y-2.5">
          {PIPELINE.map((s, i) => (
            <li
              key={s.n}
              data-reveal="left"
              style={{ '--reveal-delay': `${i * 90}ms` }}
              className="sg-row group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 py-5 px-5 sm:px-6"
            >
              <span className="font-mono text-xs text-slate-500 group-hover:text-cyan-400 transition-colors sm:w-10 sm:shrink-0">
                {s.n}
              </span>
              <h3 className={`text-lg font-bold sm:w-52 sm:shrink-0 ${s.tint}`}>{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ================= CHARTS ================= */}
      <section className="sg-panel p-8 sm:p-12 space-y-14">
        <div data-reveal className="max-w-2xl space-y-4">
          <span className="sg-chip">Visualisation</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans leading-tight">
            Fifteen-plus charts, six palettes
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Every chart is palette-aware and reactive — change the theme in Settings and the
            whole suite follows, including the bubble scatter and the stage-flow Sankey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CHARTS.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                data-reveal="up"
                style={{ '--reveal-delay': `${i * 90}ms` }}
                className="sg-row sg-row-lift group p-5 space-y-3"
              >
                <Icon className={`w-5 h-5 ${c.tint} transition-transform duration-300 group-hover:scale-110`} />
                <h3 className="sg-underline text-base font-bold text-white inline-block">{c.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= NOAA SCALES ================= */}
      <section className="sg-panel p-8 sm:p-12 space-y-14">
        <div data-reveal className="max-w-2xl space-y-4">
          <span className="sg-chip !border-amber-500/30 !bg-amber-950/50 !text-amber-200">Classification</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-sans leading-tight">
            The official NOAA scales
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            SpaceGuard derives the G-scale strictly from Kp — flare class and CME speed are
            separate R and eruption metrics and never move the geomagnetic rating.
          </p>
        </div>

        <div className="space-y-3">
          {SCALES.map((sc, i) => (
            <div
              key={sc.tag}
              data-reveal="up"
              style={{ '--reveal-delay': `${i * 80}ms` }}
              className="sg-row group p-5 sm:p-6 space-y-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <span className={`text-4xl sm:text-5xl font-extrabold font-mono ${sc.tint}`}>{sc.tag}</span>
                <span className="text-lg font-bold text-white">{sc.title}</span>
                <span className="text-sm font-mono text-slate-500">{sc.range}</span>
              </div>
              {/* Intensity ramp — 1→5, widening and brightening */}
              <div className="flex items-center gap-1.5 h-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`h-full rounded-full bg-gradient-to-r ${sc.bar} transition-all duration-500 group-hover:opacity-100`}
                    style={{ width: `${10 + n * 9}%`, opacity: 0.35 + n * 0.13 }}
                  />
                ))}
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{sc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="sg-panel sg-panel-glow overflow-hidden p-8 sm:p-16 text-center">
        <div className="sg-aurora bg-gradient-to-t from-cyan-500/20 via-violet-500/10 to-transparent" />
        <div className="relative max-w-3xl mx-auto space-y-7">
          <Rocket className="sg-float w-9 h-9 mx-auto text-cyan-400" />
          <h2 data-reveal className="text-3xl sm:text-5xl font-extrabold text-white font-sans leading-tight">
            Watch the Sun. <span className="sg-gradient-text">Know what's coming.</span>
          </h2>
          <p data-reveal style={{ '--reveal-delay': '100ms' }} className="text-slate-400 text-base leading-relaxed max-w-xl mx-auto">
            Point SpaceGuard at any date range and it will pull nine feeds, cache them, and
            hand you the story of what the Sun did.
          </p>
          <div data-reveal style={{ '--reveal-delay': '180ms' }} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="group w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:gap-3.5 hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.7)]"
            >
              <Database className="w-4 h-4" />
              Open the Dashboard
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setCurrentView('mission-control')}
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-slate-700 text-slate-300 font-semibold text-sm hover:border-cyan-500/60 hover:text-white transition-colors duration-300"
            >
              Mission Control
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
