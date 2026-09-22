import initSqlJs from 'sql.js';
import sqlWasm from 'sql.js/dist/sql-wasm.wasm?url';

let db = null;
let sqlPromise = null;

/**
 * Initialize SQLite database engine locally using Vite WASM asset loader
 */
export async function initSQLite() {
  if (db) return db;

  try {
    if (!sqlPromise) {
      sqlPromise = initSqlJs({
        locateFile: () => sqlWasm
      });
    }

    const SQL = await sqlPromise;
    db = new SQL.Database();

    // Create 9 tables matching Scala V9.scala SQLite schema DDLs + Query Cache table
    // Extended for MPC, RBE, HSS, WSA-ENLIL to support 8-phenomena dashboard
    db.run(`
      CREATE TABLE IF NOT EXISTS cme_events (
        activity_id TEXT PRIMARY KEY,
        start_time TEXT,
        source_location TEXT,
        speed INTEGER,
        half_angle INTEGER,
        cme_type TEXT,
        latitude REAL,
        longitude REAL,
        linked_events TEXT,
        enlil_arrival TEXT,
        is_earth_gb INTEGER
      );

      CREATE TABLE IF NOT EXISTS solar_flare_events (
        flare_id TEXT PRIMARY KEY,
        begin_time TEXT,
        peak_time TEXT,
        class_type TEXT,
        source_location TEXT
      );

      CREATE TABLE IF NOT EXISTS geomagnetic_storm_events (
        storm_id TEXT PRIMARY KEY,
        start_time TEXT,
        max_kp_index REAL
      );

      CREATE TABLE IF NOT EXISTS sep_events (
        sep_id TEXT PRIMARY KEY,
        event_time TEXT,
        instrument TEXT,
        linked_cme TEXT
      );

      CREATE TABLE IF NOT EXISTS ips_events (
        ips_id TEXT PRIMARY KEY,
        event_time TEXT,
        location TEXT,
        catalog TEXT,
        instrument TEXT,
        linked_events TEXT
      );

      CREATE TABLE IF NOT EXISTS mpc_events (
        mpc_id TEXT PRIMARY KEY,
        event_time TEXT,
        instrument TEXT,
        linked_events TEXT,
        link TEXT
      );

      CREATE TABLE IF NOT EXISTS rbe_events (
        rbe_id TEXT PRIMARY KEY,
        event_time TEXT,
        instrument TEXT,
        linked_events TEXT,
        link TEXT
      );

      CREATE TABLE IF NOT EXISTS hss_events (
        hss_id TEXT PRIMARY KEY,
        event_time TEXT,
        instrument TEXT,
        linked_events TEXT,
        link TEXT
      );

      CREATE TABLE IF NOT EXISTS wsa_enlil_events (
        simulation_id TEXT PRIMARY KEY,
        model_completion_time TEXT,
        estimated_shock_arrival TEXT,
        is_earth_gb INTEGER,
        rmin_re REAL,
        kp90 INTEGER,
        kp135 INTEGER,
        kp180 INTEGER,
        cme_id TEXT,
        latitude REAL,
        longitude REAL,
        speed INTEGER,
        half_angle INTEGER,
        link TEXT
      );

      CREATE TABLE IF NOT EXISTS query_cache (
        cache_key TEXT PRIMARY KEY,
        start_date TEXT,
        end_date TEXT,
        cached_at TEXT
      );
    `);

    return db;
  } catch (err) {
    console.warn('SQLite initialization warning:', err);
    return null;
  }
}

/**
 * Check if a date query range exists in SQLite cache
 */
export async function isDateRangeCached(startDate, endDate) {
  try {
    const database = await initSQLite();
    if (!database) return false;

    const cacheKey = `${startDate}_${endDate}`;
    const res = database.exec(`SELECT cache_key FROM query_cache WHERE cache_key = '${cacheKey}'`);
    return res.length > 0 && res[0].values.length > 0;
  } catch (err) {
    console.warn('Cache check error:', err);
    return false;
  }
}

/**
 * Fetch cached telemetry records from SQLite database for a date range
 */
