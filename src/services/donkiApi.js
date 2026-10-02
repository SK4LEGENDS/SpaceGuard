/**
 * SpaceGuard NASA DONKI Live API Integration Service
 *
 * Base URL: the official CCMC DONKI public Data API.
 * NOTE: the legacy hosts `api.nasa.gov/DONKI/*` and
 * `kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/*` were retired on 2026-09-30 and now
 * 301-redirect to a static news page with no CORS headers, which surfaces in the
 * browser as a CORS failure rather than a 404. This endpoint needs no api_key.
 *
 * Fetches real-time space weather telemetry directly from NASA CCMC across 9 endpoints:
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

const BASE_URL_NASA = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get';

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
 * Resolve a NASA API key from argument, env variable, or localStorage.
 *
 * Legacy: the current DONKI public Data API is unauthenticated, so this key is
 * no longer sent on the wire. It is retained so the Header / Settings key UI
 * and the stored preference keep working without changes.
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
 * Helper to generate date chunks to avoid NASA API 400 errors on large ranges.
 * NASA API typically limits requests to ~30-60 days.
 */
function getDateChunks(startDate, endDate, chunkSizeDays = 30) {
  const chunks = [];
  let currentStart = new Date(startDate);
  const finalEnd = new Date(endDate);

  while (currentStart <= finalEnd) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + chunkSizeDays);
    if (currentEnd > finalEnd) currentEnd = finalEnd;

    chunks.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0]
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  return chunks;
}

/**
 * Generic fetch wrapper with automatic date chunking for large ranges.
 */
async function fetchDonkiEndpoint(endpoint, startDate, endDate, apiKey) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);

  // If range is > 30 days, chunk it to prevent HTTP 400
  if (diffDays > 30) {
    const chunks = getDateChunks(startDate, endDate);
    const chunkPromises = chunks.map(async (chunk) => {
      const url = `${BASE_URL_NASA}/${endpoint}?startDate=${encodeURIComponent(chunk.start)}&endDate=${encodeURIComponent(chunk.end)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json().catch(() => []);
    });

    const results = await Promise.all(chunkPromises);
    const flatData = results.flat();
    
    if (!Array.isArray(flatData)) return [];
    return flatData;
  }

  // Single request for small ranges
  const url = `${BASE_URL_NASA}/${endpoint}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  let res;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`NASA DONKI ${endpoint} request failed (network/CORS): ${err.message}. Check connectivity to ${BASE_URL_NASA}.`);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.error)) {
    const errorObj = data && data.error ? data.error : {};
    const code = errorObj.code || `HTTP ${res.status}`;
    const msg = errorObj.message || res.statusText || 'NASA API Request Failed';

    if (res.status === 429 || code === 'OVER_RATE_LIMIT') {
      throw new Error(`NASA DONKI ${endpoint} rate limit exceeded (HTTP 429). Wait a moment and retry — the public API limits requests per minute.`);
    }
    if (res.status === 400) {
      throw new Error(`NASA DONKI ${endpoint} rejected the date range ${startDate} → ${endDate} (HTTP 400). Start date must be on or before end date.`);
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
