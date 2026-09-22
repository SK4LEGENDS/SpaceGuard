/**
 * SpaceGuard NASA DONKI Live API Integration Service
 * Fetches real-time space weather telemetry directly from NASA Open Web Gateway across 9 endpoints:
 * 1. CME (Coronal Mass Ejection) - cmeAnalyses + WSAEnlil
 * 2. FLR (Solar Flare)
 * 3. GST (Geomagnetic Storm) - Kp index time-series
 * 4. SEP (Solar Energetic Particles)
 * 5. IPS (Interplanetary Shock)
 * 6. MPC (Magnetopause Crossing)
 * 7. RBE (Radiation Belt Enhancement)
 * 8. HSS (High-Speed Stream / Solar Wind)
 * 9. WSAEnlilSimulations (WSA-ENLIL heliospheric prediction)
 */

const BASE_URL_NASA = 'https://api.nasa.gov/DONKI';

// Helper to format date YYYY-MM-DD
export function getFormattedDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// Default initial date range (past 30 days)
export const DEFAULT_START_DATE = getFormattedDate(-30);
export const DEFAULT_END_DATE = getFormattedDate(0);

/**
 * Resolve effective NASA API Key from argument, env variable, or localStorage
 */
export function getEffectiveApiKey(userKey) {
  if (userKey && userKey !== 'DEMO_KEY') return userKey;
  const envKey = import.meta.env.VITE_NASA_API_KEY;
  if (envKey && envKey.trim() !== '') return envKey.trim();
  const localKey = localStorage.getItem('nasa_donki_api_key');
  if (localKey && localKey !== 'DEMO_KEY') return localKey;
  return userKey || 'DEMO_KEY';
}

/**
 * Generic fetch wrapper with error handling for NASA API Key limits
 */
async function fetchDonkiEndpoint(endpoint, startDate, endDate, apiKey) {
  const keyToUse = getEffectiveApiKey(apiKey);
  const url = `${BASE_URL_NASA}/${endpoint}?startDate=${startDate}&endDate=${endDate}&api_key=${keyToUse}`;
  
  const res = await fetch(url);
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.error)) {
    const errorObj = data && data.error ? data.error : {};
    const code = errorObj.code || `HTTP ${res.status}`;
    const msg = errorObj.message || res.statusText || 'NASA API Request Failed';
    
    if (code === 'OVER_RATE_LIMIT' || res.status === 429) {
      throw new Error(`NASA API Key Rate Limit Exceeded (Active Key: ${keyToUse === 'DEMO_KEY' ? 'DEMO_KEY' : keyToUse.substring(0, 6) + '...'}). Please paste your valid NASA API Key in the Header (free from api.nasa.gov).`);
    }
    if (res.status === 403) {
      throw new Error(`Invalid NASA API Key (${keyToUse}). Please check your key credentials.`);
    }
    throw new Error(`NASA DONKI ${endpoint} API Error: ${msg} (${code})`);
  }

  if (!Array.isArray(data)) return [];
  return data;
}

/**
 * Fetch CME Data from NASA DONKI Live API
 * Extended with latitude/longitude/arrivalTime for Earth-directed 2D plots and WSA-ENLIL
 */
export async function fetchCMEData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('CME', startDate, endDate, apiKey);
  return data.map(cme => {
    const analyses = cme.cmeAnalyses || [];
    const mostAccurate = analyses.find(a => a.isMostAccurate === true) || analyses[0] || {};
    // Extract WSA-ENLIL estimated shock arrival if present on this CME's enlilList
    let enlilArrival = null;
    let isEarthGB = null;
    if (mostAccurate.enlilList && mostAccurate.enlilList.length > 0) {
      const earthImpact = mostAccurate.enlilList.find(e => e.isEarthGB) || mostAccurate.enlilList[0];
      enlilArrival = earthImpact.estimatedShockArrivalTime || null;
      isEarthGB = !!earthImpact.isEarthGB;
    }
    return {
      activityID: cme.activityID || 'N/A',
      startTime: cme.startTime || 'N/A',
      sourceLocation: cme.sourceLocation || 'Unknown',
      speed: mostAccurate.speed ? Math.round(mostAccurate.speed) : 0,
      halfAngle: mostAccurate.halfAngle ? Math.round(mostAccurate.halfAngle) : 0,
      cmeType: mostAccurate.type || 'Unknown',
      latitude: mostAccurate.latitude ?? null,
      longitude: mostAccurate.longitude ?? null,
      note: cme.note || '',
      linkedEvents: (cme.linkedEvents || []).map(e => e.activityID).filter(Boolean),
      enlilArrival,
      isEarthGB
    };
  });
}

