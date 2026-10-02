import React, { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Radar, ShieldAlert, Sun, Globe2, Activity, Wind, Satellite, Gauge, TrendingUp,
  AlertTriangle, CheckCircle2, Play, RefreshCw, Layers, Link2, Bot, Sparkles, Info
} from 'lucide-react';
import {
  buildMissionControlStatus, buildTrends, buildCorrelations, buildAnomalies,
  buildActivityBreakdown, buildEventChains, getAnalysisBrief, KP_THRESHOLDS
} from '../services/telemetryAnalysis';

const ICON_MAP = { Globe2, Sun, ShieldAlert, Activity, Wind, Satellite };

const STATUS_STYLES = {
  quiet: { chip: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60', dot: 'bg-cyan-400', label: 'QUIET' },
  nominal: { chip: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60', dot: 'bg-emerald-400', label: 'NOMINAL' },
  watch: { chip: 'bg-amber-950/70 text-amber-300 border-amber-700/60', dot: 'bg-amber-400', label: 'WATCH' },
  elevated: { chip: 'bg-orange-950/70 text-orange-300 border-orange-700/60', dot: 'bg-orange-400', label: 'ELEVATED' },
  critical: { chip: 'bg-red-950/70 text-red-300 border-red-700/60', dot: 'bg-red-400', label: 'CRITICAL' }
};

/** Compact semicircular risk gauge for a 0-100 level. */
function RiskGauge({ value, color, label }) {
  const radius = 62;
  const circumference = Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="flex flex-col items-center">
      <svg width="150" height="88" viewBox="0 0 150 88">
        <path
          d={`M 13 80 A ${radius} ${radius} 0 0 1 137 80`}
          fill="none"
          stroke="rgba(51,65,85,0.65)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d={`M 13 80 A ${radius} ${radius} 0 0 1 137 80`}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${circumference * pct} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="75" y="70" textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="800">
          {value}
        </text>
        <text x="75" y="84" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600" letterSpacing="1">
          RISK INDEX
        </text>
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{label}</span>
    </div>
  );
}

/** Vertical Kp scale bar with NOAA G thresholds. */
function KpScale({ maxKp, gScale, gLabel, gColor }) {
  return (
    <div className="flex gap-4">
      <div className="relative w-9 shrink-0" style={{ height: 190 }}>
        <div className="absolute inset-0 rounded-full bg-slate-950/80 border border-slate-800" />
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500"
          style={{ height: `${Math.min(100, (maxKp / 9) * 100)}%`, background: `linear-gradient(to top, ${gColor}22, ${gColor}88)` }}
        />
        {KP_THRESHOLDS.map((t) => (
          <div
            key={t.g}
            className="absolute left-0 right-0 border-t border-dashed border-slate-600/60"
            style={{ bottom: `${(t.kp / 9) * 100}%` }}
            title={`${t.g} ${t.label} (Kp ${t.kp})`}
          />
        ))}
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">{maxKp.toFixed(2)}</span>
          <span className="text-xs font-semibold text-slate-400">peak Kp</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg border" style={{ color: gColor, borderColor: `${gColor}66`, background: `${gColor}14` }}>
            NOAA {gScale}
          </span>
          <span className="text-xs font-semibold" style={{ color: gColor }}>{gLabel}</span>
        </div>
        <div className="pt-1 space-y-0.5">
          {KP_THRESHOLDS.slice().reverse().map((t) => (
            <div key={t.g} className="flex items-center gap-2 text-[10px]">
              <span className="w-8 font-mono font-bold" style={{ color: maxKp >= t.kp ? t.color : '#64748b' }}>{t.g}</span>
              <span className="text-slate-500">Kp {t.kp} — {t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Shared ORBIT toggle button (ORBIT itself is mounted once at App level). */
function OrbitButton({ isOpen, onToggle }) {
  if (!onToggle) return null;
  return (
    <button
      onClick={onToggle}
      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
        isOpen
          ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
          : 'bg-slate-900/80 hover:bg-slate-950/70 border-slate-800 text-slate-200'
      }`}
      title="Toggle ORBIT — data-aware space weather copilot"
    >
      <Bot className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-cyan-400'}`} />
      <span>{isOpen ? 'Close ORBIT' : 'ORBIT'}</span>
    </button>
  );
}

export default function MissionControlPage({
  data,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  hasQueried,
  dataOrigin,
  sqliteCounts,
  onOpenTimeline,
  onQuery,
  isOrbitOpen = false,
  toggleOrbit
}) {
  const [showBrief, setShowBrief] = useState(false);

  const status = useMemo(
    () => buildMissionControlStatus(data, startDate, endDate),
    [data, startDate, endDate]
  );
  const trends = useMemo(() => buildTrends(data, startDate, endDate), [data, startDate, endDate]);
  const chains = useMemo(() => buildEventChains(data, startDate, endDate), [data, startDate, endDate]);
  const correlations = useMemo(() => buildCorrelations(data, chains), [data, chains]);
  const anomalies = useMemo(() => buildAnomalies(data, chains), [data, chains]);
  const breakdown = useMemo(() => buildActivityBreakdown(data), [data]);
  const brief = useMemo(
    () => getAnalysisBrief(data, startDate, endDate, { dataOrigin, sqliteCounts }),
    [data, startDate, endDate, dataOrigin, sqliteCounts]
  );

  const overallStyle = STATUS_STYLES[status.overall.status] || STATUS_STYLES.quiet;

  // --- Chart option generators ---
  const getRadarOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
    radar: {
      indicator: status.indicators.map((i) => ({ name: i.label, max: 100 })),
      radius: '62%',
      center: ['50%', '46%'],
      axisName: { color: '#cbd5e1', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(51,65,85,0.5)' } },
      splitArea: { areaStyle: { color: ['rgba(15,23,42,0.25)', 'rgba(15,23,42,0.45)'] } },
      axisLine: { lineStyle: { color: 'rgba(51,65,85,0.6)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: status.indicators.map((i) => i.level),
        name: 'Hazard Risk Index',
        areaStyle: { color: 'rgba(244,63,94,0.28)' },
        lineStyle: { color: '#f43f5e', width: 2 },
        itemStyle: { color: '#f43f5e' }
      }]
    }]
  });

  const getBreakdownOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: <b>{c} events</b> ({d}%)' },
    legend: { type: 'scroll', bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, itemGap: 8 },
    series: [{
      type: 'pie',
      radius: ['42%', '66%'],
      center: ['50%', '44%'],
      label: { show: false },
      labelLine: { show: false },
      itemStyle: { borderRadius: 6, borderColor: '#0b1120', borderWidth: 2 },
      data: breakdown.map((b) => ({ name: b.name, value: b.value, itemStyle: { color: b.color } }))
    }]
  });

  const getCombinedActivityOption = () => {
    const dates = [...new Set(trends.series.flatMap((s) => s.points.map((p) => p.date)))].sort();
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, itemGap: 10 },
      grid: { left: '4%', right: '4%', bottom: '16%', top: '16%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 9, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: trends.series.map((s) => ({
        name: s.label,
        type: 'line',
        smooth: true,
        symbolSize: 5,
        data: dates.map((d) => s.points.find((p) => p.date === d)?.count || 0),
        lineStyle: { color: s.color, width: 2 },
        itemStyle: { color: s.color },
        areaStyle: s.key === 'cmes' ? { color: `${s.color}22` } : undefined
      }))
    };
  };

  const getHalfComparisonOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
    grid: { left: '4%', right: '4%', bottom: '10%', top: '16%', containLabel: true },
    xAxis: { type: 'category', data: trends.rows.map((r) => r.label), axisLabel: { color: '#94a3b8', fontSize: 11 }, axisLine: { lineStyle: { color: '#334155' } } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
    series: [
      { name: 'First half', type: 'bar', barWidth: '30%', data: trends.rows.map((r) => r.first), itemStyle: { color: '#475569', borderRadius: [5, 5, 0, 0] } },
      { name: 'Second half', type: 'bar', barWidth: '30%', data: trends.rows.map((r) => r.second), itemStyle: { color: '#22d3ee', borderRadius: [5, 5, 0, 0] } }
    ]
  });

  const getKpVsSpeedOption = () => {
    const points = chains
      .filter((c) => c.stages.includes('cme') && c.stages.includes('storm'))
      .map((c) => {
        const cme = c.nodes.find((n) => n.stage === 'cme');
        const storm = c.nodes.find((n) => n.stage === 'storm');
        return {
          value: [Number(String(cme.label).replace(' km/s', '')), Number(String(storm.label).replace('Kp ', ''))],
          name: c.root,
          chain: c
        };
      });
    if (!points.length) return null;
    return {
      tooltip: {
        formatter: (p) =>
          `${p.data.name}<br/>CME speed: <b>${p.data.value[0]} km/s</b><br/>Peak Kp: <b>${p.data.value[1]}</b><br/><span style="color:#94a3b8">${p.data.chain.summary}</span>`
      },
      grid: { left: '6%', right: '6%', bottom: '12%', top: '12%', containLabel: true },
      xAxis: { type: 'value', name: 'CME speed (km/s)', nameTextStyle: { color: '#cbd5e1', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      yAxis: { type: 'value', name: 'Peak Kp', min: 0, max: 9, nameTextStyle: { color: '#cbd5e1', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{
        type: 'scatter',
        symbolSize: (val) => Math.max(10, Math.min(28, val[1] * 3)),
        data: points,
        itemStyle: { color: '#f43f5e', opacity: 0.8, borderColor: '#0b1120' }
      }]
    };
  };

  const kpScatter = getKpVsSpeedOption();

  // --- Pre-query state ---
  if (!hasQueried) {
    return (
      <div className="space-y-6 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Radar className="w-7 h-7 text-cyan-400" /> Mission Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Unified space-weather situational overview across all 9 NASA DONKI feeds.
            </p>
          </div>
          <OrbitButton isOpen={isOrbitOpen} onToggle={toggleOrbit} />
        </div>
        <div className="clean-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-3xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
            <Radar className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white">Awaiting Telemetry Feed</h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Mission Control needs a telemetry window before it can compute status indicators.
            Pick a date range and run the query.
          </p>
          <button
            onClick={() => onQuery && onQuery(false)}
            className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Query {startDate} → {endDate}
          </button>
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
            <Radar className="w-7 h-7 text-cyan-400" /> Mission Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
            Real-time situational overview • {startDate} → {endDate} • {status.days} day window •
            source: <span className="text-cyan-400">{dataOrigin === 'cache' ? 'SQLite cache' : 'DONKI live API'}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
          <input
            type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
          />
          {onQuery && (
            <button
              onClick={() => onQuery(false)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          )}
          {onOpenTimeline && (
            <button
              onClick={onOpenTimeline}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              <Link2 className="w-3.5 h-3.5 text-violet-400" /> Event Timeline
            </button>
          )}
          <OrbitButton isOpen={isOrbitOpen} onToggle={toggleOrbit} />
        </div>
      </div>

      {/* Overall status banner + composite gauge */}
      <div className={`clean-card p-6 border ${overallStyle.chip} flex flex-col lg:flex-row items-start lg:items-center gap-6`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            {status.overall.status === 'quiet' || status.overall.status === 'nominal' ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : status.overall.status === 'critical' ? (
              <ShieldAlert className="w-8 h-8 text-red-400" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${overallStyle.chip}`}>
                {overallStyle.label}
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800" style={{ color: status.gColor }}>
                NOAA {status.gScale}
              </span>
              <span className="text-xs font-medium text-slate-300">• R-scale {status.rScale} • S-scale {status.sScale}</span>
            </div>
            <h2 className="text-lg font-bold" style={{ color: status.overall.color }}>{status.overall.label}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {status.totals.cmes} CME • {status.totals.flares} flares • {status.totals.storms} storms •
              {' '}{status.totals.seps} SEP • {status.totals.hss} HSS
            </p>
          </div>
        </div>
        <RiskGauge value={status.overall.score} color={status.overall.color} label="COMPOSITE HAZARD" />
      </div>

      {/* Indicator status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {status.indicators.map((ind) => {
          const Icon = ICON_MAP[ind.icon] || Activity;
          const s = STATUS_STYLES[ind.status] || STATUS_STYLES.quiet;
          return (
            <div key={ind.key} className="clean-card clean-card-hover p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl border" style={{ background: `${ind.color}18`, borderColor: `${ind.color}55`, color: ind.color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{ind.label}</div>
                    <div className="text-[10px] text-slate-500">{ind.rate}/day avg</div>
                  </div>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${s.chip}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                  {ind.statusLabel.toUpperCase()}
                </span>
              </div>

              <div className="flex items-end gap-2">
                <span className="text-3xl font-extrabold text-white leading-none">{ind.value}</span>
                <span className="text-[11px] text-slate-500 font-semibold mb-0.5">{ind.unit}</span>
              </div>

              {/* Risk bar */}
              <div>
                <div className="h-2 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ind.level}%`, background: `linear-gradient(to right, ${ind.color}55, ${ind.color})` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-500 font-mono">
                  <span>RISK {ind.level}/100</span>
                  <span>{ind.subMetrics[0]?.label}: {ind.subMetrics[0]?.value}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{ind.detail}</p>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                {ind.subMetrics.map((m) => (
                  <div key={m.label} className="flex items-baseline justify-between gap-1">
                    <span className="text-[10px] text-slate-500 truncate">{m.label}</span>
                    <span className="text-[11px] font-bold text-slate-200 font-mono">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kp scale + radar + breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="clean-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-rose-400" /> Kp / NOAA G-Scale Indicator
              </h3>
              <p className="text-[11px] text-slate-400">G-scale is Kp-only (NOAA SWPC)</p>
            </div>
          </div>
          <KpScale maxKp={status.maxKp} gScale={status.gScale} gLabel={status.gLabel} gColor={status.gColor} />
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Avg Kp</div>
              <div className="text-lg font-extrabold text-slate-200">{status.avgKp.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Storms</div>
              <div className="text-lg font-extrabold text-slate-200">{status.totals.storms}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase">MPC</div>
              <div className="text-lg font-extrabold text-indigo-300">{status.totals.mpcs}</div>
            </div>
          </div>
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Multi-Hazard Radar
              </h3>
              <p className="text-[11px] text-slate-400">Composite risk index per phenomenon</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ReactECharts option={getRadarOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" /> Feed Activity Split
              </h3>
              <p className="text-[11px] text-slate-400">Share of total events by feed</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ReactECharts option={getBreakdownOption()} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Activity timeline + half comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="clean-card p-6 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" /> Combined Daily Activity Timeline
              </h3>
              <p className="text-[11px] text-slate-400">All monitored feeds on a single daily axis</p>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-mono">Multi-Line</span>
          </div>
          <div className="h-80 w-full">
            <ReactECharts option={getCombinedActivityOption()} style={{ height: '100%', width: '100%' }} notMerge />
          </div>
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Half-Window Comparison
              </h3>
              <p className="text-[11px] text-slate-400">First vs second half activity</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={getHalfComparisonOption()} style={{ height: '100%', width: '100%' }} />
          </div>
          <div className="space-y-1">
            {trends.rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between text-[10px]">
                <span className="w-14 font-semibold" style={{ color: r.color }}>{r.label}</span>
                <span className="font-mono text-slate-400">{r.first} → {r.second}</span>
                <span
                  className={`font-mono font-bold ${
                    r.direction === 'rising' ? 'text-orange-400' : r.direction === 'falling' ? 'text-sky-400' : 'text-slate-500'
                  }`}
                >
                  {r.direction === 'rising' ? '▲' : r.direction === 'falling' ? '▼' : '—'} {r.pctChange != null ? `${r.pctChange > 0 ? '+' : ''}${r.pctChange}%` : 'n/a'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Correlations + CME speed vs Kp */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-violet-400" /> Event Relationships
              </h3>
              <p className="text-[11px] text-slate-400">Associations measured in this window</p>
            </div>
          </div>
          {correlations.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-xs">Not enough paired events to compute relationships.</div>
          ) : (
            <div className="space-y-3">
              {correlations.map((c) => (
                <div key={c.pair} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-200">{c.pair}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        c.strength === 'strong'
                          ? 'bg-rose-950/70 text-rose-300 border-rose-700/60'
                          : c.strength === 'moderate'
                          ? 'bg-amber-950/70 text-amber-300 border-amber-700/60'
                          : 'bg-slate-900/80 text-slate-400 border-slate-700/60'
                      }`}
                    >
                      {c.strength.toUpperCase()} {c.direction} r={c.r.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{c.note}</p>
                </div>
              ))}
              <button
                onClick={onOpenTimeline}
                className="w-full px-3 py-2 rounded-xl bg-violet-950/60 hover:bg-violet-900/60 border border-violet-700/50 text-violet-200 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5" /> Explore full event relationship timeline
              </button>
            </div>
          )}
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-teal-400" /> CME Speed vs Geomagnetic Response
              </h3>
              <p className="text-[11px] text-slate-400">One point per resolved CME → storm chain</p>
            </div>
          </div>
          {!kpScatter ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">No chains pair a CME with a measured storm in this window.</div>
          ) : (
            <div className="h-64 w-full">
              <ReactECharts option={kpScatter} style={{ height: '100%', width: '100%' }} />
            </div>
          )}
        </div>
      </div>

      {/* Anomalies */}
      <div className="clean-card p-6 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Notable Anomalies &amp; Watch List
            </h3>
            <p className="text-[11px] text-slate-400">Statistically unusual events and fully-resolved causal chains</p>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/60 font-mono">
            {anomalies.length}
          </span>
        </div>
        {anomalies.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-400 text-xs">No anomalies detected in this window.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a, i) => (
              <div key={`${a.type}-${a.id}-${i}`} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: a.severity >= 7 ? '#f43f5e' : a.severity >= 4 ? '#f59e0b' : '#06b6d4' }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-500">{a.type}</span>
                    <span className="text-[11px] font-mono font-bold text-cyan-300 truncate">{a.id}</span>
                    {a.time && <span className="text-[10px] text-slate-500 font-mono">{String(a.time).slice(0, 16).replace('T', ' ')}</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{a.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis brief for ORBIT */}
      <div className="clean-card p-6 space-y-3">
        <button
          onClick={() => setShowBrief((v) => !v)}
          className="w-full flex items-center justify-between border-b border-slate-800 pb-3 text-left"
        >
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" /> ORBIT Analysis Brief
              <span className="text-[10px] font-normal text-slate-500">— identical context injected into the copilot</span>
            </h3>
            <p className="text-[11px] text-slate-400">Derived status, chains, trends, correlations and anomalies</p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {showBrief ? 'HIDE' : 'SHOW'}
          </span>
        </button>
        {showBrief && (
          <pre className="text-[11px] font-mono text-slate-300 bg-slate-950/80 border border-slate-800 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
            {brief}
          </pre>
        )}
        <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
          <Info className="w-3 h-3" /> Mission Control, the Event Relationship Timeline and ORBIT all read from this same analysis layer.
        </p>
      </div>
    </div>
  );
}
