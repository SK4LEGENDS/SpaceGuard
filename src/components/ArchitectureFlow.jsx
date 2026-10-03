import React, { useState } from 'react';
import { 
  Server, Database, Globe, Cpu, Bot, LineChart, 
  ArrowRight, Zap, Shield, Layers, Activity, 
  CheckCircle2, Search, MessageSquare, GitBranch 
} from 'lucide-react';

const FlowNode = ({ icon: Icon, label, sublabel, active, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30',
    purple: 'border-purple-500/50 text-purple-400 bg-purple-950/30',
    amber: 'border-amber-500/50 text-amber-400 bg-amber-950/30',
    emerald: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30',
    rose: 'border-rose-500/50 text-rose-400 bg-rose-950/30',
  };

  return (
    <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-500 ${active ? colorClasses[color] + ' scale-110 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-slate-800 text-slate-500 bg-slate-900/50'}`}>
      <div className={`p-3 rounded-xl mb-2 ${active ? 'bg-current text-slate-900' : 'bg-slate-800 text-slate-600'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-sm font-bold whitespace-nowrap">{label}</span>
      {sublabel && <span className="text-[10px] opacity-70 font-mono">{sublabel}</span>}
    </div>
  );
};

const FlowArrow = ({ active, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'bg-cyan-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="relative flex items-center justify-center w-12 h-1">
      <div className="w-full h-full bg-slate-800 rounded-full overflow-hidden">
        {active && (
          <div className={`absolute inset-0 ${colorClasses[color]} animate-flow-particle`} />
        )}
      </div>
      <ArrowRight className={`absolute -right-2 w-4 h-4 ${active ? 'text-current' : 'text-slate-800'}`} />
    </div>
  );
};

export default function ArchitectureFlow() {
  const [step, setStep] = useState(0);

  // Sequence of animations
  const sequences = [
    { name: 'Ingestion', nodes: [0, 1, 2], color: 'cyan' },
    { name: 'Reasoning', nodes: [3, 4, 5], color: 'purple' },
    { name: 'Visualization', nodes: [6, 7, 8], color: 'amber' },
  ];

  const totalSteps = 9;

  return (
    <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 font-sans text-slate-200">
      <style>{`
        @keyframes flow-particle {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-flow-particle {
          width: 30%;
          height: 100%;
          animation: flow-particle 1.5s infinite linear;
        }
      `}</style>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-2xl font-bold text-white">System Dynamic Flow</h2>
          <p className="text-sm text-slate-400">Animated sequence of data movement and reasoning</p>
        </div>
        <button 
          onClick={() => setStep((s) => (s + 1) % totalSteps)}
          className="px-6 py-2 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-cyan-900/20"
        >
          Next Phase →
        </button>
      </div>

      <div className="space-y-16">
        {/* PHASE 1: API INGESTION */}
        <div className="relative">
          <div className="absolute -top-6 left-0 text-[10px] font-bold uppercase tracking-widest text-cyan-500 opacity-50">Phase 01: NASA Data Ingestion</div>
          <div className="flex items-center justify-center gap-4">
            <FlowNode icon={Globe} label="NASA DONKI" sublabel="Public API" active={step === 0} color="cyan" />
            <FlowArrow active={step === 1} color="cyan" />
            <FlowNode icon={Server} label="Scala Engine" sublabel="Temporal Chunking" active={step === 1} color="cyan" />
            <FlowArrow active={step === 2} color="cyan" />
            <FlowNode icon={Database} label="SQLite JDBC" sublabel="Permanent Storage" active={step === 2} color="cyan" />
          </div>
        </div>

        {/* PHASE 2: ORBIT REASONING */}
        <div className="relative">
          <div className="absolute -top-6 left-0 text-[10px] font-bold uppercase tracking-widest text-purple-500 opacity-50">Phase 02: ORBIT AI Reasoning</div>
          <div className="flex items-center justify-center gap-4">
            <FlowNode icon={MessageSquare} label="User Query" sublabel="NLQ Input" active={step === 3} color="purple" />
            <FlowArrow active={step === 4} color="purple" />
            <FlowNode icon={Search} label="Intent Classifier" sublabel="Taxonomy Scoring" active={step === 4} color="purple" />
            <FlowArrow active={step === 5} color="purple" />
            <FlowNode icon={Bot} label="ORBIT Core" sublabel="Deterministic/LLM" active={step === 5} color="purple" />
          </div>
        </div>

        {/* PHASE 3: FRONTEND VISUALIZATION */}
        <div className="relative">
          <div className="absolute -top-6 left-0 text-[10px] font-bold uppercase tracking-widest text-amber-500 opacity-50">Phase 03: Observability Render</div>
          <div className="flex items-center justify-center gap-4">
            <FlowNode icon={Layers} label="sql.js WASM" sublabel="Browser RAM Mirror" active={step === 6} color="amber" />
            <FlowArrow active={step === 7} color="amber" />
            <FlowNode icon={Activity} label="React State" sublabel="Data Modeling" active={step === 7} color="amber" />
            <FlowArrow active={step === 8} color="amber" />
            <FlowNode icon={LineChart} label="Apache ECharts" sublabel="Visual Telemetry" active={step === 8} color="amber" />
          </div>
        </div>
      </div>

      <div className="mt-12 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-center">
        <p className="text-xs text-slate-400 font-mono">
          {step < 3 && "Current state: Ingesting raw telemetry from NASA servers into the permanent record..."}
          {step >= 3 && step < 6 && "Current state: Classifying user intent and executing deterministic data queries..."}
          {step >= 6 && "Current state: Mirroring binary data via WASM for instant visual rendering..."}
        </p>
      </div>
    </div>
  );
}
