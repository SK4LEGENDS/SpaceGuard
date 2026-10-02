import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  GitBranch, Link2, Layers, Play, Filter, Clock, Zap, Info, ArrowRight,
  Sun, Globe2, Wind, ShieldAlert, Activity, Target, Radar, Bot
} from 'lucide-react';
import {
  buildEventChains, buildMissionControlStatus, CHAIN_STAGES, parseTime
} from '../services/telemetryAnalysis';

const STAGE_ICON = { flare: Sun, cme: Globe2, wind: Wind, storm: ShieldAlert, radiation: Activity };
const STAGE_COLOR = Object.fromEntries(CHAIN_STAGES.map((s) => [s.key, s.color]));

const fmtTime = (t) => {
  const ms = parseTime(t);
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toISOString().slice(5, 16).replace('T', ' ');
};

const fmtDuration = (h) => {
  if (h == null || !Number.isFinite(h)) return '—';
  if (h < 24) return `${h.toFixed(1)} h`;
  return `${(h / 24).toFixed(1)} d`;
};

export default function EventTimelinePage({
  data,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  hasQueried,
  onQuery,
  onOpenMissionControl,
  isOrbitOpen = false,
  toggleOrbit
}) {
  const [selectedChainId, setSelectedChainId] = useState(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);

  const chains = useMemo(() => buildEventChains(data, startDate, endDate), [data, startDate, endDate]);
  const status = useMemo(() => buildMissionControlStatus(data, startDate, endDate), [data, startDate, endDate]);

  const visibleChains = useMemo(
    () =>
      chains.filter(
        (c) => (stageFilter === 'all' || c.stages.includes(stageFilter)) && c.confidence >= minConfidence
      ),
    [chains, stageFilter, minConfidence]
  );

  const selectedChain = useMemo(
    () => visibleChains.find((c) => c.id === selectedChainId) || visibleChains[0] || null,
    [visibleChains, selectedChainId]
  );

  const stageCounts = useMemo(() => {
    const counts = {};
    CHAIN_STAGES.forEach((s) => {
      counts[s.key] = chains.filter((c) => c.stages.includes(s.key)).length;
    });
    return counts;
  }, [chains]);

  /**
   * Sankey-style stage flow: how many chains progress through each stage,
   * plus how many drop off (to represent incomplete sequences).
   */
  const SANKAY_UNRESOLVED = 'Unresolved / No further data';
  const SANKAY_SHORT = {
    'Solar Flare': 'Solar Flare',
    'CME Eruption': 'CME Eruption',
    'Solar Wind Propagation': 'Solar Wind',
    'Geomagnetic Storm': 'Geomagnetic Storm',
    'Radiation Event': 'Radiation Event',
    [SANKAY_UNRESOLVED]: 'Unresolved'
  };

  const getSankeyOption = () => {
    const nodes = [];
    const links = [];
    // Nodes sit in separate depth columns, so a right-aligned label on every node
    // collides with the next node down the chain. Stagger them above/below instead.
    const labelFor = (i) => ({
      show: true,
      position: i % 2 === 0 ? 'top' : 'bottom',
      distance: 8,
      color: '#cbd5e1',
      fontSize: 10,
      width: 130,
      overflow: 'break'
    });

    CHAIN_STAGES.forEach((s, i) => nodes.push({
      name: s.label,
      itemStyle: { color: s.color },
      label: labelFor(i)
    }));
    nodes.push({
      name: SANKAY_UNRESOLVED,
      itemStyle: { color: '#475569' },
      label: labelFor(CHAIN_STAGES.length)
    });

    const counts = CHAIN_STAGES.map((s) => ({
      stage: s,
      total: chains.filter((c) => c.stages.includes(s.key)).length
    }));

    counts.forEach((c) => {
      if (!c.total) return;
      const idx = CHAIN_STAGES.findIndex((s) => s.key === c.stage.key);
      const next = counts[idx + 1];
      if (next && next.total) {
        links.push({ source: c.stage.label, target: next.stage.label, value: next.total });
        const drop = c.total - next.total;
        if (drop > 0) {
          links.push({ source: c.stage.label, target: SANKAY_UNRESOLVED, value: drop });
        }
      } else {
        links.push({ source: c.stage.label, target: SANKAY_UNRESOLVED, value: c.total });
      }
    });

    if (!links.length) return null;

    return {
      tooltip: { trigger: 'item', triggerOn: 'mousemove', formatter: (p) => (p.dataType === 'edge' ? `${p.data.source} → ${p.data.target}<br/><b>${p.data.value}</b> chains` : `${p.name}<br/>Click for chains`) },
      series: [{
        type: 'sankey',
        left: 10,
        right: 130,
        top: 34,
        bottom: 34,
        nodeWidth: 16,
        nodeGap: 12,
        emphasis: { focus: 'adjacency' },
        data: nodes,
        links,
        label: { show: true, formatter: (p) => SANKAY_SHORT[p.name] || p.name, color: '#e2e8f0', fontSize: 10 },
        labelLayout: { hideOverlap: false },
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 }
      }]
    };
  };

  /** Chronological scatter of every chain node on a shared time axis. */
  const getChronologyOption = () => {
    const minT = Math.min(...visibleChains.map((c) => parseTime(c.start)).filter(Number.isFinite));
    const maxT = Math.max(...visibleChains.map((c) => parseTime(c.end)).filter(Number.isFinite));
    if (!Number.isFinite(minT) || !Number.isFinite(maxT)) return null;

    const series = CHAIN_STAGES.map((stage) => {
      const points = [];
      visibleChains.forEach((c, ci) => {
        c.nodes
          .filter((n) => n.stage === stage.key)
          .forEach((n) => {
            const t = parseTime(n.time);
            if (!Number.isFinite(t)) return;
            points.push({
              value: [t, ci, Number(n.severity) || 1],
              chain: c,
              node: n,
              symbolSize: 9 + (Number(n.severity) || 1) * 2
            });
          });
      });
      return {
        name: stage.label,
        type: 'scatter',
        symbolSize: (val) => val[2] * 4 + 6,
        data: points,
        itemStyle: { color: stage.color, opacity: 0.85 },
        emphasis: { focus: 'series' }
      };
    });

    const isDark = true;
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p) =>
          `<div style="font-size:11px"><b style="color:${p.color}">${p.seriesName}</b><br/>${p.data.node.time}<br/><span style="color:#94a3b8">${p.data.node.detail}</span><br/><i>chain: ${p.data.chain.root}</i></div>`
      },
      legend: { top: 0, textStyle: { color: isDark ? '#94a3b8' : '#475569', fontSize: 10 }, itemGap: 10 },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'time',
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v) => new Date(v).toISOString().slice(5, 10) },
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: Math.max(1, visibleChains.length - 1),
        interval: 1,
        name: 'Chain #',
        nameTextStyle: { color: '#cbd5e1', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(51,65,85,0.25)' } }
      },
      series: series.filter((s) => s.data.length > 0)
    };
  };

  /** Per-chain stage progression (how far each chain travelled). */
  const getChainProgressOption = () => {
    if (!visibleChains.length) return null;
    const ordered = [...visibleChains].slice(0, 18);
    const data = ordered.map((c) => CHAIN_STAGES.reduce((acc, s) => acc + (c.stages.includes(s.key) ? 1 : 0), 0));
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (ps) => {
          const c = ordered[ps[0].dataIndex];
          return `<b>${c.root}</b><br/>${ps[0].value}/${CHAIN_STAGES.length} stages<br/><span style="color:#94a3b8">${c.stages.join(' → ')}</span>`;
        }
      },
      grid: { left: '4%', right: '8%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: { type: 'value', min: 1, max: CHAIN_STAGES.length, interval: 1, axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      yAxis: {
        type: 'category',
        data: ordered.map((c) => c.root),
        axisLabel: { color: '#cbd5e1', fontSize: 9, fontFamily: 'monospace' },
        axisLine: { lineStyle: { color: '#334155' } },
        inverse: true
      },
      series: [{
        type: 'bar',
        barWidth: '52%',
        data: data.map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: [0, 5, 5, 0],
            color: v >= 4 ? '#f43f5e' : v >= 3 ? '#f59e0b' : v >= 2 ? '#0ea5e9' : '#475569'
          }
        })),
        label: { show: true, position: 'right', color: '#94a3b8', fontSize: 10, formatter: '{c} stages' },
        markLine: {
          data: [{ xAxis: 4 }],
          lineStyle: { color: '#f43f5e', type: 'dashed', width: 1.5 },
          label: { formatter: 'full chain', color: '#f43f5e', fontSize: 9 }
        }
      }]
    };
  };

  const sankey = getSankeyOption();
  const chronology = getChronologyOption();
  const progress = getChainProgressOption();

  if (!hasQueried) {
    return (
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-violet-400" /> Event Relationship Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            How space-weather events connect: Solar Flare → CME → Solar Wind → Geomagnetic Storm.
          </p>
        </div>
        <div className="clean-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-3xl bg-violet-950/70 text-violet-400 border border-violet-800/60">
            <GitBranch className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">No Telemetry to Correlate</h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Query a date window first — causal chains are reconstructed from the ingested event feeds.
          </p>
          {onQuery && (
            <button onClick={() => onQuery(false)} className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Query {startDate} → {endDate}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-7 h-7 text-violet-400" /> Event Relationship Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            {chains.length} causal chains reconstructed from {status.totals.cmes} CMEs, {status.totals.flares} flares,
            {' '}{status.totals.storms} storms, {status.totals.seps} SEPs, {status.totals.ipss} shocks • {startDate} → {endDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500" />
          {onQuery && (
            <button onClick={() => onQuery(false)} className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
          {onOpenMissionControl && (
            <button onClick={onOpenMissionControl} className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-cyan-400" /> Mission Control
            </button>
          )}
          {toggleOrbit && (
            <button
              onClick={toggleOrbit}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isOrbitOpen
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:bg-slate-950'
              }`}
              title="Toggle ORBIT — data-aware space weather copilot"
            >
              <Bot className={`w-3.5 h-3.5 ${isOrbitOpen ? 'text-white' : 'text-cyan-400'}`} />
              <span>{isOrbitOpen ? 'Close ORBIT' : 'ORBIT'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage pipeline ribbon */}
      <div className="clean-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" /> Causal Pipeline
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            chains reaching each stage / {chains.length} total
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {CHAIN_STAGES.map((stage, i) => {
            const Icon = STAGE_ICON[stage.key];
            const active = stageFilter === stage.key;
            const count = stageCounts[stage.key] || 0;
            const pct = chains.length ? Math.round((count / chains.length) * 100) : 0;
            return (
              <React.Fragment key={stage.key}>
                <button
                  onClick={() => setStageFilter(active ? 'all' : stage.key)}
                  className={`flex-1 min-w-0 p-3 rounded-2xl border text-left transition-all ${
                    active ? 'bg-slate-800/80 border-violet-500/60 ring-2 ring-violet-500/20' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 rounded-lg" style={{ background: `${stage.color}20`, color: stage.color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] font-bold text-slate-200 truncate">{stage.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold" style={{ color: stage.color }}>{count}</span>
                    <span className="text-[10px] text-slate-500">chains • {pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: stage.color }} />
                  </div>
                </button>
                {i < CHAIN_STAGES.length - 1 && (
                  <div className="hidden sm:flex items-center justify-center px-0.5">
                    <ArrowRight className="w-4 h-4 text-slate-700" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="clean-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Stage</span>
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button onClick={() => setStageFilter('all')} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${stageFilter === 'all' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>All</button>
            {CHAIN_STAGES.map((s) => (
              <button key={s.key} onClick={() => setStageFilter(s.key)} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${stageFilter === s.key ? 'text-white' : 'text-slate-400 hover:text-white'}`} style={stageFilter === s.key ? { background: s.color } : undefined}>
                {s.short}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-semibold text-slate-300">Min confidence</span>
          <input type="range" min="0" max="0.95" step="0.05" value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} className="w-32 accent-violet-500" />
          <span className="text-[11px] font-mono text-slate-400 w-9">{Math.round(minConfidence * 100)}%</span>
        </div>
        <span className="text-[11px] text-slate-500 ml-auto">
          showing <strong className="text-slate-300">{visibleChains.length}</strong> of {chains.length} chains
        </span>
      </div>

      {chains.length === 0 ? (
        <div className="clean-card p-12 flex flex-col items-center justify-center text-center space-y-3">
          <GitBranch className="w-10 h-10 text-slate-600" />
          <h2 className="text-lg font-bold text-white">No multi-stage chains resolved</h2>
          <p className="text-sm text-slate-400 max-w-md">
            Chains need at least two causally-linked events. Try a wider date range, or check the
            Main Dashboard — individual events are still available there.
          </p>
        </div>
      ) : (
        <>
          {/* Sankey flow + chain progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-violet-400" /> Stage-to-Stage Flow
                  </h3>
                  <p className="text-[11px] text-slate-400">How many chains advance from each stage to the next</p>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-violet-950/70 text-violet-300 border border-violet-800/60 font-mono">Sankey</span>
              </div>
              {!sankey ? (
                <div className="h-72 flex items-center justify-center text-slate-400 text-xs">Not enough chain progression to plot.</div>
              ) : (
                <div className="h-72 w-full">
                  <ReactECharts option={sankey} style={{ height: '100%', width: '100%' }} />
                </div>
              )}
            </div>

            <div className="clean-card p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" /> Chain Completeness
                  </h3>
                  <p className="text-[11px] text-slate-400">Stages resolved per chain (top 18 by severity)</p>
                </div>
              </div>
              {!progress ? (
                <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No chains match the current filter.</div>
              ) : (
                <div className="h-72 w-full">
                  <ReactECharts option={progress} style={{ height: '100%', width: '100%' }} />
                </div>
              )}
            </div>
          </div>

          {/* Chronological relationship chart */}
          <div className="clean-card p-6 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Interactive Causal Chronology
                </h3>
                <p className="text-[11px] text-slate-400">
                  Each row is a chain; symbol position is the real event time — hover any point for details
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/60 font-mono">Time-Scatter</span>
            </div>
            {!chronology ? (
              <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No timed events to place on the axis.</div>
            ) : (
              <div className="h-96 w-full">
                <ReactECharts option={chronology} style={{ height: '100%', width: '100%' }} notMerge />
              </div>
            )}
          </div>

          {/* Chain explorer: list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="clean-card overflow-hidden lg:col-span-2">
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Causal Chains</h3>
                <span className="text-[10px] font-mono text-slate-500">{visibleChains.length}</span>
              </div>
              <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-800/70">
                {visibleChains.map((c) => {
                  const active = selectedChain && selectedChain.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChainId(c.id)}
                      className={`w-full text-left p-3.5 transition-colors ${active ? 'bg-violet-950/40 border-l-2 border-violet-400' : 'hover:bg-slate-900/60 border-l-2 border-transparent'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-cyan-300 truncate">{c.root}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${c.confidence >= 0.85 ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60' : c.confidence >= 0.6 ? 'bg-amber-950/70 text-amber-300 border-amber-700/60' : 'bg-slate-900/80 text-slate-400 border-slate-700/60'}`}>
                          {Math.round(c.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {c.stages.map((s) => (
                          <span key={s} className="w-2 h-2 rounded-full" style={{ background: STAGE_COLOR[s] }} title={CHAIN_STAGES.find((x) => x.key === s)?.label} />
                        ))}
                        <span className="text-[10px] text-slate-500 ml-1">
                          {c.stages.length} stage{c.stages.length > 1 ? 's' : ''} • {fmtDuration(c.durationHours)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="clean-card p-6 space-y-4 lg:col-span-3">
              {!selectedChain ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">Select a chain to inspect its causal sequence.</div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-violet-400" /> Chain {selectedChain.root}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{selectedChain.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Confidence</div>
                      <div className="text-lg font-extrabold text-emerald-400">{Math.round(selectedChain.confidence * 100)}%</div>
                    </div>
                  </div>

                  {/* Vertical stepper of the causal sequence */}
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-500/60 via-teal-500/60 to-rose-500/60" />
                    {selectedChain.nodes.map((n) => {
                      const stage = CHAIN_STAGES.find((s) => s.key === n.stage);
                      const Icon = STAGE_ICON[n.stage] || Zap;
                      return (
                        <div key={n.id} className="relative">
                          <span
                            className="absolute -left-6 top-0.5 w-[23px] h-[23px] rounded-full flex items-center justify-center border-2 border-slate-900"
                            style={{ background: `${stage?.color || '#64748b'}25` }}
                          >
                            <Icon className="w-3 h-3" style={{ color: stage?.color || '#94a3b8' }} />
                          </span>
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded" style={{ color: stage?.color, background: `${stage?.color}18` }}>
                                  {stage?.short}
                                </span>
                                <span className="text-xs font-bold text-slate-100">{n.label}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{fmtTime(n.time)}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explicit link confidence bars */}
                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="text-[11px] font-bold text-slate-300 mb-2">Link evidence</h4>
                    <div className="space-y-1.5">
                      {selectedChain.links.map((l, i) => {
                        const fromNode = selectedChain.nodes.find((n) => n.id === l.from);
                        const toNode = selectedChain.nodes.find((n) => n.id === l.to);
                        return (
                          <div key={i} className="flex items-center gap-2 text-[10px]">
                            <span className="font-mono text-slate-400 truncate w-32 shrink-0">{fromNode?.label || l.from}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round(l.confidence * 100)}%` }} />
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                            <span className="font-mono text-slate-400 truncate w-32 shrink-0">{toNode?.label || l.to}</span>
                            <span className="font-mono font-bold text-emerald-400 w-9 text-right shrink-0">{Math.round(l.confidence * 100)}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 flex items-start gap-1.5">
                      <Info className="w-3 h-3 mt-0.5 shrink-0" />
                      100% = explicit DONKI <code className="font-mono">linkedEvents</code> reference. Lower values come from
                      physical propagation windows (flare within 3 h of CME onset, L1 shock within 14 h of WSA-ENLIL
                      predicted arrival, storm onset within 30 h of the shock).
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
