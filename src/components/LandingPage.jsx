import React from 'react';
import { 
  Rocket, Zap, Activity, ShieldAlert, Cpu, ArrowRight, Sun, Bot,
  Compass, Radio, Database, Globe, Server, BarChart3, LineChart, PieChart, Sparkles,
  Satellite, AlertTriangle, ShieldCheck, Eye, Terminal, Layers, WifiOff, Plane, Navigation, BatteryCharging, Wind, Magnet, Orbit
} from 'lucide-react';

export default function LandingPage({ setCurrentView }) {
  return (
    <div className="space-y-16 py-8 text-slate-100">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-6 lg:px-12 rounded-3xl clean-card bg-slate-900/80 border border-slate-800 shadow-2xl">
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold shadow-inner">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            NASA DONKI Telemetry & Space Weather Engine
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-sans leading-tight">
            Space Weather Intelligence & <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Solar Telemetry Dashboard
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Real-time intelligence — <strong className="text-white">9 DONKI feeds → 8 phenomena</strong> via NASA GSFC + CCMC Kauai, <strong className="text-white">Scala 3 9-way parallel</strong> engine (8 algorithms, 11-col CME), <strong className="text-white">ECharts 5 + live deep galaxy</strong> (purple/pink/blue, no image) and <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-700/60 text-xs font-bold align-middle"><Bot className="w-3 h-3" /> ORBIT AI — 9-table DB</span> <strong className="text-white">openrouter/free</strong> auto-router.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all"
            >
              <Database className="w-4 h-4" />
              Launch Main Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('docs')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              Engine Specs & Theory
            </button>
          </div>

          {/* Quick Stat Badges — 9 live DONKI feeds */}
          <div className="pt-8 border-t border-slate-800 grid grid-cols-3 sm:grid-cols-9 gap-2 text-xs text-left">
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 1</span>
              <span className="text-cyan-400 font-bold text-xs">CME</span>
              <span className="text-slate-400 text-[10px] block leading-none">Coronal Ejections</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 2</span>
              <span className="text-amber-400 font-bold text-xs">FLR</span>
              <span className="text-slate-400 text-[10px] block leading-none">Solar Flares</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 3</span>
              <span className="text-rose-400 font-bold text-xs">GST</span>
              <span className="text-slate-400 text-[10px] block leading-none">Geomagnetic Storms</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 4</span>
              <span className="text-purple-400 font-bold text-xs">SEP</span>
              <span className="text-slate-400 text-[10px] block leading-none">Energetic Particles</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 5</span>
              <span className="text-emerald-400 font-bold text-xs">IPS</span>
              <span className="text-slate-400 text-[10px] block leading-none">Interplanetary Shocks</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 6</span>
              <span className="text-indigo-400 font-bold text-xs">MPC</span>
              <span className="text-slate-400 text-[10px] block leading-none">Magnetopause</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 7</span>
              <span className="text-cyan-400 font-bold text-xs">RBE</span>
              <span className="text-slate-400 text-[10px] block leading-none">Radiation Belt</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/90">
              <span className="text-slate-500 text-[9px] uppercase font-bold block">FEED 8</span>
              <span className="text-sky-400 font-bold text-xs">HSS</span>
              <span className="text-slate-400 text-[10px] block leading-none">High-Speed Streams</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-cyan-700/40 bg-cyan-950/20">
              <span className="text-cyan-500 text-[9px] uppercase font-bold block">FEED 9</span>
              <span className="text-amber-400 font-bold text-xs">WSA</span>
              <span className="text-slate-400 text-[10px] block leading-none">ENLIL Forecasts</span>
            </div>
          </div>

        </div>
      </section>

      {/* ORBIT Special Mention — DB-aware 9-feed copilot */}
      <section className="clean-card p-8 sm:p-10 space-y-6 bg-gradient-to-br from-cyan-950/30 via-slate-900/80 to-indigo-950/30 border border-cyan-700/30 shadow-[0_0_50px_rgba(6,182,212,0.12)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-600/60 text-xs font-bold">
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            SPECIAL MENTION — ORBIT AI COPILOT
            <span className="px-2 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-700/40 font-mono text-[10px]">openrouter/free</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
            Meet <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">ORBIT</span> — Your 9-Feed DB-Aware Copilot
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Not just a chatbot — <strong className="text-white">ORBIT reads your live 9-feed window + persisted 10-table DB</strong> to answer <em>“how many in DB?”</em>, <em>“list fastest CME”</em>, <em>“WSA Earth arrivals?”</em> and explain any of the <strong className="text-white">8 phenomena</strong> with best-visualization guidance. Auto-routed via <code className="text-cyan-300 font-mono">openrouter/free</code> → Gemma/Llama/GPT-OSS fallbacks (700 tokens, Kp-only G-scale).
          </p>
        </div>
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-800/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/40 flex items-center justify-center"><Database className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold text-white">9-Table DB Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Live `data.*` + `sqliteCounts` — CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSA. Try “list 3 MPC” or “DB totals”.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-800/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-700/40 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold text-white">8 Phenomena Expert</h3>
            <p className="text-xs text-slate-400 leading-relaxed">What is RBE/HSS/MPC/WSA? Best viz per table — flux proxies, 2D direction scatter, WSA arrival timeline.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-800/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-700/40 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
            <h3 className="text-sm font-bold text-white">Resilient Router</h3>
            <p className="text-xs text-slate-400 leading-relaxed">`openrouter/free` auto-picks best free model; sequential fallbacks `gemma-4-26b → llama-3.2 → gpt-oss-20b` on 404.</p>
          </div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button onClick={() => setCurrentView('dashboard')} className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md">
            <Bot className="w-4 h-4" /> Launch ORBIT in Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-slate-500 font-mono">Settings → ORBIT AI Copilot to set key · No key = local engine</span>
        </div>
      </section>

      {/* Why Space Weather Matters Section */}
      <section className="clean-card p-8 sm:p-10 space-y-8 bg-slate-900/80 border border-slate-800">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 text-rose-300 border border-rose-800/60 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Planetary Impact & Terrestrial Hazards
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            Why Space Weather Intelligence is Critical
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Solar disturbances trigger severe geomagnetic, radiation, and ionospheric storms that directly impact modern technological infrastructure on Earth and in orbit.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Power Grid Transformers</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Geomagnetically Induced Currents (GICs) from extreme storms can saturate high-voltage transformer cores, causing blackouts and grid failure.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">GNSS & GPS Precision</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Ionospheric scintillations delay and refract L-band satellite signals, resulting in positioning errors for aviation, maritime, and defense navigation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/70 text-purple-400 border border-purple-800/60 flex items-center justify-center">
              <Satellite className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Satellite Orbital Drag</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Extreme UV and X-ray heating expands the upper thermosphere, dramatically increasing atmospheric drag on LEO satellites and space stations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-800/60 flex items-center justify-center">
              <WifiOff className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">HF Radio Communications</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Solar flares ionize the ionospheric D-layer, causing total High-Frequency (HF) radio blackouts across the sunlit side of the planet for hours.
            </p>
          </div>
        </div>
      </section>

      {/* 9 DONKI Feeds → 8 Phenomena Grid — latest */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-sans">
            9 DONKI Feeds → 8 Phenomena Monitored
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            SpaceGuard ingests 9 real-time feeds (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSA-ENLIL) from NASA GSFC + CCMC Kauai — mapped to 8 phenomena for dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="clean-card p-6 space-y-3 hover:border-cyan-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Coronal Mass Ejections (CME)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Billion-ton plasma at 300–3000+ km/s, 11-col (lat/lon, half-angle, linkedEvents, WSA arrival/GB) for 2D direction scatter & WSA timeline.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-amber-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <Sun className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Solar Flares (FLR)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              GOES X-ray bursts A/B/C/M/X — tuple-rank sort for intensity timeline & active-region bar.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-rose-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-800/60 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Geomagnetic Storms (GST)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Kp max-reduce (G0&lt;5→G5≥9 Kp-only) for Kp area chart + threat banner.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-purple-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-950/70 text-purple-400 border border-purple-800/60 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Solar Energetic Particles (SEP)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Relativistic protons + linked CME — flux proxy daily line & Flare→CME→SEP timing bar.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-cyan-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Interplanetary Shocks (IPS)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              L1 shocks (ACE/DSCOVR) — arrival timeline + before/after wind bar.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-indigo-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/70 text-indigo-400 border border-indigo-800/60 flex items-center justify-center">
              <Magnet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Magnetopause Crossings (MPC)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              SWMF model — eventTime + linkedEvents for MPC timeline & MPC+HSS+GST multi-line.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-cyan-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Radiation Belt Enhancements (RBE)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              GOES-P &gt;2 MeV electrons — daily RBE count as flux proxy + HSS/RBE/GST.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-sky-500/60 bg-slate-900/80 border border-slate-800 transition-all">
            <div className="w-10 h-10 rounded-xl bg-sky-950/70 text-sky-400 border border-sky-800/60 flex items-center justify-center">
              <Wind className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">High-Speed Streams (HSS)</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Coronal-hole wind 500–800 km/s — daily HSS speed vs time line.
            </p>
          </div>

          <div className="clean-card p-6 space-y-3 hover:border-amber-500/60 bg-slate-900/80 border border-slate-800 transition-all md:col-span-3 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <Orbit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">WSA-ENLIL Forecasts</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Cone inputs lat/lon/speed/halfAngle → arrival/Kp/rmin_re, flattened simulationID::cmeID for Earth-arrival timeline & 2D scatter.
            </p>
          </div>

        </div>
      </section>

      {/* Apache ECharts Visualization Section — 8 phenomena, 6 palettes, live galaxy */}
      <section className="clean-card p-8 sm:p-10 space-y-6 bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 text-xs font-semibold">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              ECharts Suite — 8 Phenomena • 15+ Charts • 6 Palettes
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              High-Performance Reactive Visualizations
            </h2>
            <p className="text-xs text-slate-400">CME speed/direction scatter • FLR rank • Kp area • daily timelines (SEP/RBE/HSS/MPC/IPS) • WSA arrival • multi-source lines — all palette-aware</p>
          </div>
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            View Live Charts
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CME Velocity + 2D Direction</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              11-col CME (lat/lon/GB) — speed bar + lat vs lon scatter (bubble=halfAngle, color=speed) + WSA arrival timeline, all 6 palettes.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">FLR & RBE/HSS Timelines</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              GOES donut + rank timeline for flares; daily count proxies for SEP (particle flux) / RBE (electron flux) / HSS (wind speed).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="w-9 h-9 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-800/60 flex items-center justify-center">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Kp + Multi-Source Timelines</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Kp area with G1/G3/G5 marks + geomagnetic 5-line (CME+IPS+HSS+MPC+GST) + HSS/RBE/GST & MPC/HSS/GST multi-lines.
            </p>
          </div>
        </div>
      </section>

      {/* NOAA Space Weather Scales Overview */}
      <section className="clean-card p-8 sm:p-10 space-y-6 bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Official NOAA Space Weather Scales</h2>
            <p className="text-xs text-slate-400">Standardized hazard classifications for space environment disturbances</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
              G-Scale (G1 to G5)
            </span>
            <h4 className="text-sm font-bold text-white">Geomagnetic Storms</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Driven by CME plasma impact. Ranges from G1 (Minor: weak power grid fluctuations) to G5 (Extreme: complete transformer collapse and aurora seen at equator).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
              R-Scale (R1 to R5)
            </span>
            <h4 className="text-sm font-bold text-white">Radio Blackouts</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Driven by X-ray solar flares. Ranges from R1 (Minor: degraded HF comms) to R5 (Extreme: complete HF blackout across entire sunlit hemisphere).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
              S-Scale (S1 to S5)
            </span>
            <h4 className="text-sm font-bold text-white">Solar Radiation Storms</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Driven by high-energy SEP protons. Ranges from S1 (Minor: minor satellite noise) to S5 (Extreme: unavoidable radiation hazard for astronauts and polar flights).
            </p>
          </div>
        </div>
      </section>

      {/* Scala Engine Pipeline — 9 feeds, 8 algorithms, live galaxy, ORBIT */}
      <section className="clean-card p-8 sm:p-10 space-y-6 bg-slate-900/80 border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              Scala 3 Data Pipeline — 9 feeds • 8 algorithms
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Powered by Scala 3 Engine (<code className="text-cyan-400 font-mono text-lg">V9.scala</code>) + ORBIT
            </h2>
            <p className="text-xs text-slate-400 mt-1">9-way Future fan-out, 11-col CME (lat/lon/GB), WSA flattened <code className="text-cyan-300 font-mono">simulationID::cmeID</code>, 10-table SQLite, daily binning & theming</p>
          </div>
          <button
            onClick={() => setCurrentView('docs')}
            className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-teal-900 text-cyan-300 border border-cyan-700/60 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            Inspect 8 Algorithms
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400">1. NASA 9 DONKI</span>
            <p className="text-slate-400 text-[11px]">CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSA-ENLIL — 120s parallel.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">2. Scala 8 Algorithms</span>
            <p className="text-slate-400 text-[11px]">Future fan-out, lat/lon, GOES tuple, Kp max, stats, 9-table persist, binning, theming.</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400">3. SQLite 9 Tables</span>
            <p className="text-slate-400 text-[11px]">11-col CME, flattened WSA, linked_events JSON, INSERT OR IGNORE.</p>
          </div>
          <div className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-800/60 space-y-1">
            <span className="font-bold text-cyan-300">4. ECharts + Galaxy + ORBIT</span>
            <p className="text-slate-400 text-[11px]">15+ charts • 6 palettes • live deep galaxy • ORBIT 9-table DB.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
