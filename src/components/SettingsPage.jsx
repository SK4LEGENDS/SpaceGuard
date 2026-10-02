import React, { useState, useEffect } from 'react';
import { Key, Sliders, HardDrive, Check, Save, Globe, Database, Trash2, ShieldAlert, Bot, Sparkles, ExternalLink, Palette, Eye, Moon, SunMedium, Bell, Clock, Layout, Zap, Type, Gauge, Layers, Radio, Orbit, Wind, Magnet, Waves, Satellite, Activity, Compass } from 'lucide-react';
import { exportSQLiteBinary, clearSQLiteCache } from '../services/sqliteService';

const PREFS_KEY = 'sg_prefs';
const DEFAULT_PREFS = {
  defaultRange: '30',
  defaultTab: 'geomagnetic',
  tableRowsDefault: '5',
  alertSensitivity: 'standard',
  exportFormat: 'json',
  theme: 'dark', // dark | void | nebula | ocean | ember | aurora | dim
  galaxyEnabled: true,
  galaxyIntensity: 70,
  reduceMotion: false,
  fontScale: '100', // 90|100|110
  chartPalette: 'standard', // standard | ocean | ember | aurora | colorblind | monochrome
  timezone: 'UTC',
  autoRefresh: 'off', // off | 15m | 60m
  phenomenaVisibility: { geomagnetic: true, sep: true, rbe: true, 'cme-earth': true, flare: true, hss: true, ips: true, mpc: true }
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    // migrate old 'light' theme (removed) → 'dark'
    if (parsed.theme === 'light') parsed.theme = 'dark';
    return { ...DEFAULT_PREFS, ...parsed, phenomenaVisibility: { ...DEFAULT_PREFS.phenomenaVisibility, ...(parsed.phenomenaVisibility||{}) } };
  } catch { return DEFAULT_PREFS; }
}