export async function getCachedTelemetry(startDate, endDate) {
  try {
    const database = await initSQLite();
    if (!database) return null;

    const queryTable = (table, timeCol, mapper) => {
      try {
        const res = database.exec(`
          SELECT * FROM ${table} 
          WHERE ${timeCol} >= '${startDate}' AND ${timeCol} <= '${endDate}T23:59:59Z'
             OR ${timeCol} >= '${startDate}' AND ${timeCol} <= '${endDate}'
        `);
        if (!res || res.length === 0) return [];
        const columns = res[0].columns;
        return res[0].values.map(row => {
          const obj = {};
          columns.forEach((col, idx) => { obj[col] = row[idx]; });
          return mapper(obj);
        });
      } catch (err) {
        console.warn(`Query ${table} error:`, err);
        return [];
      }
    };

    const cmes = queryTable('cme_events', 'start_time', row => ({
      activityID: row.activity_id,
      startTime: row.start_time,
      sourceLocation: row.source_location,
      speed: row.speed,
      halfAngle: row.half_angle,
      cmeType: row.cme_type,
      latitude: row.latitude,
      longitude: row.longitude,
      linkedEvents: row.linked_events ? JSON.parse(row.linked_events) : [],
      enlilArrival: row.enlil_arrival,
      isEarthGB: !!row.is_earth_gb
    }));

    const flares = queryTable('solar_flare_events', 'begin_time', row => ({
      flareID: row.flare_id,
      beginTime: row.begin_time,
      peakTime: row.peak_time,
      classType: row.class_type,
      sourceLocation: row.source_location
    }));

    const storms = queryTable('geomagnetic_storm_events', 'start_time', row => ({
      stormID: row.storm_id,
      startTime: row.start_time,
      maxKpIndex: row.max_kp_index
    }));

    const seps = queryTable('sep_events', 'event_time', row => ({
      sepID: row.sep_id,
      eventTime: row.event_time,
      instrument: row.instrument,
      linkedCME: row.linked_cme
    }));

    const ipss = queryTable('ips_events', 'event_time', row => ({
      ipsID: row.ips_id,
      eventTime: row.event_time,
      location: row.location,
      catalog: row.catalog,
      instrument: row.instrument,
      linkedEvents: row.linked_events ? JSON.parse(row.linked_events) : []
    }));

    const mpcs = queryTable('mpc_events', 'event_time', row => ({
      mpcID: row.mpc_id,
      eventTime: row.event_time,
      instrument: row.instrument,
      linkedEvents: row.linked_events ? JSON.parse(row.linked_events) : [],
      link: row.link
    }));

    const rbes = queryTable('rbe_events', 'event_time', row => ({
      rbeID: row.rbe_id,
      eventTime: row.event_time,
      instrument: row.instrument,
      linkedEvents: row.linked_events ? JSON.parse(row.linked_events) : [],
      link: row.link
    }));

    const hss = queryTable('hss_events', 'event_time', row => ({
      hssID: row.hss_id,
      eventTime: row.event_time,
      instrument: row.instrument,
      linkedEvents: row.linked_events ? JSON.parse(row.linked_events) : [],
      link: row.link
    }));

    const wes = queryTable('wsa_enlil_events', 'model_completion_time', row => ({
      simulationID: row.simulation_id,
      modelCompletionTime: row.model_completion_time,
      estimatedShockArrivalTime: row.estimated_shock_arrival,
      isEarthGB: !!row.is_earth_gb,
      rmin_re: row.rmin_re,
      kp90: row.kp90,
      kp135: row.kp135,
      kp180: row.kp180,
      cmeID: row.cme_id,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      halfAngle: row.half_angle,
      link: row.link
    }));

    return { cmes, flares, storms, seps, ipss, mpcs, rbes, hss, wes, fromCache: true };
  } catch (err) {
    console.warn('SQLite Fetch Cache Error:', err);
    return null;
  }
}

/**
 * Save fetched API records into local SQLite database & record query_cache entry
 */
