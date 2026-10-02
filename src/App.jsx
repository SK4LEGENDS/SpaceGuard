import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import MissionControlPage from './components/MissionControlPage';
import EventTimelinePage from './components/EventTimelinePage';
import TechnicalDocsPage from './components/TechnicalDocsPage';
import SettingsPage from './components/SettingsPage';
import GalaxyBackground from './components/GalaxyBackground';
import ChatbotSidebar from './components/ChatbotSidebar';
import { getEffectiveApiKey, DEFAULT_START_DATE, DEFAULT_END_DATE } from './services/donkiApi';
import { buildMissionControlStatus } from './services/telemetryAnalysis';

export default function App() {
  // The app always boots into the Landing / Overview page. All other views
  // (Dashboard, Mission Control, Timeline, Docs, Settings) are reached via
  // Header nav, Landing CTAs, Footer links or the ORBIT copilot.
  const [currentView, setCurrentView] = useState('landing');
  const [apiKey, setApiKey] = useState(() => getEffectiveApiKey('DEMO_KEY'));

  // ORBIT AI API Key (OpenRouter, model openrouter/free → auto free model)
  // Supports: prop state -> localStorage -> Vite env (VITE_OPENROUTER_API_KEY) for your fed key
  const getInitialOrbitKey = () => {
    const ls = localStorage.getItem('openrouter_api_key');
    if (ls && ls.trim().length > 10) return ls.trim();
    const env = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (env && env.trim().length > 10) return env.trim();
    return '';
  };
  const [openRouterApiKey, setOpenRouterApiKey] = useState(() => getInitialOrbitKey());

  // Lifted Dashboard Telemetry State to persist across navigation tabs
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const [activeTelemetryTab, setActiveTelemetryTab] = useState('geomagnetic');
  const [hasQueried, setHasQueried] = useState(false);
  const [dataOrigin, setDataOrigin] = useState('api');
  // Cross-view query trigger: Mission Control / Event Timeline can ask the
  // Dashboard to (re)load telemetry without owning the fetch logic themselves.
  const [queryNonce, setQueryNonce] = useState(0);
  const requestQuery = () => setQueryNonce((n) => n + 1);

  // ORBIT visibility is app-level so the copilot is reachable from the Main
  // Dashboard *and* Mission Control, and its open state + conversation survive
  // navigation between views (a single mounted instance, not one per page).
  const [isOrbitOpen, setIsOrbitOpen] = useState(false);
  const toggleOrbit = () => setIsOrbitOpen((v) => !v);

  // ORBIT visualization assistance — lets the copilot actually move the user to
  // the view/tab that answers their question, rather than only naming a chart.
  // Defined here (not inside the sidebar) so it can reach both the view router
  // and the dashboard's active-tab state.
  const orbitNavigate = useCallback((view, tab) => {
    if (view === 'dashboard') {
      setCurrentView('dashboard');
      if (tab) setActiveTelemetryTab(tab);
    } else if (view) {
      setCurrentView(view);
    }
  }, []);
  const [sqliteCounts, setSqliteCounts] = useState({ cmes: 0, flares: 0, storms: 0, seps: 0, ipss: 0, mpcs: 0, rbes: 0, hss: 0, wes: 0, queries: 0 });
  const [telemetryData, setTelemetryData] = useState({
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

  // Threat summary for ORBIT's status strip + reasoning context. Derived from
  // the same analysis engine Mission Control uses, so the copilot and the
  // dashboard never disagree about the current situation.
  const orbitMaxKp = useMemo(
    () => buildMissionControlStatus(telemetryData, startDate, endDate).maxKp,
    [telemetryData, startDate, endDate]
  );
  const orbitThreat = useMemo(() => {
    const s = buildMissionControlStatus(telemetryData, startDate, endDate);
    return {
      level: s.overall.label,
      gScale: s.gScale,
      color: s.overall.status === 'critical' ? 'text-red-300' : s.overall.status === 'elevated' ? 'text-amber-300' : 'text-cyan-300',
      bg: s.overall.status === 'critical' ? 'bg-red-950/80' : s.overall.status === 'elevated' ? 'bg-amber-950/80' : 'bg-cyan-950/80'
    };
  }, [telemetryData, startDate, endDate]);

  useEffect(() => {
    const effective = getEffectiveApiKey(apiKey);
    if (effective !== apiKey) {
      setApiKey(effective);
    }
    // Hydrate ORBIT key if fed via .env after first render or via localStorage externally
    const ls = localStorage.getItem('openrouter_api_key');
    const env = import.meta.env.VITE_OPENROUTER_API_KEY;
    const effectiveOrbit = (ls && ls.trim().length > 10 ? ls.trim() : (env && env.trim().length > 10 ? env.trim() : ''));
    if (effectiveOrbit && effectiveOrbit !== openRouterApiKey) {
      setOpenRouterApiKey(effectiveOrbit);
    }
    // Apply Settings prefs globally — theme, galaxy, font, motion (no backend touch)
    try {
      const raw = localStorage.getItem('sg_prefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p.theme) document.documentElement.setAttribute('data-theme', p.theme);
        if (p.reduceMotion !== undefined) document.documentElement.setAttribute('data-reduce-motion', p.reduceMotion ? '1' : '0');
        if (p.fontScale) document.documentElement.style.setProperty('--sg-font-scale', `${p.fontScale}%`);
        if (p.galaxyIntensity !== undefined) document.documentElement.style.setProperty('--sg-galaxy-intensity', `${p.galaxyIntensity}%`);
        if (p.galaxyEnabled !== undefined) document.documentElement.style.setProperty('--sg-galaxy-enabled', p.galaxyEnabled ? '1' : '0');
        document.documentElement.setAttribute('data-galaxy-enabled', p.galaxyEnabled ? '1' : '0');
        if (p.defaultTab) setActiveTelemetryTab(p.defaultTab);
        // currentView intentionally NOT restored from prefs — the landing
        // page is always the entry point on a fresh launch.
      }
    } catch {}
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      
      {/* Interactive Galaxy Particles & Deep Space Cosmic Canvas */}
      <GalaxyBackground />

      {/* ORBIT — AI Space Weather Intelligence Copilot.
          Mounted once at app level (not per page) so it is available on the
          Main Dashboard, Mission Control, the Event Timeline and beyond, and
          the conversation persists while the user navigates.
          Key managed via Settings → ORBIT. */}
      <ChatbotSidebar
        data={telemetryData}
        startDate={startDate}
        endDate={endDate}
        hasQueried={hasQueried}
        threatLevel={orbitThreat}
        maxKp={orbitMaxKp}
        dataOrigin={dataOrigin}
        sqliteCounts={sqliteCounts}
        isOpen={isOrbitOpen}
        setIsOpen={setIsOrbitOpen}
        openRouterApiKey={openRouterApiKey}
        onNavigate={orbitNavigate}
      />

      {/* Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        apiKey={apiKey}
        setApiKey={setApiKey}
      />

      {/* Main Page Container (No Sidebars) */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {currentView === 'landing' && (
          <LandingPage setCurrentView={setCurrentView} />
        )}

        <div className={currentView === 'dashboard' ? 'block' : 'hidden'}>
          <DashboardPage
            apiKey={apiKey}
            data={telemetryData}
            setData={setTelemetryData}
            hasQueried={hasQueried}
            setHasQueried={setHasQueried}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            activeTab={activeTelemetryTab}
            setActiveTab={setActiveTelemetryTab}
            dataOrigin={dataOrigin}
            setDataOrigin={setDataOrigin}
            sqliteCounts={sqliteCounts}
            setSqliteCounts={setSqliteCounts}
            openRouterApiKey={openRouterApiKey}
            setOpenRouterApiKey={setOpenRouterApiKey}
            queryNonce={queryNonce}
            isOrbitOpen={isOrbitOpen}
            toggleOrbit={toggleOrbit}
          />
        </div>

        {currentView === 'mission-control' && (
          <MissionControlPage
            data={telemetryData}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            hasQueried={hasQueried}
            dataOrigin={dataOrigin}
            sqliteCounts={sqliteCounts}
            onQuery={requestQuery}
            onOpenTimeline={() => setCurrentView('timeline')}
            isOrbitOpen={isOrbitOpen}
            toggleOrbit={toggleOrbit}
          />
        )}

        {currentView === 'timeline' && (
          <EventTimelinePage
            data={telemetryData}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            hasQueried={hasQueried}
            onQuery={requestQuery}
            onOpenMissionControl={() => setCurrentView('mission-control')}
            isOrbitOpen={isOrbitOpen}
            toggleOrbit={toggleOrbit}
          />
        )}

        {currentView === 'docs' && (
          <TechnicalDocsPage />
        )}

        {currentView === 'settings' && (
          <SettingsPage
            apiKey={apiKey}
            setApiKey={setApiKey}
            openRouterApiKey={openRouterApiKey}
            setOpenRouterApiKey={setOpenRouterApiKey}
          />
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

    </div>
  );
}