export default function SettingsPage({
  apiKey,
  setApiKey,
  openRouterApiKey,
  setOpenRouterApiKey,
}) {
  // NASA DONKI API Key State
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  // OpenRouter AI Key State (ORBIT)
  const [inputOpenRouterKey, setInputOpenRouterKey] = useState(openRouterApiKey || '');
  const [openRouterSaved, setOpenRouterSaved] = useState(false);

  useEffect(() => { setInputKey(apiKey || ''); }, [apiKey]);
  useEffect(() => { setInputOpenRouterKey(openRouterApiKey || ''); }, [openRouterApiKey]);

  // General / UI / Alert Preferences — persisted frontend-only, no backend touch
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Hydrate side-effects on mount (theme, galaxy, font, motion)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', prefs.theme);
    document.documentElement.setAttribute('data-reduce-motion', prefs.reduceMotion ? '1' : '0');
    document.documentElement.style.setProperty('--sg-font-scale', `${prefs.fontScale}%`);
    document.documentElement.style.setProperty('--sg-galaxy-intensity', `${prefs.galaxyIntensity}%`);
    document.documentElement.style.setProperty('--sg-galaxy-enabled', prefs.galaxyEnabled ? '1' : '0');
  }, [prefs.theme, prefs.reduceMotion, prefs.fontScale, prefs.galaxyIntensity, prefs.galaxyEnabled]);

  const updatePrefs = (patch) => {
    setPrefs(prev => {
      const next = { ...prev, ...patch, phenomenaVisibility: { ...prev.phenomenaVisibility, ...(patch.phenomenaVisibility||{}) } };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 1800);
      return next;
    });
  };

  const handleReset = () => {
    localStorage.removeItem(PREFS_KEY);
    setPrefs(DEFAULT_PREFS);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();
    setApiKey(cleanKey);
    localStorage.setItem('nasa_donki_api_key', cleanKey);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearApiKey = () => {
    setInputKey('');
    setApiKey('');
    localStorage.removeItem('nasa_donki_api_key');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveOpenRouter = (e) => {
    e.preventDefault();
    const cleanKey = inputOpenRouterKey.trim();
    setOpenRouterApiKey(cleanKey);
    localStorage.setItem('openrouter_api_key', cleanKey);
    setOpenRouterSaved(true);
    setTimeout(() => setOpenRouterSaved(false), 3000);
  };

  const handleClearOpenRouter = () => {
    setInputOpenRouterKey('');
    setOpenRouterApiKey('');
    localStorage.removeItem('openrouter_api_key');
    setOpenRouterSaved(true);
    setTimeout(() => setOpenRouterSaved(false), 3000);
  };

  const handleClearCache = async () => {
    await clearSQLiteCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="space-y-8 py-6 text-slate-100">
      
      {/* Title */}
      <div className="clean-card p-8 space-y-2 bg-slate-900/80 border border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 text-xs font-semibold">
          <Sliders className="w-3.5 h-3.5" />
          SYSTEM PREFERENCES & CONFIGURATION
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
          Platform Settings
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Frontend-only preferences — stored in <code className="text-cyan-300 font-mono">localStorage sg_prefs</code> — no backend change. Manage NASA / ORBIT keys, appearance, alerts, and data display.
        </p>
        {prefsSaved && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 text-xs font-medium">
            <Check className="w-3.5 h-3.5" /> Preferences saved — applied instantly
          </div>
        )}
      </div>

      <div className="space-y-8">
        {/* Full-width stacked cards — no narrow sidebar, fills space */}
        <div className="space-y-8">
          
          {/* Card 1: OpenRouter AI Key Integration */}
          <div className="clean-card p-6 space-y-6 bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
                    ORBIT AI Copilot
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                      LLM Chat
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Connect any LLM to power the ORBIT Telemetry Chatbot</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                openRouterApiKey
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {openRouterApiKey ? 'OPENROUTER CONNECTED' : 'LOCAL ENGINE ONLY'}
              </span>
            </div>

            <form onSubmit={handleSaveOpenRouter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputOpenRouterKey}
                    onChange={(e) => setInputOpenRouterKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:bg-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>Get your API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium inline-flex items-center gap-1">openrouter.ai/keys <ExternalLink className="w-3 h-3 inline" /></a></span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="p-2 rounded-lg bg-cyan-900/40 text-cyan-400 border border-cyan-700/40">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">ORBIT Router <span className="text-cyan-400 font-mono">(free)</span></p>
                  <p className="text-[10px] text-slate-400">openrouter/free → auto picks best free model (Gemma / Llama / GPT-OSS)</p>
                </div>
                <span className="ml-auto text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">openrouter/free</span>
              </div>

              {openRouterSaved && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  OpenRouter API Key saved successfully!
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save API Key
                </button>

                {openRouterApiKey && (
                  <button
                    type="button"
                    onClick={handleClearOpenRouter}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    Disconnect Key
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Card 2: NASA API Credentials Settings */}
          <div className="clean-card p-6 space-y-6 bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-sans">NASA DONKI API Credentials</h2>
                  <p className="text-xs text-slate-400">Configure your personal NASA Open Gateway key</p>
                </div>
              </div>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                apiKey
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {apiKey ? 'API KEY CONFIGURED' : 'NO KEY CONFIGURED'}
              </span>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  NASA API Key
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="Enter your personal NASA API Key"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 focus:bg-slate-900"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Request a free, high-rate-limit key at <a href="https://api.nasa.gov" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium">api.nasa.gov</a>.
                </p>
              </div>

              {savedSuccess && (
                <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  API Key settings updated successfully!
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Save NASA Key
                </button>

                {apiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Card 3: General — now wired, 8 tabs, no backend touch */}
          <div className="clean-card p-6 space-y-6 bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-700/50">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-sans">Dashboard & Display Preferences</h2>
                <p className="text-xs text-slate-400">Frontend-only — persisted in localStorage, instantly applied</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
              
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Clock className="w-3.5 h-3.5 text-cyan-400" /> Default Query Date Window</label>
                <select
                  value={prefs.defaultRange}
                  onChange={(e) => updatePrefs({ defaultRange: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="7">Past 7 Days</option>
                  <option value="30">Past 30 Days (Default)</option>
                  <option value="60">Past 60 Days</option>
                  <option value="90">Past 90 Days</option>
                </select>
                <p className="text-[10px] text-slate-500">Applied on next Dashboard load</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Layers className="w-3.5 h-3.5 text-cyan-400" /> Default Table Rows</label>
                <select
                  value={prefs.tableRowsDefault}
                  onChange={(e) => updatePrefs({ tableRowsDefault: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="5">5 rows per page</option>
                  <option value="10">10 rows per page</option>
                  <option value="25">25 rows per page</option>
                  <option value="all">All rows</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Orbit className="w-3.5 h-3.5 text-teal-400" /> Initial Dashboard Tab</label>
                <select
                  value={prefs.defaultTab}
                  onChange={(e) => updatePrefs({ defaultTab: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="geomagnetic">🌍 Geomagnetic Storm</option>
                  <option value="sep">☢️ SEP / Radiation</option>
                  <option value="rbe">🛰️ RBE Belt</option>
                  <option value="cme-earth">☄️ CME Earth-Directed</option>
                  <option value="flare">⚡ Solar Flare</option>
                  <option value="hss">💨 HSS Stream</option>
                  <option value="ips">🌊 IPS Shock</option>
                  <option value="mpc">🧲 MPC Crossing</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Layout className="w-3.5 h-3.5 text-purple-400" /> Startup View</label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs font-medium">
                  Always starts on the Overview Landing page
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Globe className="w-3.5 h-3.5 text-sky-400" /> Timezone</label>
                <select
                  value={prefs.timezone}
                  onChange={(e) => updatePrefs({ timezone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="UTC">UTC (DONKI native)</option>
                  <option value="Local">Local Browser Time</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Clock className="w-3.5 h-3.5 text-amber-400" /> Auto-refresh</label>
                <select
                  value={prefs.autoRefresh}
                  onChange={(e) => updatePrefs({ autoRefresh: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="off">Off (manual)</option>
                  <option value="15m">Every 15 min</option>
                  <option value="60m">Every 60 min</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Threat Alert Sensitivity</label>
                <select
                  value={prefs.alertSensitivity}
                  onChange={(e) => updatePrefs({ alertSensitivity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="standard">Standard NOAA G-Scale (Default)</option>
                  <option value="high">High Sensitivity (Early Warning)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><HardDrive className="w-3.5 h-3.5 text-slate-300" /> Data Export Format</label>
                <select
                  value={prefs.exportFormat}
                  onChange={(e) => updatePrefs({ exportFormat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
                >
                  <option value="json">JSON (structured)</option>
                  <option value="csv">CSV (spreadsheet)</option>
                </select>
              </div>

            </div>
          </div>

          {/* Card 4: Appearance & Galaxy — NEW, frontend only */}
          <div className="clean-card p-6 space-y-6 bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-2xl bg-purple-950/80 text-purple-400 border border-purple-700/50">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-sans">Appearance & Galaxy</h2>
                <p className="text-xs text-slate-400">Theme, background intensity, motion, font scale, chart palette</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Moon className="w-3.5 h-3.5 text-slate-400" /> Space Theme — UI + Background</label>
                <select value={prefs.theme} onChange={(e)=>{
                  const t=e.target.value;
                  const map={dark:'standard',dim:'standard',void:'monochrome',nebula:'aurora',ocean:'ocean',ember:'ember',aurora:'aurora'};
                  const cur=prefs.chartPalette;
                  // keep colorblind manual choice, otherwise auto-match palette to theme for UI+graph harmony
                  const auto = map[t] || 'standard';
                  const nextPalette = cur==='colorblind' ? cur : auto;
                  updatePrefs({theme:t, chartPalette: nextPalette});
                }} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400">
                  <option value="dark">Dark Cosmic — default (purple/pink/blue)</option>
                  <option value="void">Void Black — minimal, true black</option>
                  <option value="nebula">Nebula Deep — intense violet/pink</option>
                  <option value="ocean">Abyss Ocean — teal / cyan depth</option>
                  <option value="ember">Ember Solar — amber / red flare</option>
                  <option value="aurora">Aurora Polar — green / violet</option>
                  <option value="dim">Dim — reduced glow (low power)</option>
                </select>
                <p className="text-[10px] text-slate-500">Changes <code className="text-cyan-300 font-mono">body</code>, <code className="text-cyan-300 font-mono">clean-card</code>, header, live galaxy + <span className="text-cyan-300">auto-matches Chart Palette</span> (unless Colorblind)</p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Type className="w-3.5 h-3.5 text-slate-400" /> Font Scale</label>
                <select value={prefs.fontScale} onChange={(e)=>updatePrefs({fontScale:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400">
                  <option value="90">90% Compact</option>
                  <option value="100">100% Standard</option>
                  <option value="110">110% Large</option>
                </select>
                <p className="text-[10px] text-slate-500">Applies via <code className="text-cyan-300 font-mono">--sg-font-scale</code></p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Palette className="w-3.5 h-3.5 text-cyan-400" /> Chart Palette
                  {(()=>{ const m={dark:'standard',dim:'standard',void:'monochrome',nebula:'aurora',ocean:'ocean',ember:'ember',aurora:'aurora'}; const auto=m[prefs.theme]; const isAuto=auto===prefs.chartPalette; return isAuto ? <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-700/40">Auto-matched to theme</span> : <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Manual</span>; })()}
                </label>
                <select value={prefs.chartPalette} onChange={(e)=>updatePrefs({chartPalette:e.target.value})} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-400">
                  <option value="standard">Standard — teal / rose / amber</option>
                  <option value="ocean">Ocean — blue / cyan / indigo</option>
                  <option value="ember">Ember — amber / orange / red</option>
                  <option value="aurora">Aurora — purple / violet / pink</option>
                  <option value="colorblind">Colorblind-safe — blue / amber / grey</option>
                  <option value="monochrome">Monochrome — slate greys</option>
                </select>
                <div className="flex gap-1 pt-1">
                  {(
                    prefs.chartPalette === 'ocean' ? ['#0ea5e9','#06b6d4','#6366f1'] :
                    prefs.chartPalette === 'ember' ? ['#f59e0b','#ef4444','#f97316'] :
                    prefs.chartPalette === 'aurora' ? ['#8b5cf6','#d946ef','#ec4899'] :
                    prefs.chartPalette === 'colorblind' ? ['#0072B2','#E69F00','#999999'] :
                    prefs.chartPalette === 'monochrome' ? ['#475569','#64748b','#94a3b8'] :
                    ['#0d9488','#f43f5e','#f59e0b']
                  ).map((c,i)=>(<span key={i} className="w-6 h-2 rounded-full border border-white/20" style={{background:c}} />))}
                  <span className="text-[10px] text-slate-500 ml-1">live preview</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Gauge className="w-3.5 h-3.5 text-cyan-400" /> Galaxy Intensity</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={prefs.galaxyIntensity} onChange={(e)=>updatePrefs({galaxyIntensity: parseInt(e.target.value)})} className="flex-1 accent-cyan-500" />
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300 w-12 text-center">{prefs.galaxyIntensity}%</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input type="checkbox" checked={prefs.galaxyEnabled} onChange={(e)=>updatePrefs({galaxyEnabled:e.target.checked})} className="accent-cyan-500" />
                  <span className="text-slate-400">Enable galaxy particles</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={prefs.reduceMotion} onChange={(e)=>updatePrefs({reduceMotion:e.target.checked})} className="accent-cyan-500" />
                  <span className="text-slate-400">Reduce motion / animations</span>
                </label>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="flex items-center gap-2 font-semibold text-slate-300"><Layers className="w-3.5 h-3.5 text-purple-400" /> Visible Phenomena (8)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ['geomagnetic','🌍 Geomag'],['sep','☢️ SEP'],['rbe','🛰️ RBE'],['cme-earth','☄️ CME Earth'],
                    ['flare','⚡ Flare'],['hss','💨 HSS'],['ips','🌊 IPS'],['mpc','🧲 MPC']
                  ].map(([key,label])=>(
                    <label key={key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer ${prefs.phenomenaVisibility[key]?'bg-cyan-950/60 text-cyan-300 border-cyan-700/60':'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      <input type="checkbox" checked={!!prefs.phenomenaVisibility[key]} onChange={(e)=>updatePrefs({phenomenaVisibility:{...prefs.phenomenaVisibility,[key]:e.target.checked}})} className="accent-cyan-500" />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">Hides pills & skips API fetches when off — saves quota (frontend only).</p>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom row: SQLite & Reset — now 3 equal columns filling full width (was narrow right sidebar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SQLite Cache Management — now equal-width column */}
          <div className="clean-card p-6 space-y-4 bg-slate-900/80 border border-slate-800 flex flex-col">
            <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              SQLite Caching Engine
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-sans flex-1">
              Repeat queries for identical date ranges retrieve records directly from the local SQLite database to prevent redundant API calls.
            </p>

            {cacheCleared && (
              <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400" />
                SQLite cache cleared successfully.
              </div>
            )}

            <button
              onClick={handleClearCache}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Clear SQLite Cache
            </button>
          </div>

          {/* SQLite Download — equal column */}
          <div className="clean-card p-6 space-y-4 bg-slate-900/80 border border-slate-800 flex flex-col">
            <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              Export SQLite Database
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-sans flex-1">
              Download the entire binary SQLite database file (<code className="font-mono text-cyan-400">spaceguard.db</code>).
            </p>

            <button
              onClick={exportSQLiteBinary}
              className="w-full py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <HardDrive className="w-4 h-4" />
              Download spaceguard.db
            </button>
          </div>

          {/* Reset — equal column */}
          <div className="clean-card p-6 space-y-4 bg-slate-900/80 border border-slate-800 flex flex-col">
            <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-400" />
              Reset Preferences
            </h3>
            <p className="text-xs text-slate-400 flex-1">Clears <code className="font-mono text-slate-300">sg_prefs</code> and restores defaults. Does not touch API keys or DB.</p>
            <button onClick={handleReset} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-700/60 font-semibold text-xs flex items-center justify-center gap-2 transition-all">
              <Trash2 className="w-4 h-4" /> Reset to defaults
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
