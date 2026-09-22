import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';
import TechnicalDocsPage from './components/TechnicalDocsPage';
import SettingsPage from './components/SettingsPage';
import GalaxyBackground from './components/GalaxyBackground';
import { getEffectiveApiKey, DEFAULT_START_DATE, DEFAULT_END_DATE } from './services/donkiApi';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
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
        if (p.defaultTab && currentView === 'dashboard') setActiveTelemetryTab(p.defaultTab);
        if (p.startupView && p.startupView !== currentView) {
          // only apply on first load if user set landing vs dashboard
          if (['landing','dashboard'].includes(p.startupView)) setCurrentView(p.startupView);
        }
      }
    } catch {}
  }, []);

  return (
    <div className="relative min-h-screen bg-transparent flex flex-col font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      
      {/* Interactive Galaxy Particles & Deep Space Cosmic Canvas */}
      <GalaxyBackground />

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
          />
        </div>

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