export async function saveToSQLite(data, startDate, endDate) {
  try {
    const database = await initSQLite();
    if (!database) return false;

    // Save CME Events (extended with lat/lon + WSAEnlil arrival)
    if (Array.isArray(data.cmes) && data.cmes.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO cme_events 
        (activity_id, start_time, source_location, speed, half_angle, cme_type, latitude, longitude, linked_events, enlil_arrival, is_earth_gb)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      data.cmes.forEach(cme => {
        stmt.run([cme.activityID, cme.startTime, cme.sourceLocation, cme.speed, cme.halfAngle, cme.cmeType, cme.latitude ?? null, cme.longitude ?? null, JSON.stringify(cme.linkedEvents || []), cme.enlilArrival || null, cme.isEarthGB ? 1 : 0]);
      });
      stmt.free();
    }

    // Save Solar Flare Events
    if (Array.isArray(data.flares) && data.flares.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO solar_flare_events 
        (flare_id, begin_time, peak_time, class_type, source_location)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.flares.forEach(flr => {
        stmt.run([flr.flareID, flr.beginTime, flr.peakTime, flr.classType, flr.sourceLocation]);
      });
      stmt.free();
    }

    // Save Geomagnetic Storm Events
    if (Array.isArray(data.storms) && data.storms.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO geomagnetic_storm_events 
        (storm_id, start_time, max_kp_index)
        VALUES (?, ?, ?)
      `);
      data.storms.forEach(st => {
        stmt.run([st.stormID, st.startTime, st.maxKpIndex]);
      });
      stmt.free();
    }

    // Save SEP Events
    if (Array.isArray(data.seps) && data.seps.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO sep_events 
        (sep_id, event_time, instrument, linked_cme)
        VALUES (?, ?, ?, ?)
      `);
      data.seps.forEach(sep => {
        stmt.run([sep.sepID, sep.eventTime, sep.instrument, sep.linkedCME]);
      });
      stmt.free();
    }

    // Save IPS Events (extended with linkedEvents JSON)
    if (Array.isArray(data.ipss) && data.ipss.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO ips_events 
        (ips_id, event_time, location, catalog, instrument, linked_events)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.ipss.forEach(ips => {
        stmt.run([ips.ipsID, ips.eventTime, ips.location, ips.catalog, ips.instrument, JSON.stringify(ips.linkedEvents || [])]);
      });
      stmt.free();
    }

    // Save MPC Events
    if (Array.isArray(data.mpcs) && data.mpcs.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO mpc_events 
        (mpc_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.mpcs.forEach(mpc => {
        stmt.run([mpc.mpcID, mpc.eventTime, mpc.instrument, JSON.stringify(mpc.linkedEvents || []), mpc.link || '']);
      });
      stmt.free();
    }

    // Save RBE Events
    if (Array.isArray(data.rbes) && data.rbes.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO rbe_events 
        (rbe_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.rbes.forEach(rbe => {
        stmt.run([rbe.rbeID, rbe.eventTime, rbe.instrument, JSON.stringify(rbe.linkedEvents || []), rbe.link || '']);
      });
      stmt.free();
    }

    // Save HSS Events
    if (Array.isArray(data.hss) && data.hss.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO hss_events 
        (hss_id, event_time, instrument, linked_events, link)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.hss.forEach(hss => {
        stmt.run([hss.hssID, hss.eventTime, hss.instrument, JSON.stringify(hss.linkedEvents || []), hss.link || '']);
      });
      stmt.free();
    }

    // Save WSA-Enlil Events
    if (Array.isArray(data.wes) && data.wes.length > 0) {
      const stmt = database.prepare(`
        INSERT OR REPLACE INTO wsa_enlil_events 
        (simulation_id, model_completion_time, estimated_shock_arrival, is_earth_gb, rmin_re, kp90, kp135, kp180, cme_id, latitude, longitude, speed, half_angle, link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      // Use deduplicated simulation_id; generate composite key if duplicates per cmeInput
      const seen = new Set();
      data.wes.forEach(we => {
        let sid = we.simulationID;
        if (we.cmeID) sid = `${we.simulationID}::${we.cmeID}`;
        if (seen.has(sid)) return;
        seen.add(sid);
        stmt.run([sid, we.modelCompletionTime, we.estimatedShockArrivalTime, we.isEarthGB ? 1 : 0, we.rmin_re ?? null, we.kp90 ?? null, we.kp135 ?? null, we.kp180 ?? null, we.cmeID || null, we.latitude ?? null, we.longitude ?? null, we.speed ?? null, we.halfAngle ?? null, we.link || '']);
      });
      stmt.free();
    }

    // Record cache entry
    if (startDate && endDate) {
      const cacheKey = `${startDate}_${endDate}`;
      const now = new Date().toISOString();
      database.run(`INSERT OR REPLACE INTO query_cache (cache_key, start_date, end_date, cached_at) VALUES ('${cacheKey}', '${startDate}', '${endDate}', '${now}')`);
    }

    return true;
  } catch (err) {
    console.warn('SQLite Save warning:', err);
    return false;
  }
}

/**
 * Get Table Counts from SQLite
 */
export async function getSQLiteCounts() {
  try {
    const database = await initSQLite();
    if (!database) return { cmes: 0, flares: 0, storms: 0, seps: 0, ipss: 0, queries: 0 };

    const getCount = (table) => {
      try {
        const res = database.exec(`SELECT COUNT(*) FROM ${table}`);
        return res[0] && res[0].values[0] ? res[0].values[0][0] : 0;
      } catch {
        return 0;
      }
    };

    return {
      cmes: getCount('cme_events'),
      flares: getCount('solar_flare_events'),
      storms: getCount('geomagnetic_storm_events'),
      seps: getCount('sep_events'),
      ipss: getCount('ips_events'),
      mpcs: getCount('mpc_events'),
      rbes: getCount('rbe_events'),
      hss: getCount('hss_events'),
      wes: getCount('wsa_enlil_events'),
      queries: getCount('query_cache')
    };
  } catch (err) {
    return { cmes: 0, flares: 0, storms: 0, seps: 0, ipss: 0, queries: 0 };
  }
}

/**
 * Clear all cached records from SQLite
 */
export async function clearSQLiteCache() {
  try {
    const database = await initSQLite();
    if (!database) return false;
    database.run(`
      DELETE FROM cme_events;
      DELETE FROM solar_flare_events;
      DELETE FROM geomagnetic_storm_events;
      DELETE FROM sep_events;
      DELETE FROM ips_events;
      DELETE FROM mpc_events;
      DELETE FROM rbe_events;
      DELETE FROM hss_events;
      DELETE FROM wsa_enlil_events;
      DELETE FROM query_cache;
    `);
    return true;
  } catch (err) {
    console.error('Clear SQLite Cache Error:', err);
    return false;
  }
}

/**
 * Export full SQLite binary database file (.db)
 */
export async function exportSQLiteBinary() {
  try {
    const database = await initSQLite();
    if (!database) {
      alert('SQLite database engine not initialized.');
      return;
    }
    const binaryArray = database.export();
    const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'spaceguard.db';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('SQLite Export Error:', err);
  }
}