/**
 * Fetch Solar Flare (FLR) Data from NASA DONKI Live API
 */
export async function fetchFlareData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('FLR', startDate, endDate, apiKey);
  return data.map(flare => ({
    flareID: flare.flrID || flare.activityID || 'N/A',
    beginTime: flare.beginTime || 'N/A',
    peakTime: flare.peakTime || 'N/A',
    classType: flare.classType || 'Unknown',
    sourceLocation: flare.sourceLocation || 'Unknown'
  }));
}

/**
 * Fetch Geomagnetic Storm (GST) Data from NASA DONKI Live API
 */
export async function fetchStormData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('GST', startDate, endDate, apiKey);
  return data.map(storm => {
    const kpArr = storm.allKpIndex || [];
    const maxKp = kpArr.length > 0 ? Math.max(...kpArr.map(k => k.kpIndex || 0)) : 0;
    return {
      stormID: storm.gstID || 'N/A',
      startTime: storm.startTime || 'N/A',
      maxKpIndex: Number(maxKp.toFixed(2))
    };
  });
}

/**
 * Fetch SEP (Solar Energetic Particles) Data from NASA DONKI Live API
 */
export async function fetchSEPData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('SEP', startDate, endDate, apiKey);
  return data.map(sep => {
    const inst = sep.instruments && sep.instruments.length > 0 ? sep.instruments[0].displayName : 'Unknown';
    const linked = sep.linkedEvents && sep.linkedEvents.length > 0 ? sep.linkedEvents[0].activityID : '';
    return {
      sepID: sep.sepID || sep.activityID || 'N/A',
      eventTime: sep.eventTime || 'N/A',
      instrument: inst,
      linkedCME: linked
    };
  });
}

/**
 * Fetch IPS (Interplanetary Shock) Data from NASA DONKI Live API
 */
export async function fetchIPSData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('IPS', startDate, endDate, apiKey);
  return data.map(ips => {
    const inst = ips.instruments && ips.instruments.length > 0 ? ips.instruments[0].displayName : 'Unknown';
    return {
      ipsID: ips.activityID || ips.ipsID || 'N/A',
      eventTime: ips.eventTime || 'N/A',
      location: ips.location || 'Unknown',
      catalog: ips.catalog || 'DONKI Catalog',
      instrument: inst,
      linkedEvents: (ips.linkedEvents || []).map(e => e.activityID).filter(Boolean)
    };
  });
}

/**
 * Fetch MPC (Magnetopause Crossing) Data from NASA DONKI Live API
 */
export async function fetchMPCData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('MPC', startDate, endDate, apiKey);
  return data.map(mpc => {
    const inst = mpc.instruments && mpc.instruments.length > 0 ? mpc.instruments[0].displayName : 'Unknown';
    return {
      mpcID: mpc.mpcID || mpc.activityID || 'N/A',
      eventTime: mpc.eventTime || 'N/A',
      instrument: inst,
      linkedEvents: (mpc.linkedEvents || []).map(e => e.activityID).filter(Boolean),
      link: mpc.link || ''
    };
  });
}

/**
 * Fetch RBE (Radiation Belt Enhancement) Data from NASA DONKI Live API
 */
export async function fetchRBEData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('RBE', startDate, endDate, apiKey);
  return data.map(rbe => {
    const inst = rbe.instruments && rbe.instruments.length > 0 ? rbe.instruments[0].displayName : 'Unknown';
    return {
      rbeID: rbe.rbeID || rbe.activityID || 'N/A',
      eventTime: rbe.eventTime || 'N/A',
      instrument: inst,
      linkedEvents: (rbe.linkedEvents || []).map(e => e.activityID).filter(Boolean),
      link: rbe.link || ''
    };
  });
}

/**
 * Fetch HSS (High-Speed Stream) Data from NASA DONKI Live API
 */
export async function fetchHSSData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('HSS', startDate, endDate, apiKey);
  return data.map(hss => {
    const insts = (hss.instruments || []).map(i => i.displayName).filter(Boolean);
    return {
      hssID: hss.hssID || hss.activityID || 'N/A',
      eventTime: hss.eventTime || 'N/A',
      instrument: insts.length > 0 ? insts.join(', ') : 'Unknown',
      instruments: insts,
      linkedEvents: (hss.linkedEvents || []).map(e => e.activityID).filter(Boolean),
      link: hss.link || ''
    };
  });
}

