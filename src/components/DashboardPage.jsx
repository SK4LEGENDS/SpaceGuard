import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Zap, Sun, ShieldAlert, Activity, Compass, RefreshCw, Calendar, Search, 
  Download, BarChart2, Database, AlertCircle, HardDrive, ChevronLeft, ChevronRight, 
  Layers, Play, PieChart, LineChart, TrendingUp, Bot, Globe2, Wind, Magnet, Radio, Orbit, Gauge, Crosshair, Waves, Satellite
} from 'lucide-react';
import { fetchAllSpaceWeather, DEFAULT_START_DATE, DEFAULT_END_DATE } from '../services/donkiApi';
import { saveToSQLite, getSQLiteCounts, exportSQLiteBinary, isDateRangeCached, getCachedTelemetry } from '../services/sqliteService';

export default function DashboardPage({
  apiKey,
  data: propData,
  setData: propSetData,
  hasQueried: propHasQueried,
  setHasQueried: propSetHasQueried,
  startDate: propStartDate,
  setStartDate: propSetStartDate,
  endDate: propEndDate,
  setEndDate: propSetEndDate,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  dataOrigin: propDataOrigin,
  setDataOrigin: propSetDataOrigin,
  sqliteCounts: propSqliteCounts,
  setSqliteCounts: propSetSqliteCounts,
  openRouterApiKey,
  setOpenRouterApiKey,
  queryNonce = 0,
  isOrbitOpen = false,
  toggleOrbit
}) {
  const [localStartDate, setLocalStartDate] = useState(DEFAULT_START_DATE);
  const [localEndDate, setLocalEndDate] = useState(DEFAULT_END_DATE);
  const [localActiveTab, setLocalActiveTab] = useState('geomagnetic');
  const [localHasQueried, setLocalHasQueried] = useState(false);
  const [localDataOrigin, setLocalDataOrigin] = useState('api');
  const [localSqliteCounts, setLocalSqliteCounts] = useState({ cmes: 0, flares: 0, storms: 0, seps: 0, ipss: 0, mpcs: 0, rbes: 0, hss: 0, wes: 0, queries: 0 });
  const [localData, setLocalData] = useState({
    cmes: [],
    flares: [],
    storms: [],
    seps: [],
    ipss: [],
    mpcs: [],
    rbes: [],
    hss: [],
    wes: []
  });

  const startDate = propStartDate !== undefined ? propStartDate : localStartDate;
  const setStartDate = propSetStartDate || setLocalStartDate;

  const endDate = propEndDate !== undefined ? propEndDate : localEndDate;
  const setEndDate = propSetEndDate || setLocalEndDate;

  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab || setLocalActiveTab;

  const hasQueried = propHasQueried !== undefined ? propHasQueried : localHasQueried;
  const setHasQueried = propSetHasQueried || setLocalHasQueried;

  const dataOrigin = propDataOrigin !== undefined ? propDataOrigin : localDataOrigin;
  const setDataOrigin = propSetDataOrigin || setLocalDataOrigin;

  const sqliteCounts = propSqliteCounts !== undefined ? propSqliteCounts : localSqliteCounts;
  const setSqliteCounts = propSetSqliteCounts || setLocalSqliteCounts;

  const data = propData !== undefined ? propData : localData;
  const setData = propSetData || setLocalData;

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Table Pagination / Rows Filter — interactive via Settings sg_prefs.tableRowsDefault
  const [rowLimit, setRowLimit] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem('sg_prefs') || '{}');
      return p.tableRowsDefault || 5;
    } catch { return 5; }
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Keep rowLimit in sync if Settings changes it (storage event)
  React.useEffect(() => {
    const onStorage = () => {
      try {
        const p = JSON.parse(localStorage.getItem('sg_prefs') || '{}');
        if (p.tableRowsDefault && p.tableRowsDefault !== rowLimit) setRowLimit(p.tableRowsDefault);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [rowLimit]);

  // Chart palette — interactive via Settings sg_prefs.chartPalette (standard/ocean/ember/aurora/colorblind/monochrome)
  const getChartPalette = () => {
    try {
      const p = JSON.parse(localStorage.getItem('sg_prefs') || '{}');
      return p.chartPalette || 'standard';
    } catch { return 'standard'; }
  };
  const palette = getChartPalette();
  const paletteColors = {
    standard: { teal: '#0d9488', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', purple: '#8b5cf6', slate: '#64748b' },
    ocean: { teal: '#0ea5e9', rose: '#06b6d4', amber: '#3b82f6', cyan: '#38bdf8', purple: '#6366f1', slate: '#64748b' },
    ember: { teal: '#f59e0b', rose: '#ef4444', amber: '#f97316', cyan: '#fb923c', purple: '#e11d48', slate: '#78716c' },
    aurora: { teal: '#8b5cf6', rose: '#d946ef', amber: '#ec4899', cyan: '#a78bfa', purple: '#c084fc', slate: '#64748b' },
    colorblind: { teal: '#0072B2', rose: '#D55E00', amber: '#E69F00', cyan: '#009E73', purple: '#CC79A7', slate: '#999999' },
    monochrome: { teal: '#475569', rose: '#334155', amber: '#64748b', cyan: '#94a3b8', purple: '#1e293b', slate: '#cbd5e1' },
  }[palette] || { teal: '#0d9488', rose: '#f43f5e', amber: '#f59e0b', cyan: '#06b6d4', purple: '#8b5cf6', slate: '#64748b' };

  const isPhenomenaVisible = (key) => {
    try {
      const p = JSON.parse(localStorage.getItem('sg_prefs') || '{}');
      return p.phenomenaVisibility?.[key] !== false;
    } catch { return true; }
  };

  // ORBIT is owned by App (single global instance) — `toggleOrbit` comes down
  // as a prop. Fall back to local state only if used standalone.
  const [localOrbitOpen, setIsChatOpen] = useState(false);
  const isChatOpen = toggleOrbit ? isOrbitOpen : localOrbitOpen;

  const loadData = async (forceRefetch = false) => {
    if (!startDate || !endDate) {
      alert('Please enter both Start Date and End Date before querying.');
      return;
    }

    setHasQueried(true);
    setLoading(true);
    setErrorMsg(null);
    setCurrentPage(1);
    try {
      // 1. Check if date range is cached in SQLite
      if (!forceRefetch) {
        const isCached = await isDateRangeCached(startDate, endDate);
        if (isCached) {
          const cachedData = await getCachedTelemetry(startDate, endDate);
          if (cachedData && (cachedData.cmes.length > 0 || cachedData.flares.length > 0 || cachedData.storms.length > 0)) {
            setData(cachedData);
            setDataOrigin('cache');
            const counts = await getSQLiteCounts();
            setSqliteCounts(counts);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Query Live NASA DONKI API
      const res = await fetchAllSpaceWeather(startDate, endDate, apiKey);
      setData(res);
      setDataOrigin('api');

      // 3. Save to SQLite database & query cache
      await saveToSQLite(res, startDate, endDate);
      
      const counts = await getSQLiteCounts();
      setSqliteCounts(counts);
    } catch (err) {
      console.error('Telemetry Load Error:', err);
      setErrorMsg(err.message || 'Failed to fetch space weather telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadData(false);
  };

  // Cross-view query trigger (Mission Control / Event Relationship Timeline).
  // Skips the very first render so mounting does not auto-fetch.
  const firstNonceRef = React.useRef(true);
  React.useEffect(() => {
    if (firstNonceRef.current) {
      firstNonceRef.current = false;
      return;
    }
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryNonce]);

  const handleForceRefetch = () => {
    loadData(true);
  };

  // Compute Overall Threat Level & Peak Indicators — FIXED: G-scale is Kp-only (NOAA), flares are R-scale
  const maxKp = data.storms.length > 0 ? Math.max(...data.storms.map(s => s.maxKpIndex || 0)) : 0;
  const hasXFlare = data.flares.some(f => (f.classType || '').startsWith('X'));
  const hasMFlare = data.flares.some(f => (f.classType || '').startsWith('M'));
  const flareRisk = hasXFlare ? 'X-class (R3-R5 radio blackout risk)' : hasMFlare ? 'M-class (R1-R2)' : null;
  
  let threatLevel = { level: 'Quiet / Normal Solar Activity', gScale: 'G0', color: 'text-cyan-300', bg: 'bg-cyan-950/80 border-cyan-700/60' };
  if (maxKp >= 9) {
    threatLevel = { level: 'EXTREME GEOMAGNETIC STORM ALERT', gScale: 'G5', color: 'text-red-300', bg: 'bg-red-950/80 border-red-700/60' };
  } else if (maxKp >= 8) {
    threatLevel = { level: 'SEVERE SPACE WEATHER ALERT', gScale: 'G4', color: 'text-rose-300', bg: 'bg-rose-950/80 border-rose-700/60' };
  } else if (maxKp >= 7) {
    threatLevel = { level: 'STRONG GEOMAGNETIC STORM', gScale: 'G3', color: 'text-amber-300', bg: 'bg-amber-950/80 border-amber-700/60' };
  } else if (maxKp >= 6) {
    threatLevel = { level: 'MODERATE GEOMAGNETIC STORM', gScale: 'G2', color: 'text-yellow-300', bg: 'bg-yellow-950/80 border-yellow-700/60' };
  } else if (maxKp >= 5) {
    threatLevel = { level: 'MINOR STORM ALERT', gScale: 'G1', color: 'text-cyan-300', bg: 'bg-cyan-950/80 border-cyan-700/60' };
  }
  // Note: CME speed / M/X flares do NOT raise G-scale — they are separate R-scale / eruption metrics. Shown as secondary badge if needed.

  // Export JSON — supports 8 phenomena (backward compat for cme/flr/gst)
  const handleExportJSON = () => {
    let exportObj = [];
    if (activeTab === 'cme' || activeTab === 'cme-earth') exportObj = data.cmes;
    if (activeTab === 'flr' || activeTab === 'flare') exportObj = data.flares;
    if (activeTab === 'gst' || activeTab === 'geomagnetic') exportObj = data.storms;
    if (activeTab === 'sep') exportObj = data.seps;
    if (activeTab === 'ips') exportObj = data.ipss;
    if (activeTab === 'rbe') exportObj = data.rbes;
    if (activeTab === 'hss') exportObj = data.hss;
    if (activeTab === 'mpc') exportObj = data.mpcs;
    if (activeTab === 'geomagnetic') exportObj = [...(data.storms||[]), ...(data.mpcs||[])];
    if (activeTab === 'cme-earth') exportObj = [...(data.cmes||[]), ...(data.wes||[])];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `donki_${activeTab}_telemetry.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Pagination Helper
  const paginateArray = (arr) => {
    const safeArr = Array.isArray(arr) ? arr : [];
    const filtered = safeArr.filter(item => {
      const query = searchQuery.toLowerCase();
      const str1 = item.activityID || item.flareID || item.stormID || item.sepID || item.ipsID || item.mpcID || item.rbeID || item.hssID || item.simulationID || '';
      const str2 = item.sourceLocation || item.location || item.instrument || item.catalog || item.link || '';
      return str1.toLowerCase().includes(query) || str2.toLowerCase().includes(query);
    });

    if (rowLimit === 'all') return { pageItems: filtered, totalItems: filtered.length, totalPages: 1 };

    const limit = Number(rowLimit);
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    const startIndex = (currentPage - 1) * limit;
    const pageItems = filtered.slice(startIndex, startIndex + limit);

    return { pageItems, totalItems: filtered.length, totalPages };
  };

  // Helper to sanitize long sensor names
  const cleanSensorName = (name) => {
    if (!name || name === 'Unknown') return 'Unknown Sensor';
    return name
      .replace(/^MODEL:\s*/i, '')
      .replace(/REleASE:\s*/i, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
  };

  // ==========================================
  // APACHE ECHARTS OPTION GENERATORS (PADDING & OVERLAP FIXED)
  // ==========================================

  // --- CME Charts — palette-aware ---
  const getCmeSpeedChartOption = () => {
    const sorted = [...(data.cmes||[])].sort((a, b) => b.speed - a.speed).slice(0, 16);
    const avgSpeed = sorted.length > 0 ? (sorted.reduce((sum, c) => sum + c.speed, 0) / sorted.length) : 0;
    
    return {
      tooltip: { 
        trigger: 'axis', 
        axisPointer: { type: 'shadow' },
        formatter: params => {
          const item = sorted[params[0].dataIndex];
          return `<div class="font-sans text-xs">
            <strong class="text-cyan-400">${params[0].name}</strong><br/>
            Speed: <b class="text-white">${params[0].value} km/s</b><br/>
            Location: <span class="text-slate-300">${item?.sourceLocation || 'Unknown'}</span><br/>
            Type: <span class="text-slate-300">${item?.cmeType || 'Unknown'}</span>
          </div>`;
        }
      },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: sorted.map(c => c.activityID.replace('T', ' ').substring(0, 16)),
        axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8', interval: 0 },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: { 
        type: 'value', 
        name: 'Velocity (km/s)', 
        nameTextStyle: { color: '#cbd5e1', fontSize: 11 },
        axisLine: { lineStyle: { color: '#334155' } }, 
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } } 
      },
      series: [{
        name: 'Speed',
        type: 'bar',
        barWidth: '42%',
        data: sorted.map(c => ({
          value: c.speed,
          itemStyle: { 
            color: c.speed > 1200 
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: paletteColors.rose }, { offset: 1, color: paletteColors.rose + '88' }] }
              : c.speed > 800 
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: paletteColors.amber }, { offset: 1, color: paletteColors.amber + '88' }] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: paletteColors.teal }, { offset: 1, color: paletteColors.teal + '88' }] },
            borderRadius: [6, 6, 0, 0]
          }
        })),
        markLine: {
          data: [{ yAxis: Math.round(avgSpeed), name: 'Avg Speed', lineStyle: { color: '#0f766e', type: 'dashed', width: 2 } }],
          label: { formatter: `Avg: ${Math.round(avgSpeed)} km/s`, fontSize: 10, color: '#0f766e' }
        }
      }]
    };
  };

  const getCmeTypeChartOption = () => {
    const typeMap = {};
    data.cmes.forEach(c => {
      const t = c.cmeType || 'Unknown';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });

    const chartData = Object.entries(typeMap).map(([name, value]) => ({ name: `Type ${name}`, value }));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c} events</b> ({d}%)' },
      legend: { 
        type: 'scroll',
        orient: 'horizontal',
        bottom: 2, 
        left: 'center',
        itemGap: 10,
        textStyle: { fontSize: 11, color: '#475569' } 
      },
      series: [{
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '42%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: chartData.length > 0 ? chartData : [{ name: 'None', value: 0 }],
        color: ['#0d9488', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#64748b']
      }]
    };
  };

  const getCmeTimelineOption = () => {
    const dateCountMap = {};
    data.cmes.forEach(c => {
      const date = c.startTime.split('T')[0];
      dateCountMap[date] = (dateCountMap[date] || 0) + 1;
    });

    const dates = Object.keys(dateCountMap).sort();
    const counts = dates.map(d => dateCountMap[d]);

    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>CME Frequency: <b>{c} ejections</b>' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: dates,
        axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: { 
        type: 'value', 
        name: 'Count / Day',
        minInterval: 1,
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }
      },
      series: [{
        data: counts,
        type: 'line',
        smooth: true,
        symbolSize: 6,
        itemStyle: { color: '#0d9488' },
        lineStyle: { width: 3, color: '#0d9488' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(13, 148, 136, 0.35)' }, { offset: 1, color: 'rgba(13, 148, 136, 0.0)' }]
          }
        }
      }]
    };
  };

  // --- Solar Flare Charts ---
  const getFlareDonutChartOption = () => {
    const counts = {
      'X-Class (Extreme)': data.flares.filter(f => f.classType.startsWith('X')).length,
      'M-Class (Strong)': data.flares.filter(f => f.classType.startsWith('M')).length,
      'C-Class (Moderate)': data.flares.filter(f => f.classType.startsWith('C')).length,
      'B-Class (Minor)': data.flares.filter(f => f.classType.startsWith('B')).length,
      'A-Class (Micro)': data.flares.filter(f => f.classType.startsWith('A')).length
    };
    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c} flares</b> ({d}%)' },
      legend: { 
        type: 'scroll',
        orient: 'horizontal',
        bottom: 2, 
        left: 'center',
        itemGap: 8,
        textStyle: { fontSize: 10.5, color: '#475569' } 
      },
      series: [{
        type: 'pie', 
        radius: ['44%', '66%'], 
        center: ['50%', '42%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: counts['X-Class (Extreme)'], name: 'X-Class (Extreme)', itemStyle: { color: '#ef4444' } },
          { value: counts['M-Class (Strong)'], name: 'M-Class (Strong)', itemStyle: { color: '#f59e0b' } },
          { value: counts['C-Class (Moderate)'], name: 'C-Class (Moderate)', itemStyle: { color: '#10b981' } },
          { value: counts['B-Class (Minor)'], name: 'B-Class (Minor)', itemStyle: { color: '#3b82f6' } },
          { value: counts['A-Class (Micro)'], name: 'A-Class (Micro)', itemStyle: { color: '#0ea5e9' } }
        ]
      }]
    };
  };

  const getFlareIntensityTimelineOption = () => {
    const rankMap = { 'A': 1, 'B': 2, 'C': 3, 'M': 4, 'X': 5 };
    const validFlares = data.flares
      .filter(f => f.classType && f.classType !== 'Unknown')
      .slice(0, 25);

    const xData = validFlares.map(f => f.flareID.replace('T', ' ').substring(0, 16));
    const yData = validFlares.map(f => {
      const letter = f.classType[0].toUpperCase();
      const mag = parseFloat(f.classType.slice(1)) || 0;
      return (rankMap[letter] || 1) + (mag / 10);
    });

    return {
      tooltip: { 
        trigger: 'axis',
        formatter: params => {
          const flare = validFlares[params[0].dataIndex];
          return `<div class="font-sans text-xs">
            <strong class="text-amber-400">${flare?.flareID}</strong><br/>
            Class: <b class="text-white">${flare?.classType}</b><br/>
            Region: <span class="text-slate-300">${flare?.sourceLocation || 'Unknown'}</span><br/>
            Peak Time: <span class="text-slate-300">${flare?.peakTime}</span>
          </div>`;
        }
      },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: xData,
        axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: { 
        type: 'value', 
        name: 'Spectral Rank (1=A, 5=X)',
        min: 1, 
        max: 6,
        axisLine: { lineStyle: { color: '#334155' } },
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } }
      },
      series: [{
        data: yData,
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#f59e0b' },
        lineStyle: { width: 3, color: '#f59e0b' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(245, 158, 11, 0.35)' }, { offset: 1, color: 'rgba(245, 158, 11, 0.0)' }]
          }
        }
      }]
    };
  };

  const getFlareRegionsChartOption = () => {
    const regionMap = {};
    data.flares.forEach(f => {
      const loc = f.sourceLocation && f.sourceLocation !== 'Unknown' ? f.sourceLocation : 'Other / Unmapped';
      regionMap[loc] = (regionMap[loc] || 0) + 1;
    });

    const sortedRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '4%', right: '8%', bottom: '8%', top: '10%', containLabel: true },
      xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } } },
      yAxis: { 
        type: 'category', 
        data: sortedRegions.map(r => r[0]),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { fontSize: 11, color: '#475569' }
      },
      series: [{
        name: 'Flares from Region',
        type: 'bar',
        barWidth: '48%',
        data: sortedRegions.map(r => ({
          value: r[1],
          itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] }
        }))
      }]
    };
  };

  // --- Geomagnetic Storm Charts ---
  const getStormKpAreaChartOption = () => {
    const sortedStorms = [...data.storms].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    return {
      tooltip: { 
        trigger: 'axis', 
        formatter: params => {
          const storm = sortedStorms[params[0].dataIndex];
          const kp = params[0].value;
          const gScale = kp >= 9 ? 'G5 (Extreme)' : kp >= 8 ? 'G4 (Severe)' : kp >= 7 ? 'G3 (Strong)' : kp >= 6 ? 'G2 (Moderate)' : kp >= 5 ? 'G1 (Minor)' : 'G0 (Quiet)';
          return `<div class="font-sans text-xs">
            <strong class="text-rose-400">${storm?.stormID}</strong><br/>
            Peak Kp: <b class="text-white">${kp}</b> (${gScale})<br/>
            Start Time: <span class="text-slate-300">${storm?.startTime}</span>
          </div>`;
        }
      },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: sortedStorms.map(s => s.stormID.split('T')[0]), 
        axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } } 
      },
      yAxis: { 
        type: 'value', 
        min: 0, 
        max: 9, 
        name: 'Peak Kp Index (0-9)',
        axisLine: { lineStyle: { color: '#334155' } }, 
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } } 
      },
      series: [{
        name: 'Max Kp Index',
        data: sortedStorms.map(s => s.maxKpIndex), 
        type: 'line', 
        smooth: true, 
        symbolSize: 8, 
        lineStyle: { color: paletteColors.rose, width: 3 }, 
        itemStyle: { color: paletteColors.rose },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: paletteColors.rose + '59' }, { offset: 1, color: paletteColors.rose + '00' }]
          }
        },
        markLine: {
          data: [
            { yAxis: 5, name: 'G1 Minor', lineStyle: { color: '#10b981', type: 'dashed' }, label: { formatter: 'G1 Minor (Kp 5)', fontSize: 10 } },
            { yAxis: 7, name: 'G3 Strong', lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { formatter: 'G3 Strong (Kp 7)', fontSize: 10 } },
            { yAxis: 9, name: 'G5 Extreme', lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: 'G5 Extreme (Kp 9)', fontSize: 10 } }
          ]
        }
      }]
    };
  };

  const getStormSeverityDistributionOption = () => {
    const counts = {
      'G1 (Minor: Kp=5)': data.storms.filter(s => s.maxKpIndex >= 5 && s.maxKpIndex < 6).length,
      'G2 (Moderate: Kp=6)': data.storms.filter(s => s.maxKpIndex >= 6 && s.maxKpIndex < 7).length,
      'G3 (Strong: Kp=7)': data.storms.filter(s => s.maxKpIndex >= 7 && s.maxKpIndex < 8).length,
      'G4 (Severe: Kp=8)': data.storms.filter(s => s.maxKpIndex >= 8 && s.maxKpIndex < 9).length,
      'G5 (Extreme: Kp=9)': data.storms.filter(s => s.maxKpIndex >= 9).length,
      'Sub-Storm (Kp<5)': data.storms.filter(s => s.maxKpIndex < 5).length
    };

    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c} storms</b> ({d}%)' },
      legend: { 
        type: 'scroll',
        orient: 'horizontal',
        bottom: 2, 
        left: 'center',
        itemGap: 8,
        textStyle: { fontSize: 10, color: '#475569' } 
      },
      series: [{
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '42%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: counts['G1 (Minor: Kp=5)'], name: 'G1 (Minor: Kp=5)', itemStyle: { color: '#10b981' } },
          { value: counts['G2 (Moderate: Kp=6)'], name: 'G2 (Moderate: Kp=6)', itemStyle: { color: '#0ea5e9' } },
          { value: counts['G3 (Strong: Kp=7)'], name: 'G3 (Strong: Kp=7)', itemStyle: { color: '#f59e0b' } },
          { value: counts['G4 (Severe: Kp=8)'], name: 'G4 (Severe: Kp=8)', itemStyle: { color: '#f43f5e' } },
          { value: counts['G5 (Extreme: Kp=9)'], name: 'G5 (Extreme: Kp=9)', itemStyle: { color: '#be123c' } },
          { value: counts['Sub-Storm (Kp<5)'], name: 'Sub-Storm (Kp<5)', itemStyle: { color: '#94a3b8' } }
        ]
      }]
    };
  };

  // --- SEP Charts ---
  const getSepInstrumentChartOption = () => {
    const instMap = {};
    data.seps.forEach(s => {
      const inst = cleanSensorName(s.instrument);
      instMap[inst] = (instMap[inst] || 0) + 1;
    });

    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c} detections</b> ({d}%)' },
      legend: { 
        type: 'scroll',
        orient: 'horizontal',
        bottom: 2, 
        left: 'center',
        itemGap: 8,
        textStyle: { fontSize: 10.5, color: '#475569' } 
      },
      series: [{
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '42%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: Object.entries(instMap).map(([name, value]) => ({ name, value })),
        color: ['#8b5cf6', '#0d9488', '#f59e0b', '#0ea5e9', '#f43f5e', '#6366f1']
      }]
    };
  };

  const getSepCmeLinkOption = () => {
    const linked = data.seps.filter(s => s.linkedCME && s.linkedCME.length > 0).length;
    const unlinked = data.seps.length - linked;

    return {
      tooltip: { trigger: 'item', formatter: '{b}: <b>{c} events</b> ({d}%)' },
      legend: { 
        type: 'scroll',
        orient: 'horizontal',
        bottom: 2, 
        left: 'center',
        itemGap: 10,
        textStyle: { fontSize: 11, color: '#475569' } 
      },
      series: [{
        type: 'pie',
        radius: ['44%', '66%'],
        center: ['50%', '42%'],
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' }
        },
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: linked, name: 'CME-Linked Particle Burst', itemStyle: { color: '#0d9488' } },
          { value: unlinked, name: 'Isolated Proton Event', itemStyle: { color: '#8b5cf6' } }
        ]
      }]
    };
  };

  // --- IPS Charts ---
  const getIpsInstrumentChartOption = () => {
    const instMap = {};
    (data.ipss || []).forEach(i => {
      const inst = cleanSensorName(i.instrument);
      instMap[inst] = (instMap[inst] || 0) + 1;
    });

    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '4%', right: '4%', bottom: '15%', top: '12%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: Object.keys(instMap), 
        axisLabel: { fontSize: 10.5, color: '#94a3b8' } 
      },
      yAxis: { 
        type: 'value', 
        minInterval: 1, 
        splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.4)' } } 
      },
      series: [{
        name: 'Shock Crossings',
        type: 'bar',
        barWidth: '40%',
        data: Object.values(instMap).map(v => ({
          value: v,
          itemStyle: { color: '#10b981', borderRadius: [6, 6, 0, 0] }
        }))
      }]
    };
  };

  // ==========================================
  // 8-PHENOMENA EXTENDED VISUALIZATIONS
  // Each aligns to the table: Best visualization column
  // ==========================================

  const getDailyCounts = (arr, dateKey) => {
    const map = {};
    (arr || []).forEach(item => {
      const raw = item[dateKey];
      if (!raw || raw === 'N/A') return;
      const d = raw.split('T')[0];
      map[d] = (map[d] || 0) + 1;
    });
    return map;
  };

  const getUnifiedDates = (...maps) => {
    const set = new Set();
    maps.forEach(m => Object.keys(m).forEach(k => set.add(k)));
    return Array.from(set).sort();
  };

  // Geomagnetic Storm — Kp + multi-source timeline
  const getGeomagneticMultiSourceOption = () => {
    const cmeMap = getDailyCounts(data.cmes, 'startTime');
    const ipsMap = getDailyCounts(data.ipss, 'eventTime');
    const hssMap = getDailyCounts(data.hss, 'eventTime');
    const mpcMap = getDailyCounts(data.mpcs, 'eventTime');
    const gstMap = getDailyCounts(data.storms, 'startTime');
    const dates = getUnifiedDates(cmeMap, ipsMap, hssMap, mpcMap, gstMap);
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, data: ['CME', 'IPS Shock', 'HSS/Wind', 'MPC', 'GST Kp events'] },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [
        { name: 'CME', type: 'line', smooth: true, data: dates.map(d => cmeMap[d] || 0), lineStyle: { color: '#0d9488', width: 2 }, itemStyle: { color: '#0d9488' } },
        { name: 'IPS Shock', type: 'line', smooth: true, data: dates.map(d => ipsMap[d] || 0), lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' } },
        { name: 'HSS/Wind', type: 'line', smooth: true, data: dates.map(d => hssMap[d] || 0), lineStyle: { color: '#0ea5e9', width: 2 }, itemStyle: { color: '#0ea5e9' } },
        { name: 'MPC', type: 'line', smooth: true, data: dates.map(d => mpcMap[d] || 0), lineStyle: { color: '#6366f1', width: 2 }, itemStyle: { color: '#6366f1' } },
        { name: 'GST Kp events', type: 'line', smooth: true, data: dates.map(d => gstMap[d] || 0), lineStyle: { color: '#f43f5e', width: 2 }, itemStyle: { color: '#f43f5e' }, areaStyle: { color: 'rgba(244,63,94,0.12)' } }
      ]
    };
  };

  // Combined Flare→CME→SEP timeline (Solar Radiation)
  const getFlareCmeSepTimelineOption = () => {
    const flareMap = getDailyCounts(data.flares, 'beginTime');
    const cmeMap = getDailyCounts(data.cmes, 'startTime');
    const sepMap = getDailyCounts(data.seps, 'eventTime');
    const dates = getUnifiedDates(flareMap, cmeMap, sepMap);
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, data: ['FLR', 'CME', 'SEP'] },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [
        { name: 'FLR', type: 'bar', barWidth: '22%', data: dates.map(d => flareMap[d] || 0), itemStyle: { color: '#f59e0b', borderRadius: [4,4,0,0] } },
        { name: 'CME', type: 'bar', barWidth: '22%', data: dates.map(d => cmeMap[d] || 0), itemStyle: { color: '#0d9488', borderRadius: [4,4,0,0] } },
        { name: 'SEP', type: 'line', smooth: true, symbolSize: 6, data: dates.map(d => sepMap[d] || 0), lineStyle: { color: '#8b5cf6', width: 3 }, itemStyle: { color: '#8b5cf6' } }
      ]
    };
  };

  // SEP particle flux proxy (daily SEP line)
  const getSepFluxOption = () => {
    const map = getDailyCounts(data.seps, 'eventTime');
    const dates = Object.keys(map).sort();
    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>SEP frequency: <b>{c}</b> (particle flux proxy)' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', name: 'SEP events / day (flux proxy)', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ data: dates.map(d => map[d]), type: 'line', smooth: true, symbolSize: 8, lineStyle: { color: '#8b5cf6', width: 3 }, itemStyle: { color: '#8b5cf6' }, areaStyle: { color: 'rgba(139,92,246,0.18)' } }]
    };
  };

  // RBE electron flux proxy
  const getRbeFluxOption = () => {
    const map = getDailyCounts(data.rbes, 'eventTime');
    const dates = Object.keys(map).sort();
    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>RBE frequency: <b>{c}</b> (electron flux proxy)' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', name: 'RBE / day (flux proxy)', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ data: dates.map(d => map[d]), type: 'line', smooth: true, symbolSize: 8, lineStyle: { color: '#06b6d4', width: 3 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: 'rgba(6,182,214,0.18)' } }]
    };
  };

  // HSS solar-wind speed proxy (daily HSS count)
  const getHssTimelineOption = () => {
    const map = getDailyCounts(data.hss, 'eventTime');
    const dates = Object.keys(map).sort();
    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>HSS: <b>{c}</b> streams' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', name: 'HSS / day (wind speed proxy)', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ data: dates.map(d => map[d]), type: 'line', smooth: true, symbolSize: 6, lineStyle: { color: '#0ea5e9', width: 3 }, itemStyle: { color: '#0ea5e9' }, areaStyle: { color: 'rgba(14,165,233,0.14)' } }]
    };
  };

  const getMpcTimelineOption = () => {
    const map = getDailyCounts(data.mpcs, 'eventTime');
    const dates = Object.keys(map).sort();
    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>MPC: <b>{c}</b> crossings' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ data: dates.map(d => map[d]), type: 'line', smooth: true, step: 'middle', symbolSize: 6, lineStyle: { color: '#6366f1', width: 3 }, itemStyle: { color: '#6366f1' }, areaStyle: { color: 'rgba(99,102,241,0.15)' } }]
    };
  };

  const getIpsTimelineOption = () => {
    const map = getDailyCounts(data.ipss, 'eventTime');
    const dates = Object.keys(map).sort();
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ data: dates.map(d => map[d]), type: 'bar', barWidth: '38%', itemStyle: { color: '#10b981', borderRadius: [6,6,0,0] } }]
    };
  };

  // CME direction 2D scatter: longitude vs latitude
  const getCmeDirectionScatterOption = () => {
    const points = (data.cmes || []).filter(c => c.latitude != null && c.longitude != null).map(c => ({
      value: [c.longitude, c.latitude, c.speed],
      speed: c.speed,
      halfAngle: c.halfAngle,
      id: c.activityID
    }));
    return {
      tooltip: {
        formatter: p => `${p.data.id}<br/>Lon: ${p.data.value[0]}°, Lat: ${p.data.value[1]}°<br/>Speed: ${p.data.speed} km/s<br/>Half-Angle: ${p.data.halfAngle}°`
      },
      grid: { left: '8%', right: '8%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'value', name: 'Longitude (°)', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: '#cbd5e1', fontSize: 11 }, axisLabel: { color: '#94a3b8' }, min: -180, max: 180, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      yAxis: { type: 'value', name: 'Latitude (°)', nameTextStyle: { color: '#cbd5e1', fontSize: 11 }, axisLabel: { color: '#94a3b8' }, min: -90, max: 90, axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      visualMap: { min: 0, max: 2500, dimension: 2, show: false, inRange: { color: ['#5eead4', '#0d9488', '#f59e0b', '#ef4444'] } },
      series: [{
        type: 'scatter',
        symbolSize: val => {
          const ha = points[val.dataIndex]?.halfAngle || 20;
          return Math.max(8, Math.min(28, ha * 0.6));
        },
        data: points.map(p => ({ value: p.value, speed: p.speed, halfAngle: p.halfAngle, id: p.id })),
        itemStyle: { borderColor: '#0f172a', borderWidth: 1, opacity: 0.85 },
        markLine: { silent: true, symbol: 'none', data: [{ xAxis: 0 }, { yAxis: 0 }], lineStyle: { color: '#475569', type: 'dashed' } }
      }]
    };
  };

  // CME width / half-angle distribution
  const getCmeWidthDistributionOption = () => {
    const bins = { '<20°':0, '20-40°':0, '40-60°':0, '60-90°':0, '>90°':0 };
    (data.cmes || []).forEach(c => {
      const ha = c.halfAngle || 0;
      if (ha < 20) bins['<20°']++;
      else if (ha < 40) bins['20-40°']++;
      else if (ha < 60) bins['40-60°']++;
      else if (ha < 90) bins['60-90°']++;
      else bins['>90°']++;
    });
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: Object.keys(bins), axisLabel: { color: '#94a3b8', fontSize: 11 }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ type: 'bar', barWidth: '44%', data: Object.values(bins).map(v => ({ value: v, itemStyle: { color: '#0d9488', borderRadius: [6,6,0,0] } })) }]
    };
  };

  // WSA-ENLIL Earth-arrival timeline
  const getWsaArrivalOption = () => {
    const earth = (data.wes || []).filter(w => w.isEarthGB && w.estimatedShockArrivalTime);
    const sorted = earth.sort((a,b) => new Date(a.estimatedShockArrivalTime) - new Date(b.estimatedShockArrivalTime)).slice(0, 20);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: p => {
          const w = sorted[p[0].dataIndex];
          return `${w.simulationID}<br/>Arrival: <b>${w.estimatedShockArrivalTime}</b><br/>Speed: ${w.speed || 'N/A'} km/s<br/>Kp90: ${w.kp90 ?? 'N/A'} Lat:${w.latitude} Lon:${w.longitude}`;
        }
      },
      grid: { left: '4%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: { type: 'category', data: sorted.map(w => (w.estimatedShockArrivalTime || '').substring(0,10)), axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', name: 'Input CME Speed (km/s)', splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [{ type: 'bar', barWidth: '42%', data: sorted.map(w => w.speed || 0), itemStyle: { color: '#f59e0b', borderRadius: [6,6,0,0] }, markLine: { data: [{ type: 'average', name: 'Avg' }], label: { fontSize: 10 } } }]
    };
  };

  // HSS / RBE / GST multi-line for Radiation Belt & HSS phenomena
  const getHssRbeGstOption = () => {
    const hssMap = getDailyCounts(data.hss, 'eventTime');
    const rbeMap = getDailyCounts(data.rbes, 'eventTime');
    const gstMap = getDailyCounts(data.storms, 'startTime');
    const dates = getUnifiedDates(hssMap, rbeMap, gstMap);
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, data: ['HSS', 'RBE', 'GST'] },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [
        { name: 'HSS', type: 'line', smooth: true, data: dates.map(d => hssMap[d] || 0), lineStyle: { color: '#0ea5e9', width: 2 }, itemStyle: { color: '#0ea5e9' } },
        { name: 'RBE', type: 'line', smooth: true, data: dates.map(d => rbeMap[d] || 0), lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' } },
        { name: 'GST', type: 'line', smooth: true, data: dates.map(d => gstMap[d] || 0), lineStyle: { color: '#f43f5e', width: 2 }, itemStyle: { color: '#f43f5e' } }
      ]
    };
  };

  // MPC + HSS + GST for Magnetopause
  const getMpcHssGstOption = () => {
    const mpcMap = getDailyCounts(data.mpcs, 'eventTime');
    const hssMap = getDailyCounts(data.hss, 'eventTime');
    const gstMap = getDailyCounts(data.storms, 'startTime');
    const dates = getUnifiedDates(mpcMap, hssMap, gstMap);
    return {
      tooltip: { trigger: 'axis' },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, data: ['MPC', 'HSS', 'GST'] },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 28, fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [
        { name: 'MPC', type: 'line', smooth: true, step: 'middle', data: dates.map(d => mpcMap[d] || 0), lineStyle: { color: '#6366f1', width: 3 }, itemStyle: { color: '#6366f1' } },
        { name: 'HSS', type: 'line', smooth: true, data: dates.map(d => hssMap[d] || 0), lineStyle: { color: '#0ea5e9', width: 2 }, itemStyle: { color: '#0ea5e9' } },
        { name: 'GST', type: 'line', smooth: true, data: dates.map(d => gstMap[d] || 0), lineStyle: { color: '#f43f5e', width: 2 }, itemStyle: { color: '#f43f5e' } }
      ]
    };
  };

  // IPS before/after comparison (split interval at mid date)
  const getIpsBeforeAfterOption = () => {
    const arr = (data.ipss || []).map(i => i.eventTime).filter(Boolean).sort();
    if (arr.length < 2) return { title: { text: 'Insufficient IPS data', left: 'center', textStyle: { color: '#94a3b8', fontSize: 12 } } };
    const midIdx = Math.floor(arr.length / 2);
    const beforeCount = midIdx;
    const afterCount = arr.length - midIdx;
    // Also show solar-wind proxy change: HSS before vs after
    const hssArr = (data.hss || []).map(h => h.eventTime).filter(Boolean).sort();
    const hssMid = Math.floor(hssArr.length / 2);
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle: { color: '#94a3b8', fontSize: 10 }, data: ['Before mid-interval', 'After mid-interval'] },
      grid: { left: '4%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
      xAxis: { type: 'category', data: ['IPS Shocks', 'HSS Streams'], axisLabel: { color: '#94a3b8' }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } } },
      series: [
        { name: 'Before mid-interval', type: 'bar', barWidth: '22%', data: [beforeCount, hssMid], itemStyle: { color: '#64748b', borderRadius: [6,6,0,0] } },
        { name: 'After mid-interval', type: 'bar', barWidth: '22%', data: [afterCount, hssArr.length - hssMid], itemStyle: { color: '#10b981', borderRadius: [6,6,0,0] } }
      ]
    };
  };

  return (
    <div className="space-y-8 py-6 relative">
      {/* ORBIT is mounted once at App level (so it is also available on Mission
          Control / Event Timeline and keeps its state across navigation).
          The button below only toggles that shared instance. */}
      {/* Title & Toolbar Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Main Telemetry Dashboard
            </h1>
            {dataOrigin === 'cache' && hasQueried && (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-400 border border-purple-700/60 font-medium text-xs flex items-center gap-1">
                <Database className="w-3 h-3 text-purple-600" />
                SQLite Cache Used (0 API Calls)
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            Select a date window and click <strong>Query Live API</strong> to fetch and visualize space weather telemetry.
          </p>
        </div>

        {/* Date Controls & Refetch */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 shadow-card-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/70 rounded-xl text-xs font-semibold text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Range:</span>
            </div>
            
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Query Live API
            </button>
          </form>

          {dataOrigin === 'cache' && hasQueried && (
            <button
              onClick={handleForceRefetch}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-card-sm transition-all"
              title="Re-query NASA API directly"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Force Refetch</span>
            </button>
          )}

          <button
            onClick={exportSQLiteBinary}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-card-sm transition-all"
            title="Download spaceguard.db"
          >
            <HardDrive className="w-4 h-4 text-purple-600" />
            <span>.db Export</span>
          </button>

          <button
            onClick={() => (toggleOrbit ? toggleOrbit() : setIsChatOpen(prev => !prev))}
            className={`px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 shadow-card-sm transition-all ${
              isChatOpen 
                ? 'bg-cyan-600 text-white border-cyan-600 shadow-md' 
                : 'bg-slate-900/80 hover:bg-slate-950/70 border-slate-800 text-slate-200'
            }`}
            title="Toggle ORBIT — data-aware space weather copilot"
          >
            <Bot className={`w-4 h-4 ${isChatOpen ? 'text-white' : 'text-cyan-400'}`} />
            <span>{isChatOpen ? 'Close ORBIT' : 'ORBIT'}</span>
          </button>
        </div>
      </div>

      {/* Initial Unqueried State Notice */}
      {!hasQueried ? (
        <div className="clean-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 rounded-3xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
            <Calendar className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white font-sans">Ready to Fetch Telemetry</h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Select your desired <strong>Start Date</strong> and <strong>End Date</strong> in the control bar above, then click <strong>Query Live API</strong> to fetch real-time space weather data.
          </p>
          <button
            onClick={() => loadData(false)}
            className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Query Default 30-Day Range ({startDate} to {endDate})
          </button>
        </div>
      ) : (
        <>
          {/* Top Stat Cards Row — 8 Phenomena */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => setActiveTab('geomagnetic')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'geomagnetic' ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">🌍 Geomag Storm</span>
                <div className="p-2 rounded-xl bg-rose-950/70 text-rose-400 border border-rose-800/60"><ShieldAlert className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.storms || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-rose-400">Max Kp {maxKp.toFixed(1)} • { (data.mpcs||[]).length} MPC</div>
            </div>

            <div onClick={() => setActiveTab('sep')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'sep' ? 'border-purple-500 ring-2 ring-purple-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">☢️ SEP / Radiation</span>
                <div className="p-2 rounded-xl bg-purple-950/70 text-purple-400 border border-purple-800/60"><Activity className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.seps || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-purple-400">{(data.flares||[]).filter(f=> (f.classType||'').startsWith('M') || (f.classType||'').startsWith('X')).length} M/X flares • {(data.cmes||[]).length} CMEs</div>
            </div>

            <div onClick={() => setActiveTab('rbe')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'rbe' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">🛰️ RBE Belt</span>
                <div className="p-2 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60"><Satellite className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.rbes || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-cyan-400">Electron flux • {(data.hss||[]).length} HSS</div>
            </div>

            <div onClick={() => setActiveTab('cme-earth')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'cme-earth' ? 'border-teal-500 ring-2 ring-teal-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">☄️ Earth CME</span>
                <div className="p-2 rounded-xl bg-teal-950/70 text-teal-400 border border-teal-800/60"><Globe2 className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.cmes || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-teal-400">{(data.wes||[]).filter(w=>w.isEarthGB).length} Earth-GB • {(data.wes||[]).length} WSA runs</div>
            </div>

            <div onClick={() => setActiveTab('flare')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'flare' ? 'border-amber-500 ring-2 ring-amber-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">⚡ Solar Flare</span>
                <div className="p-2 rounded-xl bg-amber-950/70 text-amber-400 border border-amber-800/60"><Sun className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.flares || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-amber-400">M/X: {(data.flares||[]).filter(f=>f.classType.startsWith('M')||f.classType.startsWith('X')).length}</div>
            </div>

            <div onClick={() => setActiveTab('hss')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'hss' ? 'border-sky-500 ring-2 ring-sky-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">💨 HSS Stream</span>
                <div className="p-2 rounded-xl bg-sky-950/70 text-sky-400 border border-sky-800/60"><Wind className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.hss || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-sky-400">Wind speed proxy</div>
            </div>

            <div onClick={() => setActiveTab('ips')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'ips' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">🌊 IPS Shock</span>
                <div className="p-2 rounded-xl bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"><Waves className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.ipss || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-emerald-400">L1 crossings</div>
            </div>

            <div onClick={() => setActiveTab('mpc')} className={`clean-card p-5 cursor-pointer clean-card-hover ${activeTab === 'mpc' ? 'border-indigo-500 ring-2 ring-indigo-500/20' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">🧲 MPC</span>
                <div className="p-2 rounded-xl bg-indigo-950/70 text-indigo-400 border border-indigo-800/60"><Magnet className="w-4 h-4" /></div>
              </div>
              <div className="text-2xl font-extrabold text-white">{(data.mpcs || []).length}</div>
              <div className="mt-1 text-[11px] font-medium text-indigo-400">Magnetopause</div>
            </div>
          </div>

          {/* NOAA Space Weather Alert Banner */}
          <div className={`clean-card p-6 border ${threatLevel.bg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
                <ShieldAlert className={`w-7 h-7 ${threatLevel.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 ${threatLevel.color}`}>
                    NOAA SCALE: {threatLevel.gScale}
                  </span>
                  <span className="text-xs font-medium text-slate-300">• Maximum Kp Index: <strong className="text-white">{maxKp.toFixed(2)}</strong></span>
                </div>
                <h2 className={`text-lg font-bold font-sans ${threatLevel.color}`}>
                  {threatLevel.level}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-purple-400 bg-purple-950/70 px-3.5 py-1.5 rounded-xl border border-purple-700/60">
              <Database className="w-3.5 h-3.5 text-purple-600" />
              <span>SQLite WASM Storage Active</span>
            </div>
          </div>

          {/* Horizontal Phenomena Navigation — 8 DONKI phenomena — single-icon translucent pills, visibility via Settings */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 text-[13px] font-medium p-2 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-700/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {isPhenomenaVisible('geomagnetic') && (<button onClick={() => setActiveTab('geomagnetic')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'geomagnetic' ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">🌍 Geomagnetic ({(data.storms||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('sep') && (<button onClick={() => setActiveTab('sep')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'sep' ? 'bg-purple-500/25 text-purple-300 border-purple-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">☢️ SEP ({(data.seps||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('rbe') && (<button onClick={() => setActiveTab('rbe')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'rbe' ? 'bg-cyan-500/25 text-cyan-300 border-cyan-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">🛰️ RBE ({(data.rbes||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('cme-earth') && (<button onClick={() => setActiveTab('cme-earth')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'cme-earth' ? 'bg-teal-500/30 text-teal-300 border-teal-500/60 shadow-sm ring-1 ring-teal-500/20' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">☄️ CME Earth ({(data.cmes||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('flare') && (<button onClick={() => setActiveTab('flare')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'flare' ? 'bg-amber-500/25 text-amber-300 border-amber-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">⚡ Flare ({(data.flares||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('hss') && (<button onClick={() => setActiveTab('hss')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'hss' ? 'bg-sky-500/25 text-sky-300 border-sky-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">💨 HSS ({(data.hss||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('ips') && (<button onClick={() => setActiveTab('ips')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'ips' ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">🌊 IPS Shock ({(data.ipss||[]).length})</span>
            </button>)}
            {isPhenomenaVisible('mpc') && (<button onClick={() => setActiveTab('mpc')} className={`px-3.5 py-1.5 rounded-full border backdrop-blur-md font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'mpc' ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/50 shadow-sm' : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-700/60 hover:text-white'}`}>
              <span className="bg-slate-900/30 px-2 py-0.5 rounded-md">🧲 MPC ({(data.mpcs||[]).length})</span>
            </button>)}
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="clean-card p-16 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm font-medium text-slate-300">
                {dataOrigin === 'cache' ? 'Querying SQLite Database...' : 'Fetching NASA DONKI REST API...'}
              </p>
            </div>
          ) : errorMsg ? (
            <div className="clean-card p-8 bg-red-50 border border-red-200 rounded-3xl flex items-center gap-4 text-red-800">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <h3 className="font-bold text-sm">NASA DONKI API Error</h3>
                <p className="text-xs mt-0.5 text-red-700">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* ==================================================== */}
              {/* TAB: EARTH-DIRECTED CME / POTENTIAL IMPACT (☄️)      */}
              {/* Table row: CME direction, speed, width, WSA-ENLIL, FLR */}
              {/* ==================================================== */}
              {(activeTab === 'cme-earth' || activeTab === 'cme') && (
                <div className="space-y-6">
                  
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total CME Events</span>
                      <div className="text-xl font-extrabold text-white">{data.cmes.length}</div>
                      <span className="text-[11px] text-cyan-400 font-medium">In selected date range</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Peak Velocity</span>
                      <div className="text-xl font-extrabold text-rose-600">
                        {data.cmes.length > 0 ? Math.max(...data.cmes.map(c => c.speed)) : 0} km/s
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Fastest observed shock</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Average Velocity</span>
                      <div className="text-xl font-extrabold text-cyan-400">
                        {data.cmes.length > 0 ? (data.cmes.reduce((acc, c) => acc + c.speed, 0) / data.cmes.length).toFixed(0) : 0} km/s
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Mean plasma speed</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Extreme Ejections (&gt;1000 km/s)</span>
                      <div className="text-xl font-extrabold text-amber-600">
                        {data.cmes.filter(c => c.speed >= 1000).length}
                      </div>
                      <span className="text-[11px] text-amber-600 font-medium">High geomagnetic threat</span>
                    </div>
                  </div>

                  {/* Primary Chart Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CME Speed Bar Chart */}
                    <div className="clean-card p-6 lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-cyan-400" /> CME Plasma Velocity Spectrum
                          </h3>
                          <p className="text-[11px] text-slate-400">Top Coronal Mass Ejections by radial expansion speed (km/s)</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-medium font-mono">
                          ECharts Bar
                        </span>
                      </div>
                      {data.cmes.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No CME events recorded.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getCmeSpeedChartOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>

                    {/* CME Type Breakdown Donut Chart */}
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-cyan-400" /> CME Classification Types
                          </h3>
                          <p className="text-[11px] text-slate-400">Categorical geometry distribution</p>
                        </div>
                      </div>
                      {data.cmes.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No CME events recorded.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getCmeTypeChartOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secondary Chart Row: CME Daily Timeline */}
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" /> CME Temporal Emission Frequency (Daily Timeline)
                        </h3>
                        <p className="text-[11px] text-slate-400">Coronal Mass Ejection occurrence count grouped chronologically</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-medium font-mono">
                        ECharts Area Spline
                      </span>
                    </div>
                    {data.cmes.length === 0 ? (
                      <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No CME events recorded.</div>
                    ) : (
                      <div className="h-72 w-full">
                        <ReactECharts option={getCmeTimelineOption()} style={{ height: '100%', width: '100%' }} />
                      </div>
                    )}
                  </div>

                  {/* Earth-Directed Extras — 2D direction, width, WSA-ENLIL ⭐ */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <Crosshair className="w-4 h-4 text-teal-400" /> CME Direction 2D Plot ⭐
                          </h3>
                          <p className="text-[11px] text-slate-400">Latitude vs Longitude — bubble size = angular width, color = speed</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-teal-950/70 text-teal-400 border border-teal-800/60 font-mono">Scatter</span>
                      </div>
                      {(data.cmes||[]).length===0? <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No CME events.</div> : <div className="h-80 w-full"><ReactECharts option={getCmeDirectionScatterOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-teal-400" /> CME Angular Width Distribution ⭐
                          </h3>
                          <p className="text-[11px] text-slate-400">Width / gauge visualization — half-angle histogram</p>
                        </div>
                      </div>
                      <div className="h-80 w-full"><ReactECharts option={getCmeWidthDistributionOption()} style={{height:'100%', width:'100%'}} /></div>
                    </div>
                  </div>

                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Orbit className="w-4 h-4 text-amber-600" /> WSA-ENLIL Earth Arrival Timeline ⭐
                        </h3>
                        <p className="text-[11px] text-slate-400">Predicted arrival, impact, duration — Earth grazing vs direct impact (isEarthGB)</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/60 font-mono">Bar + Marker</span>
                    </div>
                    {(data.wes||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No WSA-ENLIL predictions for this window.</div> : <div className="h-72 w-full"><ReactECharts option={getWsaArrivalOption()} style={{height:'100%', width:'100%'}} /></div>}
                  </div>

                  {/* Data Table */}
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.cmes);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">CME Activity Records</h3>
                            <span className="text-xs text-slate-400">({totalItems} items)</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <span>Rows:</span>
                              <select
                                value={rowLimit}
                                onChange={(e) => setRowLimit(e.target.value)}
                                className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500"
                              >
                                <option value="5">5 rows</option>
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="all">All rows</option>
                              </select>
                            </div>

                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input
                                type="text"
                                placeholder="Search CMEs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
                              />
                            </div>

                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1">
                              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export JSON
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900/80 backdrop-blur-sm text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                              <tr>
                                <th className="px-4 py-3">Activity ID</th>
                                <th className="px-4 py-3">Start Time</th>
                                <th className="px-4 py-3">Source Location</th>
                                <th className="px-4 py-3">Speed (km/s)</th>
                                <th className="px-4 py-3">Half Angle</th>
                                <th className="px-4 py-3">Type</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {pageItems.length === 0 ? (
                                <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-400">No CME events found.</td></tr>
                              ) : (
                                pageItems.map((cme, idx) => (
                                  <tr key={idx} className="hover:bg-cyan-950/70/40 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{cme.activityID}</td>
                                    <td className="px-4 py-3 text-slate-300">{cme.startTime}</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono text-[11px]">{cme.sourceLocation}</span></td>
                                    <td className="px-4 py-3 font-bold"><span className={cme.speed > 1200 ? 'text-rose-600' : 'text-cyan-400'}>{cme.speed} km/s</span></td>
                                    <td className="px-4 py-3">{cme.halfAngle}°</td>
                                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/70 text-cyan-400">Type {cme.cmeType}</span></td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {rowLimit !== 'all' && totalPages > 1 && (
                          <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages} ({totalItems} records)</span>
                            <div className="flex items-center gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* ==================================================== */}
              {/* TAB: SOLAR FLARE ACTIVITY (⚡) — Flare class, peak, AR */}
              {/* ==================================================== */}
              {(activeTab === 'flare' || activeTab === 'flr') && (
                <div className="space-y-6">
                  
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Solar Flares</span>
                      <div className="text-xl font-extrabold text-white">{data.flares.length}</div>
                      <span className="text-[11px] text-amber-600 font-medium">GOES X-ray detections</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Extreme X-Class</span>
                      <div className="text-xl font-extrabold text-red-600">
                        {data.flares.filter(f => f.classType.startsWith('X')).length}
                      </div>
                      <span className="text-[11px] text-red-600 font-medium">R3-R5 Radio Blackout risk</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Strong M-Class</span>
                      <div className="text-xl font-extrabold text-amber-600">
                        {data.flares.filter(f => f.classType.startsWith('M')).length}
                      </div>
                      <span className="text-[11px] text-amber-600 font-medium">R1-R2 Moderate Blackouts</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Common C/B/A Class</span>
                      <div className="text-xl font-extrabold text-cyan-400">
                        {data.flares.filter(f => ['C', 'B', 'A'].some(l => f.classType.startsWith(l))).length}
                      </div>
                      <span className="text-[11px] text-cyan-400 font-medium">Background / Low flux</span>
                    </div>
                  </div>

                  {/* Primary Chart Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Spectral Donut Chart */}
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-600" /> GOES Spectral Classification
                          </h3>
                          <p className="text-[11px] text-slate-400">X, M, C, B, A logarithmic power tiers</p>
                        </div>
                      </div>
                      {data.flares.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No Solar Flare events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getFlareDonutChartOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>

                    {/* Flare Intensity Timeline Line Chart */}
                    <div className="clean-card p-6 lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600" /> Solar Flare Peak Intensity Timeline
                          </h3>
                          <p className="text-[11px] text-slate-400">Chronological peak X-ray flux rank progression</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/60 font-medium font-mono">
                          ECharts Spline
                        </span>
                      </div>
                      {data.flares.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No Solar Flare events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getFlareIntensityTimelineOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secondary Chart Row: Active Solar Source Regions */}
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-amber-600" /> Top Active Solar Source Regions
                        </h3>
                        <p className="text-[11px] text-slate-400">Heliographic coordinate hotspots producing solar flares</p>
                      </div>
                    </div>
                    {data.flares.length === 0 ? (
                      <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No Solar Flare events.</div>
                    ) : (
                      <div className="h-72 w-full">
                        <ReactECharts option={getFlareRegionsChartOption()} style={{ height: '100%', width: '100%' }} />
                      </div>
                    )}
                  </div>

                  {/* Data Table */}
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.flares);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Solar Flare Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <span>Rows:</span>
                              <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold focus:outline-none">
                                <option value="5">5 rows</option>
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="all">All rows</option>
                              </select>
                            </div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-amber-600" /> Export JSON</button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900/80 backdrop-blur-sm text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                              <tr>
                                <th className="px-4 py-3">Flare ID</th>
                                <th className="px-4 py-3">Begin Time</th>
                                <th className="px-4 py-3">Peak Time</th>
                                <th className="px-4 py-3">GOES Class</th>
                                <th className="px-4 py-3">Source Region</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {pageItems.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No Solar Flare events.</td></tr>
                              ) : (
                                pageItems.map((flare, idx) => (
                                  <tr key={idx} className="hover:bg-amber-950/70/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{flare.flareID}</td>
                                    <td className="px-4 py-3 text-slate-300">{flare.beginTime}</td>
                                    <td className="px-4 py-3 text-slate-300">{flare.peakTime}</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">{flare.classType}</span></td>
                                    <td className="px-4 py-3">{flare.sourceLocation}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {rowLimit !== 'all' && totalPages > 1 && (
                          <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages} ({totalItems} records)</span>
                            <div className="flex items-center gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB: GEOMAGNETIC STORM (🌍) — CME, IPS, SW, Kp, MPC */}
              {/* ==================================================== */}
              {(activeTab === 'geomagnetic' || activeTab === 'gst') && (
                <div className="space-y-6">
                  
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Storms</span>
                      <div className="text-xl font-extrabold text-white">{data.storms.length}</div>
                      <span className="text-[11px] text-rose-600 font-medium">Disturbance intervals</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Max Planetary Kp</span>
                      <div className="text-xl font-extrabold text-rose-600">
                        {maxKp.toFixed(2)}
                      </div>
                      <span className="text-[11px] text-rose-600 font-medium">NOAA {threatLevel.gScale} Scale</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Average Kp Index</span>
                      <div className="text-xl font-extrabold text-slate-200">
                        {data.storms.length > 0 ? (data.storms.reduce((acc, s) => acc + s.maxKpIndex, 0) / data.storms.length).toFixed(2) : 0}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Baseline disturbance</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Major Storms (Kp &ge; 6)</span>
                      <div className="text-xl font-extrabold text-purple-400">
                        {data.storms.filter(s => s.maxKpIndex >= 6).length}
                      </div>
                      <span className="text-[11px] text-purple-400 font-medium">G2-G5 Significant Events</span>
                    </div>
                  </div>

                  {/* Primary Chart Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Planetary Kp Curve with Thresholds */}
                    <div className="clean-card p-6 lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600" /> Planetary Kp Disturbance Curve
                          </h3>
                          <p className="text-[11px] text-slate-400">Max observed Kp index across ground magnetometers with NOAA G1-G5 thresholds</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-400 border border-rose-800/60 font-medium font-mono">
                          ECharts Gradient
                        </span>
                      </div>
                      {data.storms.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No Storm events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getStormKpAreaChartOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>

                    {/* NOAA Storm Severity Distribution */}
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-rose-600" /> Storm Severity Tiers
                          </h3>
                          <p className="text-[11px] text-slate-400">Breakdown by NOAA Space Weather G-Scale</p>
                        </div>
                      </div>
                      {data.storms.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No Storm events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getStormSeverityDistributionOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Geomagnetic Multi-Source Phenomenon Timeline — CME, IPS, HSS/Wind, Kp, MPC */}
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-rose-400" /> Geomagnetic Multi-Source Timeline ⭐
                        </h3>
                        <p className="text-[11px] text-slate-400">CME speed, IPS shock, Solar-wind (HSS), Kp index, MPC — unified per-day timeline</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-950/70 text-rose-300 border border-rose-800/60 font-mono">Multi-Line</span>
                    </div>
                    <div className="h-80 w-full"><ReactECharts option={getGeomagneticMultiSourceOption()} style={{height:'100%', width:'100%'}} /></div>
                  </div>

                  {/* Extra timelines: MPC & HSS daily for Solar-Wind & MPC */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Magnet className="w-4 h-4 text-indigo-400" /> MPC Timeline Marker
                        </h3>
                        <p className="text-[11px] text-slate-400">Magnetopause crossing daily</p>
                      </div>
                      {(data.mpcs||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No MPC events.</div> : <div className="h-72 w-full"><ReactECharts option={getMpcTimelineOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Wind className="w-4 h-4 text-sky-400" /> Solar-Wind (HSS) Multi-Line
                        </h3>
                        <p className="text-[11px] text-slate-400">HSS per-day as solar-wind proxy</p>
                      </div>
                      {(data.hss||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No HSS events.</div> : <div className="h-72 w-full"><ReactECharts option={getHssTimelineOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                  </div>

                  {/* Data Table */}
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.storms);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70/80 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Geomagnetic Storm Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <span>Rows:</span>
                              <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold focus:outline-none">
                                <option value="5">5 rows</option>
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="all">All rows</option>
                              </select>
                            </div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-rose-600" /> Export JSON</button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900/80 backdrop-blur-sm text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                              <tr>
                                <th className="px-4 py-3">Storm ID</th>
                                <th className="px-4 py-3">Start Time</th>
                                <th className="px-4 py-3">Max Kp Index</th>
                                <th className="px-4 py-3">NOAA Rating</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {pageItems.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No Storm events.</td></tr>
                              ) : (
                                pageItems.map((storm, idx) => (
                                  <tr key={idx} className="hover:bg-rose-950/70/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-rose-400">{storm.stormID}</td>
                                    <td className="px-4 py-3 text-slate-300">{storm.startTime}</td>
                                    <td className="px-4 py-3 font-bold text-white">{storm.maxKpIndex.toFixed(2)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm ${
                                        storm.maxKpIndex >= 7 ? 'bg-red-950/70 text-red-300 border-red-800/60' :
                                        storm.maxKpIndex >= 5 ? 'bg-amber-950/70 text-amber-300 border-amber-800/60' :
                                        'bg-slate-800/80 text-slate-300 border-slate-700/60'
                                      }`}>
                                        {storm.maxKpIndex >= 9 ? 'G5 Extreme' :
                                         storm.maxKpIndex >= 8 ? 'G4 Severe' :
                                         storm.maxKpIndex >= 7 ? 'G3 Strong' :
                                         storm.maxKpIndex >= 6 ? 'G2 Moderate' :
                                         storm.maxKpIndex >= 5 ? 'G1 Minor' : 'G0 Normal'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {rowLimit !== 'all' && totalPages > 1 && (
                          <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages} ({totalItems} records)</span>
                            <div className="flex items-center gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 4: SEP (ENHANCED CHARTS & VISUALIZATIONS)        */}
              {/* ==================================================== */}
              {activeTab === 'sep' && (
                <div className="space-y-6">
                  
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total SEP Events</span>
                      <div className="text-xl font-extrabold text-white">{data.seps.length}</div>
                      <span className="text-[11px] text-purple-600 font-medium">Proton flux crossings</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">CME-Associated Events</span>
                      <div className="text-xl font-extrabold text-cyan-400">
                        {data.seps.filter(s => s.linkedCME).length}
                      </div>
                      <span className="text-[11px] text-cyan-400 font-medium">Direct plasma linkage</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Observing Sensors</span>
                      <div className="text-xl font-extrabold text-purple-400">
                        {new Set(data.seps.map(s => s.instrument)).size}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Distinct spacecraft detectors</span>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-purple-600" /> Sensor Instrument Detections
                        </h3>
                      </div>
                      {data.seps.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No SEP events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getSepInstrumentChartOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>

                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Zap className="w-4 h-4 text-cyan-400" /> CME Coronal Linkage Ratio
                        </h3>
                      </div>
                      {data.seps.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No SEP events.</div>
                      ) : (
                        <div className="h-80 w-full">
                          <ReactECharts option={getSepCmeLinkOption()} style={{ height: '100%', width: '100%' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEP Flux & Timing Visualizations per table */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" /> SEP Particle Flux Proxy (daily count)
                          </h3>
                          <p className="text-[11px] text-slate-400">Particle flux line chart ⭐ — daily SEP frequency as flux proxy</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-400 border border-purple-800/60 font-mono">ECharts Line</span>
                      </div>
                      {(data.seps||[]).length === 0 ? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No SEP events.</div> : <div className="h-72 w-full"><ReactECharts option={getSepFluxOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <LineChart className="w-4 h-4 text-amber-500" /> Flare → CME → SEP Timing
                          </h3>
                          <p className="text-[11px] text-slate-400">Event timeline ⭐ — causal chain across 3 feeds</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-mono">Multi-Bar</span>
                      </div>
                      <div className="h-72 w-full"><ReactECharts option={getFlareCmeSepTimelineOption()} style={{height:'100%', width:'100%'}} /></div>
                    </div>
                  </div>

                  {/* Data Table */}
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.seps);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70/80 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">SEP Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <span>Rows:</span>
                              <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold focus:outline-none">
                                <option value="5">5 rows</option>
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="all">All rows</option>
                              </select>
                            </div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-purple-600" /> Export JSON</button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900/80 backdrop-blur-sm text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                              <tr>
                                <th className="px-4 py-3">SEP ID</th>
                                <th className="px-4 py-3">Event Time</th>
                                <th className="px-4 py-3">Instrument</th>
                                <th className="px-4 py-3">Linked CME ID</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {pageItems.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No SEP events.</td></tr>
                              ) : (
                                pageItems.map((sep, idx) => (
                                  <tr key={idx} className="hover:bg-purple-950/70/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-purple-400">{sep.sepID}</td>
                                    <td className="px-4 py-3 text-slate-300">{sep.eventTime}</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-400 border border-purple-700/60 font-mono text-[11px]">{sep.instrument}</span></td>
                                    <td className="px-4 py-3 font-mono text-cyan-400">{sep.linkedCME || 'None'}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {rowLimit !== 'all' && totalPages > 1 && (
                          <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages} ({totalItems} records)</span>
                            <div className="flex items-center gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 5: IPS (ENHANCED CHARTS & VISUALIZATIONS)        */}
              {/* ==================================================== */}
              {activeTab === 'ips' && (
                <div className="space-y-6">
                  
                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total Interplanetary Shocks</span>
                      <div className="text-xl font-extrabold text-white">{data.ipss.length}</div>
                      <span className="text-[11px] text-cyan-400 font-medium">Shock wave arrivals</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">L1 Sentinel Fleet</span>
                      <div className="text-xl font-extrabold text-cyan-400">
                        {new Set(data.ipss.map(i => i.instrument)).size}
                      </div>
                      <span className="text-[11px] text-cyan-400 font-medium">Active detectors</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-card-sm space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Catalogs Surveyed</span>
                      <div className="text-xl font-extrabold text-slate-200">
                        {new Set(data.ipss.map(i => i.catalog)).size}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">Classification sources</span>
                    </div>
                  </div>

                  {/* Chart Row */}
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <BarChart2 className="w-4 h-4 text-cyan-400" /> Shock Crossings by Observing Spacecraft / Instrument
                        </h3>
                        <p className="text-[11px] text-slate-400">Distribution of interplanetary shock detections across observatory platforms</p>
                      </div>
                    </div>
                    {data.ipss.length === 0 ? (
                      <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No IPS events.</div>
                    ) : (
                      <div className="h-80 w-full">
                        <ReactECharts option={getIpsInstrumentChartOption()} style={{ height: '100%', width: '100%' }} />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> Shock Arrival Timeline ⭐
                          </h3>
                          <p className="text-[11px] text-slate-400">Timeline — daily IPS shock arrivals</p>
                        </div>
                      </div>
                      {(data.ipss||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No IPS events.</div> : <div className="h-72 w-full"><ReactECharts option={getIpsTimelineOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-emerald-400" /> Solar-wind Change Before vs After ⭐
                          </h3>
                          <p className="text-[11px] text-slate-400">IPS shocks + HSS — mid-interval split proxy</p>
                        </div>
                      </div>
                      <div className="h-72 w-full"><ReactECharts option={getIpsBeforeAfterOption()} style={{height:'100%', width:'100%'}} /></div>
                    </div>
                  </div>

                  {/* Data Table */}
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.ipss);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70/80 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">IPS Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <span>Rows:</span>
                              <select value={rowLimit} onChange={(e) => setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold focus:outline-none">
                                <option value="5">5 rows</option>
                                <option value="10">10 rows</option>
                                <option value="25">25 rows</option>
                                <option value="all">All rows</option>
                              </select>
                            </div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-cyan-400" /> Export JSON</button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead className="bg-slate-900/80 backdrop-blur-sm text-slate-300 uppercase text-[10px] font-semibold border-b border-slate-800">
                              <tr>
                                <th className="px-4 py-3">IPS Activity ID</th>
                                <th className="px-4 py-3">Event Time</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Catalog</th>
                                <th className="px-4 py-3">Instrument</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-200">
                              {pageItems.length === 0 ? (
                                <tr><td colSpan="5" className="px-4 py-8 text-center text-slate-400">No IPS events.</td></tr>
                              ) : (
                                pageItems.map((ips, idx) => (
                                  <tr key={idx} className="hover:bg-cyan-950/70/30 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{ips.ipsID}</td>
                                    <td className="px-4 py-3 text-slate-300">{ips.eventTime}</td>
                                    <td className="px-4 py-3 font-medium">{ips.location}</td>
                                    <td className="px-4 py-3 text-slate-400">{ips.catalog}</td>
                                    <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-700/60 font-medium font-mono text-[11px]">{ips.instrument}</span></td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {rowLimit !== 'all' && totalPages > 1 && (
                          <div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                            <span>Page {currentPage} of {totalPages} ({totalItems} records)</span>
                            <div className="flex items-center gap-2">
                              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ==================================================== */}
              {/* TAB 6: RBE (Radiation Belt Enhancement) 🛰️          */}
              {/* ==================================================== */}
              {activeTab === 'rbe' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total RBE Events</span>
                      <div className="text-xl font-extrabold text-white">{(data.rbes||[]).length}</div>
                      <span className="text-[11px] text-cyan-400 font-medium">Electron flux enhancements</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Max Kp (geomag context)</span>
                      <div className="text-xl font-extrabold text-rose-400">{maxKp.toFixed(2)}</div>
                      <span className="text-[11px] text-slate-400 font-medium">Kp-driven belt coupling</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Associated HSS</span>
                      <div className="text-xl font-extrabold text-sky-400">{(data.hss||[]).length}</div>
                      <span className="text-[11px] text-sky-400 font-medium">Solar-wind streams</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <Satellite className="w-4 h-4 text-cyan-400" /> Electron Flux Line Chart ⭐
                          </h3>
                          <p className="text-[11px] text-slate-400">RBE daily frequency as electron flux proxy + HSS context</p>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-mono">ECharts Line</span>
                      </div>
                      {(data.rbes||[]).length===0 ? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No RBE events.</div> : <div className="h-72 w-full"><ReactECharts option={getRbeFluxOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-400" /> Geomagnetic Kp Line
                          </h3>
                          <p className="text-[11px] text-slate-400">Kp index per storm — belt coupling driver</p>
                        </div>
                      </div>
                      {(data.storms||[]).length===0 ? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No storm data.</div> : <div className="h-72 w-full"><ReactECharts option={getStormKpAreaChartOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-sky-400" /> RBE + HSS + GST Multi-Line
                        </h3>
                        <p className="text-[11px] text-slate-400">Radiation belt enhancement vs solar-wind vs geomag</p>
                      </div>
                    </div>
                    <div className="h-72 w-full"><ReactECharts option={getHssRbeGstOption()} style={{height:'100%', width:'100%'}} /></div>
                  </div>
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.rbes || []);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">RBE Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300"><span>Rows:</span><select value={rowLimit} onChange={(e)=>setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold"><option value="5">5 rows</option><option value="10">10 rows</option><option value="25">25 rows</option><option value="all">All rows</option></select></div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-cyan-400" /> Export JSON</button>
                          </div>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-left font-sans text-xs"><thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800"><tr><th className="px-4 py-3">RBE ID</th><th className="px-4 py-3">Event Time</th><th className="px-4 py-3">Instrument</th><th className="px-4 py-3">Linked Events</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-200">{pageItems.length===0? <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No RBE events.</td></tr> : pageItems.map((rbe,idx)=>(<tr key={idx} className="hover:bg-cyan-950/30"><td className="px-4 py-3 font-mono font-bold text-cyan-400">{rbe.rbeID}</td><td className="px-4 py-3 text-slate-300">{rbe.eventTime}</td><td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-700/60 font-mono text-[11px]">{rbe.instrument}</span></td><td className="px-4 py-3 font-mono text-[11px] text-slate-400">{rbe.linkedEvents?.join?.(', ') || rbe.linkedEvents || 'None'}</td></tr>))}</tbody></table></div>
                        {rowLimit!=='all' && totalPages>1 && (<div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300"><span>Page {currentPage} of {totalPages} ({totalItems} records)</span><div className="flex items-center gap-2"><button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>)}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* HSS — High-Speed Solar-Wind Stream 💨 */}
              {activeTab === 'hss' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total HSS Events</span>
                      <div className="text-xl font-extrabold text-white">{(data.hss||[]).length}</div>
                      <span className="text-[11px] text-sky-400 font-medium">High-speed streams</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Associated RBE</span>
                      <div className="text-xl font-extrabold text-cyan-400">{(data.rbes||[]).length}</div>
                      <span className="text-[11px] text-cyan-400 font-medium">Belt enhancements</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Geomagnetic Response</span>
                      <div className="text-xl font-extrabold text-rose-400">{maxKp.toFixed(1)} Kp</div>
                      <span className="text-[11px] text-slate-400 font-medium">Peak storm</span>
                    </div>
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Wind className="w-4 h-4 text-sky-400" /> HSS Speed vs Time Line ⭐
                        </h3>
                        <p className="text-[11px] text-slate-400">Solar-wind speed proxy — daily HSS frequency</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-950/70 text-sky-400 border border-sky-800/60 font-mono">Line</span>
                    </div>
                    {(data.hss||[]).length===0? <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No HSS events.</div> : <div className="h-80 w-full"><ReactECharts option={getHssTimelineOption()} style={{height:'100%', width:'100%'}} /></div>}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-400" /> Kp Geomagnetic Response Line
                        </h3>
                        <p className="text-[11px] text-slate-400">Kp per storm</p>
                      </div>
                      {(data.storms||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No storms.</div> : <div className="h-72 w-full"><ReactECharts option={getStormKpAreaChartOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                    <div className="clean-card p-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Satellite className="w-4 h-4 text-cyan-400" /> RBE Electron Flux Time Series
                        </h3>
                        <p className="text-[11px] text-slate-400">Daily RBE proxy</p>
                      </div>
                      {(data.rbes||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No RBE.</div> : <div className="h-72 w-full"><ReactECharts option={getRbeFluxOption()} style={{height:'100%', width:'100%'}} /></div>}
                    </div>
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" /> HSS + RBE + GST Combined
                      </h3>
                      <p className="text-[11px] text-slate-400">Wind stream vs belt vs storm multi-line</p>
                    </div>
                    <div className="h-72 w-full"><ReactECharts option={getHssRbeGstOption()} style={{height:'100%', width:'100%'}} /></div>
                  </div>
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.hss || []);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">HSS Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300"><span>Rows:</span><select value={rowLimit} onChange={(e)=>setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold"><option value="5">5 rows</option><option value="10">10 rows</option><option value="25">25 rows</option><option value="all">All rows</option></select></div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-sky-400" /> Export JSON</button>
                          </div>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-left font-sans text-xs"><thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800"><tr><th className="px-4 py-3">HSS ID</th><th className="px-4 py-3">Event Time</th><th className="px-4 py-3">Instrument(s)</th><th className="px-4 py-3">Linked Events</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-200">{pageItems.length===0? <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No HSS events.</td></tr> : pageItems.map((h,idx)=>(<tr key={idx} className="hover:bg-sky-950/30"><td className="px-4 py-3 font-mono font-bold text-sky-400">{h.hssID}</td><td className="px-4 py-3 text-slate-300">{h.eventTime}</td><td className="px-4 py-3 text-[11px] font-mono text-slate-400">{h.instrument}</td><td className="px-4 py-3 font-mono text-[11px] text-slate-400">{h.linkedEvents?.join?.(', ') || h.linkedEvents || 'None'}</td></tr>))}</tbody></table></div>
                        {rowLimit!=='all' && totalPages>1 && (<div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300"><span>Page {currentPage} of {totalPages} ({totalItems} records)</span><div className="flex items-center gap-2"><button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>)}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* MPC — Magnetopause Disturbance 🧲 */}
              {activeTab === 'mpc' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Total MPC Events</span>
                      <div className="text-xl font-extrabold text-white">{(data.mpcs||[]).length}</div>
                      <span className="text-[11px] text-indigo-400 font-medium">Crossings</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Solar-Wind Streams</span>
                      <div className="text-xl font-extrabold text-sky-400">{(data.hss||[]).length}</div>
                      <span className="text-[11px] text-sky-400 font-medium">HSS proxy for wind</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Geomag K p</span>
                      <div className="text-xl font-extrabold text-rose-400">{maxKp.toFixed(1)}</div>
                      <span className="text-[11px] text-slate-400 font-medium">Peak Kp</span>
                    </div>
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Magnet className="w-4 h-4 text-indigo-400" /> MPC Crossing Timeline
                        </h3>
                        <p className="text-[11px] text-slate-400">Magnetopause disturbance per-day — timeline marker</p>
                      </div>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-mono">Timeline</span>
                    </div>
                    {(data.mpcs||[]).length===0? <div className="h-80 flex items-center justify-center text-slate-400 text-xs">No MPC events.</div> : <div className="h-80 w-full"><ReactECharts option={getMpcTimelineOption()} style={{height:'100%', width:'100%'}} /></div>}
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                          <Wind className="w-4 h-4 text-sky-400" /> Solar-Wind Conditions Multi-Line
                        </h3>
                        <p className="text-[11px] text-slate-400">MPC vs HSS vs GST — wind pressure proxy</p>
                      </div>
                    </div>
                    <div className="h-80 w-full"><ReactECharts option={getMpcHssGstOption()} style={{height:'100%', width:'100%'}} /></div>
                  </div>
                  <div className="clean-card p-6 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h3 className="font-sans text-sm font-bold text-white flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-indigo-400" /> Geomagnetic Kp Line
                      </h3>
                      <p className="text-[11px] text-slate-400">Kp per storm — magnetopause coupling</p>
                    </div>
                    {(data.storms||[]).length===0? <div className="h-72 flex items-center justify-center text-slate-400 text-xs">No storms.</div> : <div className="h-72 w-full"><ReactECharts option={getStormKpAreaChartOption()} style={{height:'100%', width:'100%'}} /></div>}
                  </div>
                  {(() => {
                    const { pageItems, totalItems, totalPages } = paginateArray(data.mpcs || []);
                    return (
                      <div className="clean-card overflow-hidden">
                        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">MPC Records ({totalItems})</h3>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300"><span>Rows:</span><select value={rowLimit} onChange={(e)=>setRowLimit(e.target.value)} className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold"><option value="5">5 rows</option><option value="10">10 rows</option><option value="25">25 rows</option><option value="all">All rows</option></select></div>
                            <button onClick={handleExportJSON} className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1"><Download className="w-3.5 h-3.5 text-indigo-400" /> Export JSON</button>
                          </div>
                        </div>
                        <div className="overflow-x-auto"><table className="w-full text-left font-sans text-xs"><thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800"><tr><th className="px-4 py-3">MPC ID</th><th className="px-4 py-3">Event Time</th><th className="px-4 py-3">Instrument</th><th className="px-4 py-3">Linked Events</th></tr></thead><tbody className="divide-y divide-slate-800 text-slate-200">{pageItems.length===0? <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-400">No MPC events.</td></tr> : pageItems.map((m,idx)=>(<tr key={idx} className="hover:bg-indigo-950/30"><td className="px-4 py-3 font-mono font-bold text-indigo-400">{m.mpcID}</td><td className="px-4 py-3 text-slate-300">{m.eventTime}</td><td className="px-4 py-3 font-mono text-[11px] text-slate-400">{m.instrument}</td><td className="px-4 py-3 font-mono text-[11px] text-slate-400">{m.linkedEvents?.join?.(', ') || m.linkedEvents || 'None'}</td></tr>))}</tbody></table></div>
                        {rowLimit!=='all' && totalPages>1 && (<div className="p-3 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300"><span>Page {currentPage} of {totalPages} ({totalItems} records)</span><div className="flex items-center gap-2"><button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button><button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button></div></div>)}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}
        </>
      )}

    </div>
  );
}
