import React from 'react';
import { Rocket, ShieldCheck, Terminal, ExternalLink, Cpu, Settings, BookOpen } from 'lucide-react';

export default function Footer({ setCurrentView }) {
  return (
    <footer className="bg-[#070d1e]/85 backdrop-blur-xl border-t border-slate-800 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand — keep */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-700/50">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Space<span className="text-cyan-400">Guard</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-700/50">v3.9</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              NASA DONKI live telemetry — 9 feeds, 8 phenomena, deep-purple galaxy canvas. No static image.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-full border border-cyan-800/60 w-fit">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              9-Feed Parallel Engine
            </div>
          </div>

          {/* Highlights — stable, not phenomena (user can toggle phenomena) */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Highlights</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500/70"></span>Live 9-feed DONKI ingestion (120s parallel)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500/70"></span>SQLite WASM offline cache — 9 tables</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500/70"></span>Interactive ECharts + deep galaxy canvas</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></span>ORBIT AI — openrouter/free (auto)</li>
            </ul>
          </div>

          {/* Stack — current, not legacy 4 */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Platform Stack</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-cyan-400" /><span>Scala 3.3 + Future (9 parallel)</span></li>
              <li className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-cyan-400" /><span>React 18 + Vite 5 + ECharts 5</span></li>
              <li className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-cyan-400" /><span>sql.js WASM — 9 tables + cache</span></li>
              <li className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-cyan-400" /><span>ORBIT openrouter/free (auto)</span></li>
            </ul>
          </div>

          {/* Navigate — only keep useful */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Navigate</h4>
            <div className="space-y-2 text-xs">
              <button onClick={() => setCurrentView('dashboard')} className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all">
                <span>Dashboard — 8 Phenomena</span><ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCurrentView('docs')} className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all">
                  <BookOpen className="w-3.5 h-3.5" /> Docs
                </button>
                <button onClick={() => setCurrentView('settings')} className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all">
                  <Settings className="w-3.5 h-3.5" /> Settings
                </button>
              </div>
              <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer" className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all">
                <span>NASA DONKI</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom — keep */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SpaceGuard — <strong className="text-slate-300">Kailash & SriViknesh</strong> · NASA GSFC DONKI · Deep galaxy canvas (no image)</p>
          <span className="flex items-center gap-1.5 text-cyan-400 font-medium"><ShieldCheck className="w-4 h-4" /> Telemetry Verified</span>
        </div>
      </div>
    </footer>
  );
}