/**
 * Fetch WSA-ENLIL Simulation Data from NASA DONKI Live API
 * Flattened per cmeInput for charting: one record per CME-input with Earth-impact prediction
 */
export async function fetchWSAEnlilData(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const data = await fetchDonkiEndpoint('WSAEnlilSimulations', startDate, endDate, apiKey);
  const flat = [];
  data.forEach(sim => {
    const inputs = sim.cmeInputs || [];
    if (inputs.length === 0) {
      flat.push({
        simulationID: sim.simulationID || 'N/A',
        modelCompletionTime: sim.modelCompletionTime || 'N/A',
        estimatedShockArrivalTime: sim.estimatedShockArrivalTime || null,
        isEarthGB: !!sim.isEarthGB,
        isEarthMinorImpact: !!sim.isEarthMinorImpact,
        rmin_re: sim.rmin_re ?? null,
        kp90: sim.kp_90 ?? null,
        kp135: sim.kp_135 ?? null,
        kp180: sim.kp_180 ?? null,
        au: sim.au ?? null,
        cmeID: null,
        latitude: null,
        longitude: null,
        speed: null,
        halfAngle: null,
        link: sim.link || ''
      });
    } else {
      inputs.forEach(inp => {
        flat.push({
          simulationID: sim.simulationID || 'N/A',
          modelCompletionTime: sim.modelCompletionTime || 'N/A',
          estimatedShockArrivalTime: sim.estimatedShockArrivalTime || null,
          estimatedDuration: sim.estimatedDuration ?? null,
          isEarthGB: !!sim.isEarthGB,
          isEarthMinorImpact: !!sim.isEarthMinorImpact,
          rmin_re: sim.rmin_re ?? null,
          kp90: sim.kp_90 ?? null,
          kp135: sim.kp_135 ?? null,
          kp180: sim.kp_180 ?? null,
          au: sim.au ?? null,
          cmeID: inp.cmeid || inp.cmeID || null,
          latitude: inp.latitude ?? null,
          longitude: inp.longitude ?? null,
          speed: inp.speed ? Math.round(inp.speed) : null,
          halfAngle: inp.halfAngle ? Math.round(inp.halfAngle) : null,
          featureCode: inp.featureCode || '',
          isMostAccurate: !!inp.isMostAccurate,
          link: sim.link || ''
        });
      });
    }
  });
  return flat;
}

/**
 * Aggregate All 9 Telemetry Datasets via Promise.allSettled for maximum fault-tolerance
 * Maps 1:1 to the 8 phenomena table (plus underlying CME/FLR/GST/SEP/IPS + MPC/RBE/HSS/WSA-ENLIL)
 */
export async function fetchAllSpaceWeather(startDate = DEFAULT_START_DATE, endDate = DEFAULT_END_DATE, apiKey = 'DEMO_KEY') {
  const effectiveKey = getEffectiveApiKey(apiKey);
  const results = await Promise.allSettled([
    fetchCMEData(startDate, endDate, effectiveKey),
    fetchFlareData(startDate, endDate, effectiveKey),
    fetchStormData(startDate, endDate, effectiveKey),
    fetchSEPData(startDate, endDate, effectiveKey),
    fetchIPSData(startDate, endDate, effectiveKey),
    fetchMPCData(startDate, endDate, effectiveKey),
    fetchRBEData(startDate, endDate, effectiveKey),
    fetchHSSData(startDate, endDate, effectiveKey),
    fetchWSAEnlilData(startDate, endDate, effectiveKey)
  ]);

  // Check if any rejected due to API errors
  const rejected = results.find(r => r.status === 'rejected');
  if (rejected && results.every(r => r.status === 'rejected')) {
    throw new Error(rejected.reason.message);
  }

  return {
    cmes: results[0].status === 'fulfilled' ? results[0].value : [],
    flares: results[1].status === 'fulfilled' ? results[1].value : [],
    storms: results[2].status === 'fulfilled' ? results[2].value : [],
    seps: results[3].status === 'fulfilled' ? results[3].value : [],
    ipss: results[4].status === 'fulfilled' ? results[4].value : [],
    mpcs: results[5].status === 'fulfilled' ? results[5].value : [],
    rbes: results[6].status === 'fulfilled' ? results[6].value : [],
    hss: results[7].status === 'fulfilled' ? results[7].value : [],
    wes: results[8].status === 'fulfilled' ? results[8].value : [],
    errorMsg: rejected ? rejected.reason.message : null
  };
}
