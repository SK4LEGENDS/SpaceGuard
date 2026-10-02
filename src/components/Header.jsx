import React from 'react';
import { Rocket, Database, FileText, Sliders, Radar, GitBranch } from 'lucide-react';

export default function Header({ currentView, setCurrentView }) {
  return (
    <header className="sticky top-0 z-50 bg-[#070d1e]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div 
            onClick={() => setCurrentView('landing')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 group-hover:from-blue-500 group-hover:to-cyan-400 transition-all duration-200">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                  Space<span className="text-cyan-400">Guard</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-700/60">
                  v4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">NASA DONKI Telemetry Platform</p>
            </div>
          </div>

          {/* Navigation Items (Overview, Dashboard, Specs, Settings) */}
          <nav className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-full border border-slate-800">
            <button
              onClick={() => setCurrentView('landing')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'landing'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Rocket className="w-4 h-4" />
              Overview
            </button>

            <button
              onClick={() => setCurrentView('mission-control')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'mission-control'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radar className="w-4 h-4" />
              Mission Control
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4" />
              Main Dashboard
            </button>

            <button
              onClick={() => setCurrentView('timeline')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'timeline'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Event Timeline
            </button>

            <button
              onClick={() => setCurrentView('docs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'docs'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              Engine Specs
            </button>

            <button
              onClick={() => setCurrentView('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                currentView === 'settings'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-slate-800 bg-[#070d1e]/95 px-4 py-2 flex justify-around text-xs">
        <button
          onClick={() => setCurrentView('landing')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'landing' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Rocket className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setCurrentView('mission-control')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'mission-control' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Radar className="w-4 h-4" />
          Mission
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'dashboard' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <Database className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setCurrentView('timeline')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'timeline' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <GitBranch className="w-4 h-4" />
          Timeline
        </button>
        <button
          onClick={() => setCurrentView('docs')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'docs' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <FileText className="w-4 h-4" />
          Docs
        </button>
        <button
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center gap-1 py-1 ${currentView === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <          Sliders className="w-4 h-4" />
          Settings
        </button>
      </div>
    </header>
  );
}
