import React, { useState } from 'react';
import { 
  Cpu, Database, BookOpen, Check, Copy, Globe, Layers, 
  Workflow, Zap, Shield, Code2, Server, BarChart3, Binary, ArrowRight,
  Terminal, Sparkles, CheckCircle2, Users, Award, Code, Heart, Star, Compass,
  Sun, ShieldAlert, Activity, Atom, Flame, Magnet, Radio, Orbit, Gauge, Bot, Key, Wind
} from 'lucide-react';

export default function TechnicalDocsPage() {
  const [activeTab, setActiveTab] = useState('algorithms');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const theoryPhenomena = [
    {
      id: "cme",
      title: "1. Coronal Mass Ejections (CME)",
      shortTitle: "Coronal Mass Ejections",
      badge: "Plasma & Magnetic Dynamics",
      icon: Zap,
      color: "teal",
      tagline: "Large-scale solar plasma expulsions carrying billions of tons of magnetized matter into interplanetary space.",
      overview: "A Coronal Mass Ejection (CME) is a massive detachment of magnetized plasma erupted from the Sun's corona into the heliosphere. Originating from active regions where solar magnetic flux ropes undergo magnetic reconnection, CMEs can release up to 10¹² kilograms of plasma with kinetic energies reaching 10²⁵ Joules.",
      physics: [
        "Velocity Spectrum: Typically ranges between 250 km/s (slow/gradual) to over 3,000 km/s (fast/impulsive).",
        "Transit Time to Earth: Traverses the 1 AU (150 million km) Sun-Earth distance in 15 to 72 hours.",
        "Magnetic Structure: Contains a core of cool prominence material, a low-density cavity, and a leading dense plasma front.",
        "SpaceGuard Extraction: V9.scala parses cmeAnalyses to filter isMostAccurate = true, extracting expansion half-angle, radial speed, latitude/longitude, type (C/S/O/ER), linkedEvents and WSA-ENLIL enlilList Earth-GB arrival."
      ],
      hazard: "When a CME possesses a strong southward magnetic field (Bz < 0), it reconnects with Earth's northward magnetic field, driving intense geomagnetic storms, power grid disruptions, and satellite drag."
    },
    {
      id: "flr",
      title: "2. Solar Flares (FLR)",
      shortTitle: "Solar Flares",
      badge: "Electromagnetic Emission",
      icon: Sun,
      color: "amber",
      tagline: "Intense, localized bursts of electromagnetic radiation across radio to X-ray wavelengths occurring near sunspots.",
      overview: "Solar Flares represent sudden releases of magnetic energy stored in twisted coronal magnetic fields above sunspot groups. Through the process of magnetic reconnection, charged particles are accelerated into the dense lower solar atmosphere (chromosphere), heating plasma to tens of millions of Kelvin and producing intense X-ray and EUV emission.",
      physics: [
        "Speed of Arrival: Propagates at the speed of light (c), reaching Earth in just 8.3 minutes.",
        "GOES Classification: Logarithmic classification based on peak 0.1–0.8 nm X-ray flux (Watts/m²): A (<10⁻⁷), B (10⁻⁷), C (10⁻⁶), M (10⁻⁵), X (≥10⁻⁴ W/m²).",
        "Ionospheric Impact: Drives Sudden Ionospheric Disturbances (SID) by ionizing the D-region (60–90 km altitude).",
        "SpaceGuard Extraction: V9.scala extracts peakTime, classType, source location, and executes logarithmic rank sorting (Algorithm 3)."
      ],
      hazard: "M-class and X-class flares induce immediate High-Frequency (HF) radio communication blackouts (NOAA R1 to R5) across the daylight side of Earth and distort GNSS/GPS timing."
    },
    {
      id: "gst",
      title: "3. Geomagnetic Storms (GST)",
      shortTitle: "Geomagnetic Storms",
      badge: "Magnetospheric Coupling",
      icon: ShieldAlert,
      color: "rose",
      tagline: "Global disturbances of Earth's magnetic field triggered by solar wind shock fronts and CME magnetic coupling.",
      overview: "A Geomagnetic Storm occurs when solar wind plasma and magnetic clouds efficiently transfer energy into Earth's magnetosphere. This interaction intensifies the equatorial magnetospheric Ring Current, causing a sharp depression in the horizontal component of Earth's geomagnetic field observed across ground-based magnetometer stations worldwide.",
      physics: [
        "Planetary Kp Index: A 0 to 9 quasi-logarithmic planetary disturbance index measured in 3-hour synoptic intervals.",
        "NOAA G-Scale Mapping: G1 (Kp=5, Minor), G2 (Kp=6, Moderate), G3 (Kp=7, Strong), G4 (Kp=8, Severe), G5 (Kp=9, Extreme).",
        "Ring Current Dynamics: Injected protons and electrons drift azimuthally, generating a magnetic field opposing Earth's dipole.",
        "SpaceGuard Extraction: V9.scala reduces allKpIndex time-series arrays per storm to compute maxKpIndex and correlate threat levels (Algorithm 4, Kp-only G-scale)."
      ],
      hazard: "Severe storms (G4–G5) induce Geomagnetically Induced Currents (GICs) in power transmission grids, cause auroral expansion toward mid-latitudes, and disrupt pipeline cathodic protection."
    },
    {
      id: "sep",
      title: "4. Solar Energetic Particles (SEP)",
      shortTitle: "Solar Energetic Particles",
      badge: "Relativistic Particle Flux",
      icon: Activity,
      color: "purple",
      tagline: "Fluxes of high-energy relativistic protons and heavy ions accelerated during solar eruptive phenomena.",
      overview: "Solar Energetic Particle (SEP) events consist of fluxes of high-energy protons, electrons, and heavy ions accelerated to relativistic speeds (significant fractions of light speed). These particles are energized either directly at flare magnetic reconnection sites or by diffusive shock acceleration across expanding CME blast waves.",
      physics: [
        "Energy Regimes: Proton kinetic energies range from a few MeV to over 1 GeV (able to penetrate spacecraft shielding).",
        "Arrival Time: Relativistic particles arrive within 15 minutes to several hours following the primary solar eruption.",
        "Polar Funneling: Guided along Earth's magnetic field lines into the polar caps, producing Polar Cap Absorption (PCA).",
        "SpaceGuard Extraction: V9.scala records SEP event times, instrument telemetry (e.g. GOES-P, SOHO, ACE), and parent CME associations."
      ],
      hazard: "Poses acute biological radiation hazards to astronauts (NOAA S1 to S5 scales), degrades solar panels, and triggers Single Event Upsets (SEU) / bit-flips in satellite avionics."
    },
    {
      id: "ips",
      title: "5. Interplanetary Shocks (IPS)",
      shortTitle: "Interplanetary Shocks",
      badge: "Heliospheric Shock Dynamics",
      icon: Compass,
      color: "emerald",
      tagline: "Supersonic magnetohydrodynamic shock waves propagating through interplanetary space ahead of fast CMEs.",
      overview: "An Interplanetary Shock (IPS) is a sharp, discontinuous transition front that forms when a coronal mass ejection or high-speed solar wind stream travels faster than the local ambient magnetosonic wave speed (typically 300–500 km/s). The shock compresses, heats, and accelerates the upstream interplanetary medium.",
      physics: [
        "Mach Number: Characterized by magnetosonic Mach numbers (Mms > 1), determining shock compression ratios.",
        "In-Situ Sentinel Detection: Measured upstream at the Sun-Earth Lagrange Point L1 (1.5 million km from Earth) by ACE, DSCOVR, and SOHO.",
        "Early Warning Horizon: Provides a 30 to 60 minute early warning window before geomagnetic sudden commencement at Earth.",
        "SpaceGuard Extraction: V9.scala indexes shock arrival timestamps, observatory catalogs, heliospheric locations, and sensor identifiers."
      ],
      hazard: "The arrival of an IPS at Earth's magnetopause causes sudden magnetospheric compression known as a Sudden Storm Commencement (SSC), initiating subsequent geomagnetic storms."
    },
    {
      id: "mpc",
      title: "6. Magnetopause Crossings (MPC)",
      shortTitle: "Magnetopause Crossings",
      badge: "Magnetospheric Boundary Dynamics",
      icon: Magnet,
      color: "indigo",
      tagline: "Boundary compressions where solar-wind dynamic pressure overwhelms Earth's magnetospheric pressure at ~10 Earth radii.",
      overview: "A Magnetopause Crossing (MPC) occurs when enhanced solar-wind dynamic pressure (from CME shocks or HSS) pushes the dayside magnetopause inside geosynchronous orbit. Modeled via SWMF at CCMC, MPC signals geosynchronous spacecraft exposure to interplanetary plasma.",
      physics: [
        "Standoff Distance: Subsolar magnetopause nominally ~10 Re; compressed to <6.6 Re during SSC allows magnetosheath plasma at GEO.",
        "SWMF Modeling: Space Weather Modeling Framework propagates L1 solar-wind to magnetosphere to predict crossings.",
        "Linked Drivers: 70% MPC linked to CME/IPS/GST/HSS events via DONKI linkedEvents; strongest during G4–G5 storms.",
        "SpaceGuard Extraction: V9.scala & donkiApi.js fetch /MPC, storing mpcID/eventTime/MODEL: SWMF instrument and linkedEvents CSV for dashboard MPC timeline marker and MPC+HSS+GST multi-line."
      ],
      hazard: "Exposes GEO satellites (GOES, telecom) to solar-wind plasma, causing surface charging, single-event effects, and attitude anomalies; indicates imminent GIC risk."
    },
    {
      id: "rbe",
      title: "7. Radiation Belt Enhancements (RBE)",
      shortTitle: "Radiation Belt Enhancements",
      badge: "Relativistic Electron Flux",
      icon: Radio,
      color: "cyan",
      tagline: "Transient enhancements of outer radiation belt relativistic electrons (>2 MeV) driven by wave-particle acceleration.",
      overview: "A Radiation Belt Enhancement (RBE) is a persistent elevation of >2 MeV electron flux in the outer Van Allen belt, driven by whistler-mode chorus waves energizing seed electrons during HSS or storm recovery. Measured by GOES-P SEISS, RBE elevate dose for MEO/GEO spacecraft.",
      physics: [
        "Energy Threshold: GOES-P SEISS >2 MeV channel; flux rises 10–1000× over quiet background for 2–7 days.",
        "Acceleration: HSS-driven ultralow-frequency (ULF) + very-low-frequency (VLF) waves diffuse electrons to relativistic energies.",
        "Solar-Wind Coupling: 80% RBE follow HSS/CIR passage within 1–2 days; linked to prolonged Kp 4–6, not necessarily major storm.",
        "SpaceGuard Extraction: V9.scala fetch /RBE → rbeID/eventTime/GOES-P SEISS instrument/linked HSS-GST; dashboard RBE flux proxy is daily RBE count and HSS/RBE/GST multi-line."
      ],
      hazard: "Deep dielectric charging and total ionizing dose threaten GEO/MEO satellites, GNSS, and astronaut EVA; requires S/C orbit raising or safe-mode."
    },
    {
      id: "hss",
      title: "8. High-Speed Streams (HSS)",
      shortTitle: "High-Speed Streams",
      badge: "Coronal Hole Wind Dynamics",
      icon: Wind,
      color: "sky",
      tagline: "Fast solar wind (500–800 km/s) from coronal holes overtaking slow wind, forming corotating interaction regions.",
      overview: "A High-Speed Stream (HSS) originates in equatorial coronal holes where open magnetic field lines accelerate plasma to 500–800 km/s. The fast stream overtakes preceding slow wind, forming a Corotating Interaction Region (CIR) that compresses plasma and enhances magnetospheric coupling.",
      physics: [
        "Source: Coronal holes with open flux; 27-day recurrent pattern tied to solar rotation; latitude determines Earth impact.",
        "CIR Formation: Fast-slow shear at 1 AU creates density/field pileup, dynamic pressure pulse, and often trailing IPS.",
        "In-Situ Detection: DSCOVR PLASMAG, ACE SWEPAM/MAG, STEREO A PLASTIC measure speed/density/Bz; DONKI links to RBE/GST/IPS.",
        "SpaceGuard Extraction: V9.scala fetch /HSS → hssID/eventTime/multi-instrument CSV/linkedEvents; dashboard HSS speed vs time line (daily HSS count proxy) + HSS/RBE/GST multi-line."
      ],
      hazard: "Drives recurrent G1–G2 storms, RBE seeding, and GICs; CIR shocks can be as geoeffective as moderate CMEs for power grids at high latitude."
    },
    {
      id: "wsa",
      title: "9. WSA-ENLIL Heliospheric Predictions (WSAEnlilSimulations)",
      shortTitle: "WSA-ENLIL Predictions",
      badge: "MHD Cone Forecasting",
      icon: Orbit,
      color: "amber",
      tagline: "Coupled Wang-Sheeley-Arge + ENLIL MHD cone model forecasting CME shock arrival, Kp, and glancing blow.",
      overview: "WSA-ENLIL couples coronal WSA outflow (from photospheric magnetograms) with 3D MHD ENLIL heliospheric propagation. For each CME input (latitude/longitude/speed/halfAngle/time21_5), it predicts estimatedShockArrivalTime, duration, rmin_re, Kp (kp_90/135/180), isEarthGB (direct vs glancing), and impactList for Earth and planetary spacecraft.",
      physics: [
        "Cone Inputs: latitude, longitude, speed (km/s), halfAngle (deg), time21_5 — taken from mostAccurate CME analysis (Algorithm 2).",
        "Outputs: estimatedShockArrivalTime (Earth), estimatedDuration (hours), rmin_re (magnetopause standoff in Re), kp_90/135/180 (Kp at 3 clock angles), isEarthGB/isEarthMinorImpact boolean, impactList[location/arrivalTime/isGlancingBlow].",
        "Flattening: V9.scala & donkiApi.js flatten each simulation's cmeInputs[] → one row per cmeInput: simulationID::cmeID PK, storing all outputs for dashboard 2D direction scatter (lat vs lon, bubble=halfAngle, color=speed) and WSA arrival timeline.",
        "Dashboard Mapping: CME Earth tab → direction scatter ⭐, width gauge ⭐, speed bar ⭐, WSA-ENLIL Earth-arrival timeline ⭐ (filtered isEarthGB), plus linkedEvents timeline."
      ],
      hazard: "Enables 1–4 day lead forecast of CME lethality: if isEarthGB true with kp_90≥7, predicts G3+ storm, allowing preemptive grid/spacecraft mitigation; false if Bz northward."
    }
  ];

  const algorithms = [
    {
      id: 1,
      name: "Asynchronous 9-Feed Parallel Ingestion",
      tag: "Parallel Algorithm — Fan-Out / Fan-In (Concurrency)",
      color: "teal",
      complexity: "O(1) dispatch / O(N) stream read × 9",
      description: "Dispatches 9 concurrent non-blocking HTTP GET to NASA DONKI (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations) via Scala Future monadic composition + ForkJoinPool. Mirrored in JS via Promise.allSettled(9). Global 120s Await barrier, CCMC Kauai fallback.",
      code: `// Algorithm 1: 9-Feed Concurrent Parallel Fetching (V9.scala:1272 / donkiApi.js:150)
val fetched = Await.result(
  for {
    cmeEvents   <- Future(fetchCME(startDate, endDate))
    flareEvents <- Future(fetchSolarFlares(startDate, endDate))
    stormEvents <- Future(fetchStorms(startDate, endDate))
    sepEvents   <- Future(fetchSEP(startDate, endDate))
    ipsEvents   <- Future(fetchIPS(startDate, endDate))
    mpcEvents   <- Future(fetchMPC(startDate, endDate))
    rbeEvents   <- Future(fetchRBE(startDate, endDate))
    hssEvents   <- Future(fetchHSS(startDate, endDate))
    wsaEvents   <- Future(fetchWSAEnlil(startDate, endDate))
  } yield (cmeEvents, flareEvents, stormEvents, sepEvents, ipsEvents, mpcEvents, rbeEvents, hssEvents, wsaEvents),
  120.seconds
)
// JS mirror: await Promise.allSettled([fetchCME, fetchFLR, fetchGST, fetchSEP, fetchIPS, fetchMPC, fetchRBE, fetchHSS, fetchWSAEnlil])`
    },
    {
      id: 2,
      name: "CME Most-Accurate Trajectory (Extended)",
      tag: "Filtering Algorithm — Linear Scan + Fallback",
      color: "emerald",
      complexity: "O(A) per CME, A=analyses",
      description: "Finds isMostAccurate=true in cmeAnalyses, falls back to head. Now extracts 11 cols: speed, halfAngle, type, latitude, longitude, linkedEvents (linkedEvents[].activityID→CSV), enlilArrival/isEarthGB (enlilList→estimatedShockArrivalTime where isEarthGB). Feeds 2D direction scatter (lat vs lon, bubble=halfAngle).",
      code: `// Algorithm 2: CME Trajectory + Geometry (Extended 11-col)
val mostAccurate = analyses.arr.find(_.obj.get("isMostAccurate").exists{case ujson.Bool(true)=>true; case _=>false})
val selected = mostAccurate.getOrElse(analyses.arr.head)
val latitude  = if (selected.obj.get("latitude").exists(_!=ujson.Null)) selected("latitude").num else 0.0
val longitude = if (selected.obj.get("longitude").exists(_!=ujson.Null)) selected("longitude").num else 0.0
val linkedEvents = if (cme.obj.get("linkedEvents").exists(_!=ujson.Null) && cme("linkedEvents").arr.nonEmpty) cme("linkedEvents").arr.map(_("activityID").str).mkString(",") else ""
val (enlilArrival, isEarthGB) = if (selected.obj.get("enlilList").exists(_!=ujson.Null) && selected("enlilList").arr.nonEmpty) {
  val earth = selected("enlilList").arr.find(_.obj.get("isEarthGB").exists{case ujson.Bool(b)=>b; case _=>false}).getOrElse(selected("enlilList").arr.head)
  (if (earth.obj.get("estimatedShockArrivalTime").exists(_!=ujson.Null)) earth("estimatedShockArrivalTime").str else "", earth.obj.get("isEarthGB").exists{case ujson.Bool(b)=>b; case _=>false})
} else ("", false)
CMEEvent(activityID=cme("activityID").str, startTime=cme("startTime").str, sourceLocation=..., speed=selected("speed").num.toInt, halfAngle=selected("halfAngle").num.toInt, cmeType=..., latitude, longitude, linkedEvents, enlilArrival, isEarthGB)`
    },
    {
      id: 3,
      name: "Solar Flare Logarithmic Intensity Ranking",
      tag: "Sorting Algorithm — Tuple-Rank Comparison Sort",
      color: "amber",
      complexity: "O(N) composite tuple (Int, Double)",
      description: "Parses GOES class A/B/C/M/X + magnitude, maps A1 B2 C3 M4 X5, ranks via (rank,mag) tuple. Used for Flare Intensity Timeline (rank 1→5) and M/X badge. Handles Unknown/empty → (0,0).",
      code: `// Algorithm 3: GOES Spectral Class Evaluation
val classRank = Map("A"->1,"B"->2,"C"->3,"M"->4,"X"->5)
def flareStrength(classType: String): (Int, Double) = {
  if (classType=="Unknown"||classType.isEmpty) (0,0.0)
  else {
    val letter = classType.take(1).toUpperCase
    val mag = classType.drop(1).toDoubleOption.getOrElse(0.0)
    (classRank.getOrElse(letter,0), mag)
  }
}
val strongestFlare = validFlares.maxBy(f=>flareStrength(f.classType))
// JS: rankMap {A:1...X:5}, y = rank + mag/10 for ECharts`
    },
    {
      id: 4,
      name: "Geomagnetic Storm Peak Kp Index Reduction",
      tag: "Reduction Algorithm — Fold / Max Aggregation",
      color: "rose",
      complexity: "O(K) per Storm, K=Kp obs",
      description: "Reduces allKpIndex[] per GST: max(kpIndex). Derives averageKp, strongestStorm, NOAA G-scale: G0<5 G1≥5 G2≥6 G3≥7 G4≥8 G5≥9 Kp-only (flare/CME speed not used). Feeds Kp area chart with G1/G3/G5 markLines and threat banner.",
      code: `// Algorithm 4: Maximum Planetary Kp Reduction
val maxKp = if (kpIndexes!=ujson.Null && kpIndexes.arr.nonEmpty) kpIndexes.arr.map(_("kpIndex").num).max else 0.0
val strongestStorm = events.maxBy(_.maxKpIndex)
val averageKp = events.map(_.maxKpIndex).sum / events.size
// G-scale: if (maxKp>=9) G5 else if (>=8) G4 else if (>=7) G3 else if (>=6) G2 else if (>=5) G1 else G0`
    },
    {
      id: 5,
      name: "Statistical Distribution & Extremum Analytics",
      tag: "Aggregation Algorithm — GroupBy + Single-Pass Stats",
      color: "purple",
      complexity: "O(N) single-pass",
      description: "Computes mean velocity μ=1/N Σv_i, fastest/slowest via maxBy/minBy, and typeDistribution via groupBy(_.cmeType).view.mapValues(_.size). Used for CME velocity spectrum avg line and type donut.",
      code: `// Algorithm 5: Frequency Grouping & Statistical Bounds
val averageSpeed = events.map(_.speed).sum.toDouble / events.size
val fastest = events.maxBy(_.speed) // e.g., 1572 km/s halo
val slowest = events.minBy(_.speed)
val typeDistribution = events.groupBy(_.cmeType).view.mapValues(_.size).toMap
// JS mirror: data.cmes.reduce((s,c)=>s+c.speed,0)/n, Math.max(...speeds)`
    },
    {
      id: 6,
      name: "Atomic Idempotent Batch Persistence (9 Tables)",
      tag: "Transactional Algorithm — Batch Insert + Deduplication",
      color: "indigo",
      complexity: "O(N) batch × 9, O(1) PK lookup",
      description: "SQLite JDBC + sql.js WASM 9 tables (cme_events 11 cols, solar_flare_events, geomagnetic_storm_events, sep_events, ips_events + mpc_events/rbe_events/hss_events/wsa_enlil_events + query_cache). INSERT OR IGNORE/REPLACE on PK (activity_id/flare_id/gstID…), autoCommit false, commit/rollback. Handles linked_events JSON + WSA flatten per cmeInput (simulationID::cmeID).",
      code: `// Algorithm 6: 9-Table Idempotent Transactional Persistence
connection.setAutoCommit(false)
// CME 11-col
val sqlCME = "INSERT OR IGNORE INTO cme_events (activity_id, start_time, source_location, speed, half_angle, cme_type, latitude, longitude, linked_events, enlil_arrival, is_earth_gb) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
val stmt = connection.prepareStatement(sqlCME)
for (e<-cmeEvents) { stmt.setString(1,e.activityID); stmt.setString(2,e.startTime); stmt.setString(3,e.sourceLocation); stmt.setInt(4,e.speed); stmt.setInt(5,e.halfAngle); stmt.setString(6,e.cmeType); stmt.setDouble(7,e.latitude); stmt.setDouble(8,e.longitude); stmt.setString(9,e.linkedEvents); stmt.setString(10,e.enlilArrival); stmt.setInt(11,if(e.isEarthGB)1 else 0); stmt.executeUpdate() }
// + solar_flare, storm, sep, ips(linked), mpc, rbe, hss, wsa_enlil (flatten dedup simulationID::cmeID)
connection.commit() // rollback on exception`
    },
    {
      id: 7,
      name: "Daily Timeline Phenomena Aggregation",
      tag: "Binning Algorithm — Hash Map + Sorted Set Union",
      color: "cyan",
      complexity: "O(N) per feed, O(D) merged dates",
      description: "For 8 phenomena charts: getDailyCounts(arr,dateKey) groups by YYYY-MM-DD → map[date]=count, getUnifiedDates(...maps)=sorted union. Feeds geomagnetic 5-line (CME+IPS+HSS+MPC+GST), Flare→CME→SEP bar+line, SEP/RBE/HSS/MPC/IPS daily lines, HSS/RBE/GST & MPC/HSS/GST multi-lines. Enables particle-flux proxy (SEP/day) and electron-flux proxy (RBE/day).",
      code: `// Algorithm 7: Frontend Daily Timeline Aggregation (DashboardPage.jsx:678)
const getDailyCounts = (arr, dateKey) => {
  const map={}; (arr||[]).forEach(item=>{
    const d=(item[dateKey]||'').split('T')[0];
    if(!d||d==='N/A') return; map[d]=(map[d]||0)+1;
  }); return map;
};
const getUnifiedDates = (...maps) => [...new Set(maps.flatMap(m=>Object.keys(m)))].sort();
// Example: geomagnetic 5-line
const cmeMap=getDailyCounts(cmes,'startTime'), ipsMap=getDailyCounts(ipss,'eventTime'), hssMap=getDailyCounts(hss,'eventTime'), mpcMap=getDailyCounts(mpcs,'eventTime'), gstMap=getDailyCounts(storms,'startTime');
const dates=getUnifiedDates(cmeMap,ipsMap,hssMap,mpcMap,gstMap);
// ECharts: 5 line series dates.map(d=>map[d]||0)`
    },
    {
      id: 8,
      name: "Theming, Palette & Phenomena Visibility",
      tag: "Lookup Algorithm — Hash Map + Boolean Mask Filter",
      color: "slate",
      complexity: "O(1) palette lookup + O(8) filter",
      description: "Settings sg_prefs (localStorage) drives instant UI: theme dark/dim/light via data-theme + .clean-card, fontScale via --sg-font-scale, galaxyIntensity/enabled via --sg-galaxy-intensity, reduceMotion via data-reduce-motion (disables galaxyRotation), chartPalette 6-way (standard/ocean/ember/aurora/colorblind/monochrome) via paletteColors map used in getCmeSpeedChartOption/getStormKpAreaChartOption, phenomenaVisibility 8 booleans filters nav pills via isPhenomenaVisible(key).",
      code: `// Algorithm 8: Instant Theming & Visibility (SettingsPage.jsx:54)
const paletteColors = {
  standard:{teal:'#0d9488',rose:'#f43f5e',amber:'#f59e0b'},
  ocean:{teal:'#0ea5e9',rose:'#06b6d4',amber:'#3b82f6'},
  ember:{teal:'#f59e0b',rose:'#ef4444',amber:'#f97316'},
  aurora:{teal:'#8b5cf6',rose:'#d946ef',amber:'#ec4899'},
  colorblind:{teal:'#0072B2',rose:'#D55E00',amber:'#E69F00'},
  monochrome:{teal:'#475569',rose:'#334155',amber:'#64748b'}
}[chartPalette];
const isPhenomenaVisible = (key) => JSON.parse(localStorage.getItem('sg_prefs')||'{}').phenomenaVisibility?.[key] !== false;
// CSS: [data-theme="light"] .clean-card { background: rgba(255,255,255,0.92) }
document.documentElement.setAttribute('data-theme', prefs.theme);`
    }
  ];

  const packages = [
    {
      name: "Scala 3 Compiler & Runtime",
      directive: '//> using scala "3.3+"',
      category: "Language & Core",
      purpose: "Modern high-performance JVM functional programming language with strong static typing, pattern matching, top-level definitions, and lightweight syntax.",
      features: ["Top-level @main definitions", "Case class immutable records", "Expressive pattern matching", "Zero-boilerplate syntax"]
    },
    {
      name: "com.lihaoyi::upickle:4.4.3",
      directive: '//> using dep "com.lihaoyi::upickle:4.4.3"',
      category: "JSON Parsing Engine",
      purpose: "Ultra-fast, zero-overhead JSON serialization library and Abstract Syntax Tree (AST) processor for streaming NASA DONKI payloads (`ujson.read`, `ujson.Value`).",
      features: ["Direct memory parsing without reflection", "Null-safe object/array navigators", "Type conversion helpers (.str, .num, .arr)", "Low memory footprint"]
    },
    {
      name: "org.xerial:sqlite-jdbc:3.53.4.0",
      directive: '//> using dep "org.xerial:sqlite-jdbc:3.53.4.0"',
      category: "Relational Database JDBC",
      purpose: "Native SQLite JDBC driver for direct file-based database persistence with atomic transaction management, connection pools, and parameterized SQL queries.",
      features: ["Embedded native SQLite C-binary", "Zero-configuration file storage", "ACID compliance & rollbacks", "High-throughput batching"]
    },
    {
      name: "scala.concurrent.{Future, Await}",
      directive: 'import scala.concurrent.{Future, Await}',
      category: "Concurrency Framework",
      purpose: "Asynchronous non-blocking concurrency model executing on the JVM global ForkJoinPool thread scheduler.",
      features: ["Parallel HTTP stream fetching", "Composable for-comprehensions", "Configurable duration barriers", "Thread pool resource management"]
    },
    {
      name: "scala.io.Source & java.net.URL",
      directive: 'import scala.io.Source, java.net.URL',
      category: "Network & I/O",
      purpose: "Configurable HTTP/HTTPS stream decoders with explicit connect (15s) and read (60s) timeout protections.",
      features: ["Safe buffered stream processing", "Deterministic close semantics", "ISO-8601 character stream decoding", "Fail-safe connection recovery"]
    },
    {
      name: "java.time.{LocalDate, DateTimeParseException}",
      directive: 'import java.time.LocalDate',
      category: "Temporal Validation",
      purpose: "Strict temporal validation engine verifying date ranges, chronology invariants (start <= end), and ISO-8601 formats.",
      features: ["Strict YYYY-MM-DD parsing", "Chronology sequence check", "Graceful parse error handling", "Leap year and calendar validation"]
    }
  ];

  const techStack = [
    {
      layer: "Core Data Engine (Backend) — 9 feeds, 8 algorithms",
      color: "teal",
      items: [
        { name: "Scala 3.3", desc: "Future 9-way fan-out, 8 algorithms (Future, lat/lon, GOES tuple, Kp max, stats, 9-table persistence, binning, theming)" },
        { name: "Scala CLI", desc: "Zero-config compile → spaceguard.jar, --enable-native-access" },
        { name: "uPickle 4.4.3", desc: "Streaming DONKI 9-feed JSON (CME+WSA, FLR, GST, SEP, IPS, MPC, RBE, HSS)" },
        { name: "SQLite-JDBC 3.53", desc: "10 tables (9 feeds + cache), cme_events 11 cols, wsa_enlil flattened simulationID::cmeID" }
      ]
    },
    {
      layer: "Web UI & Visualization (Frontend) — 8 phenomena",
      color: "cyan",
      items: [
        { name: "React 18 + Vite 5", desc: "8-phenomena dashboard, translucent pills, visibility filter, 6 palettes, light/dim/dark" },
        { name: "Apache ECharts 5", desc: "CME speed/direction scatter, Kp area, FLR rank, daily timelines, WSA arrival, multi-lines" },
        { name: "Tailwind CSS 3 + Live Galaxy", desc: "Deep-purple canvas (purple/pink/blue clouds, no image), glassmorphic clean-card, reduce-motion" },
        { name: "ORBIT AI Copilot", desc: "openrouter/free auto-router + 9-table DB access (list fastest CME, WSA arrivals, DB counts), 700 tokens, Kp-only G-scale" }
      ]
    },
    {
      layer: "Storage & Caching Tier — 9 tables WASM",
      color: "purple",
      items: [
        { name: "sql.js (Browser SQLite)", desc: "9 tables + cache, INSERT OR REPLACE, linked_events JSON, bipartite" },
        { name: "Local Disk SQLite", desc: "spaceguard.db — 10 tables, 11-col CME (lat/lon/enlil), wsa_enlil, mpc/rbe/hss" },
        { name: "Query Cache Table", desc: "sg_prefs-driven 9-feed hash, isDateRangeCached → zero-cost reload" },
        { name: "Binary DB Export", desc: "One-click .db + per-phenomenon JSON/CSV export (sg_prefs.exportFormat)" }
      ]
    },
    {
      layer: "Data Gateway & Upstream Providers — 9 feeds",
      color: "amber",
      items: [
        { name: "NASA DONKI 9 REST", desc: "CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations (Kauai + api.nasa.gov)" },
        { name: "CCMC Kauai Gateway", desc: "WSA-ENLIL cone inputs lat/lon/speed/halfAngle → arrival/Kp/rmin_re" },
        { name: "NOAA Scales", desc: "G1-G5 (Kp≥5-9) Kp-only, R1-R5 (GOES class), S1-S5 radiation" },
        { name: "Fault-Tolerant Dispatch", desc: "Promise.allSettled(9) + Scala Future 9-way, 120s Await, CCMC fallback" }
      ]
    }
  ];

  const schemas = [
    {
      table: "cme_events",
      desc: "Coronal Mass Ejections (11 cols: velocity, half-angle, type, lat/lon, linked, WSA arrival, Earth-GB)",
      sql: `CREATE TABLE IF NOT EXISTS cme_events (
  activity_id     TEXT PRIMARY KEY,
  start_time      TEXT,
  source_location TEXT,
  speed           INTEGER,
  half_angle      INTEGER,
  cme_type        TEXT,
  latitude        REAL,
  longitude       REAL,
  linked_events   TEXT,
  enlil_arrival   TEXT,
  is_earth_gb     INTEGER
);`
    },
    {
      table: "solar_flare_events",
      desc: "GOES Solar Flares (flux class, peak time, active region)",
      sql: `CREATE TABLE IF NOT EXISTS solar_flare_events (
  flare_id        TEXT PRIMARY KEY,
  begin_time      TEXT,
  peak_time       TEXT,
  class_type      TEXT,
  source_location TEXT
);`
    },
    {
      table: "geomagnetic_storm_events",
      desc: "Geomagnetic Storms (planetary Kp index, disturbance level)",
      sql: `CREATE TABLE IF NOT EXISTS geomagnetic_storm_events (
  storm_id        TEXT PRIMARY KEY,
  start_time      TEXT,
  max_kp_index    REAL
);`
    },
    {
      table: "sep_events",
      desc: "Solar Energetic Particle Events (instruments, CME linkage)",
      sql: `CREATE TABLE IF NOT EXISTS sep_events (
  sep_id          TEXT PRIMARY KEY,
  event_time      TEXT,
  instrument      TEXT,
  linked_cme      TEXT
);`
    },
    {
      table: "ips_events",
      desc: "Interplanetary Shocks (catalog, location, sensor, linked_events)",
      sql: `CREATE TABLE IF NOT EXISTS ips_events (
  ips_id          TEXT PRIMARY KEY,
  event_time      TEXT,
  location        TEXT,
  catalog         TEXT,
  instrument      TEXT,
  linked_events   TEXT
);`
    },
    {
      table: "mpc_events",
      desc: "Magnetopause Crossings (eventTime, instrument, linkedEvents)",
      sql: `CREATE TABLE IF NOT EXISTS mpc_events (
  mpc_id        TEXT PRIMARY KEY,
  event_time    TEXT,
  instrument    TEXT,
  linked_events TEXT,
  link          TEXT
);`
    },
    {
      table: "rbe_events",
      desc: "Radiation Belt Enhancements (electron flux, linkedEvents)",
      sql: `CREATE TABLE IF NOT EXISTS rbe_events (
  rbe_id        TEXT PRIMARY KEY,
  event_time    TEXT,
  instrument    TEXT,
  linked_events TEXT,
  link          TEXT
);`
    },
    {
      table: "hss_events",
      desc: "High-Speed Streams (solar-wind instruments, linkedEvents)",
      sql: `CREATE TABLE IF NOT EXISTS hss_events (
  hss_id        TEXT PRIMARY KEY,
  event_time    TEXT,
  instrument    TEXT,
  linked_events TEXT,
  link          TEXT
);`
    },
    {
      table: "wsa_enlil_events",
      desc: "WSA-ENLIL Heliospheric Simulations (flattened per cmeInput, Earth-GB, Kp)",
      sql: `CREATE TABLE IF NOT EXISTS wsa_enlil_events (
  simulation_id           TEXT PRIMARY KEY,
  model_completion_time   TEXT,
  estimated_shock_arrival TEXT,
  is_earth_gb             INTEGER,
  rmin_re                 TEXT,
  kp90                    INTEGER,
  kp135                   INTEGER,
  kp180                   INTEGER,
  cme_id                  TEXT,
  latitude                REAL,
  longitude               REAL,
  speed                   INTEGER,
  half_angle              INTEGER,
  link                    TEXT
);`
    },
    {
      table: "query_cache",
      desc: "Client-Side Date Range Cache Index (9-feed hash)",
      sql: `CREATE TABLE IF NOT EXISTS query_cache (
  cache_key   TEXT PRIMARY KEY,
  start_date  TEXT,
  end_date    TEXT,
  cached_at   TEXT
);`
    }
  ];

  const teamMembers = [
    {
      name: "Kailash",
      role: "Lead Data Engineer & Backend Architect",
      avatarBg: "bg-cyan-600",
      tag: "Backend & Systems",
      contributions: [
        "Architected Scala 3 engine (V9.scala) — 9-way Future fan-out (CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSA) + 8 algorithms (Future, lat/lon trajectory, GOES tuple, Kp max, stats, 9-table persistence, daily binning, theming).",
        "Implemented high-throughput uPickle streaming for 9 DONKI feeds, 11-col CME (lat/lon/linked/enlil) and WSA flattened simulationID::cmeID.",
        "Designed 10-table SQLite schemas (9 feeds + cache) with 11-col CME, wsa_enlil, mpc/rbe/hss and ACID idempotent INSERT OR IGNORE/REPLACE.",
        "Engineered daily timeline aggregation (getDailyCounts/getUnifiedDates) and Windows batch launchers for spaceguard.jar."
      ],
      skills: ["Scala 3", "SQLite JDBC", "uPickle", "JVM Concurrency", "9-Feed Ingestion", "Data Architecture"]
    },
    {
      name: "SriViknesh",
      role: "Frontend Architect & Visualization Lead",
      avatarBg: "bg-amber-600",
      tag: "Frontend & Analytics",
      contributions: [
        "Engineered React 18 + Vite 5 architecture — 8-phenomena dashboard, 6 palettes, light/dim/dark via sg_prefs, translucent pills, phenomena visibility filter.",
        "Built live deep-purple galaxy canvas (no image, purple/pink/blue clouds, 320 stardust, hyper stars, shooting stars, reduce-motion aware) + ECharts suite (CME direction scatter 2D, WSA arrival, daily timelines, Kp).",
        "Integrated sql.js WASM 9-table offline cache (9 feeds + cache), per-phenomenon JSON/CSV export, pagination, and ORBIT 9-table DB access (list fastest CME, WSA arrivals).",
        "Designed glassmorphic clean-card system, Settings sg_prefs persistence, and NOAA Kp-only threat logic with G-scale banner."
      ],
      skills: ["React 18", "Apache ECharts", "sql.js WASM 9 tables", "Tailwind CSS", "Vite 5", "Live Galaxy + Theming"]
    }
  ];

  return (
    <div className="space-y-8 py-4">
      
      {/* Header Banner */}
      <div className="clean-card p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 text-cyan-400 text-xs font-semibold border border-cyan-800/60">
              <BookOpen className="w-3.5 h-3.5" />
              SYSTEM ARCHITECTURE & ENGINE SPECIFICATIONS
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              SpaceGuard Telemetry Pipeline
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Complete technical specification for the SpaceGuard NASA DONKI platform — <strong className="text-cyan-300">Scala 3 Data Engine (<code className="text-cyan-400 font-mono">V9.scala</code>)</strong> with <strong>8 algorithms</strong> across <strong>9 DONKI feeds</strong> (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSA-ENLIL) → <strong>8 phenomena</strong>, <strong>9-feed SQLite (10 tables, 11-col CME)</strong>, deep-purple live galaxy canvas (no image), and <strong className="text-cyan-300">ORBIT AI Copilot (openrouter/free + 9-table DB access, 700 tokens)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Scala 3.3+ &bull; React 18 &bull; 9-Feed SQLite &bull; 8 Phenomena &bull; Live Galaxy</span>
          </div>
        </div>

        {/* Navigation Tabs (Single Line) */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-slate-800 overflow-x-auto pb-0.5">
          {[
            { id: 'algorithms', label: '8 Algorithms', icon: Code2 },
            { id: 'theory', label: 'Space Weather Theory', icon: Atom },
            { id: 'architecture', label: 'Architecture', icon: Workflow },
            { id: 'packages', label: 'Scala Packages', icon: Server },
            { id: 'techstack', label: 'Tech Stack', icon: Layers },
            { id: 'database', label: 'SQLite Schemas', icon: Database },
            { id: 'endpoints', label: 'DONKI API', icon: Globe },
            { id: 'orbit', label: 'ORBIT AI', icon: Bot },
            { id: 'team', label: 'Engineering Team', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: 6 CORE ALGORITHMS */}
      {activeTab === 'algorithms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">The 8 Analytical & Processing Algorithms</h2>
              <p className="text-xs text-slate-400 mt-0.5">Implemented in <code className="text-cyan-400 font-mono">scala/V9.scala</code> (+ <code className="text-cyan-400 font-mono">donkiApi.js:150 fetchAllSpaceWeather 9-feed</code> + <code className="text-cyan-400 font-mono">DashboardPage.jsx:678 daily timeline</code>) and mirrored reactively</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
              8 / 8 Algorithms Active
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {algorithms.map((algo) => (
              <div key={algo.id} className="clean-card p-6 flex flex-col gap-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-cyan-950/70 text-cyan-400 font-bold text-xs flex items-center justify-center border border-cyan-800/60">
                        {algo.id}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{algo.name}</h3>
                        <span className="text-[11px] text-cyan-400 font-mono font-medium">{algo.tag}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700/60 whitespace-nowrap">
                      {algo.complexity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {algo.description}
                  </p>
                </div>

                <div className="relative rounded-xl bg-slate-900 p-3.5 overflow-hidden font-mono text-[11px] text-slate-200 border border-slate-800">
                  <button
                    onClick={() => handleCopy(algo.code, `algo-${algo.id}`)}
                    className="absolute top-2.5 right-2.5 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Copy Code"
                  >
                    {copiedIndex === `algo-${algo.id}` ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <pre className="overflow-x-auto leading-relaxed text-[10.5px]">
                    <code>{algo.code}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SPACE WEATHER THEORY (5 PHENOMENA EXPLAINED) */}
      {activeTab === 'theory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Astrophysical & Space Weather Theory</h2>
              <p className="text-xs text-slate-400 mt-0.5">Scientific fundamentals, physical generation mechanisms, and terrestrial impact models for all 9 DONKI feeds — 8 phenomena + WSA-ENLIL prediction</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
              9 DONKI Feeds Explained
            </span>
          </div>

          <div className="space-y-6">
            {theoryPhenomena.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="clean-card p-6 sm:p-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{item.title}</h3>
                        <span className="text-[11px] font-mono font-semibold text-cyan-400">{item.badge}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-900 text-cyan-300 border border-slate-700/60">
                      NASA DONKI Feed
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 font-medium italic leading-relaxed">
                    "{item.tagline}"
                  </p>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {item.overview}
                  </p>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Physical Dynamics & Ingestion Parameters
                    </span>
                    <ul className="space-y-1.5 font-sans text-xs text-slate-200">
                      {item.physics.map((p, pidx) => (
                        <li key={pidx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-950/70/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Operational Hazard & Earth Impact: </strong>
                      <span>{item.hazard}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ARCHITECTURE & HOW IT WORKS */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="clean-card p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">How the SpaceGuard System Works</h2>
              <p className="text-xs text-slate-400 mt-0.5">End-to-end data telemetry pipeline from NASA sensors to local SQLite storage and Apache ECharts</p>
            </div>

            {/* Workflow Pipeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                {
                  step: "01",
                  title: "Date Invariant Validation",
                  desc: "Validates YYYY-MM-DD formats and temporal order (start <= end). Prevents invalid NASA gateway calls.",
                  icon: Shield,
                  color: "teal"
                },
                {
                  step: "02",
                  title: "SQLite Cache Lookup",
                  desc: "Inspects client-side query_cache table. If dates were previously queried, loads instant zero-API-cost telemetry.",
                  icon: Database,
                  color: "indigo"
                },
                {
                  step: "03",
                  title: "Parallel DONKI Ingestion (9-feed)",
                  desc: "Asynchronously queries 9 DONKI endpoints (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations) via Scala Future 9-way + JS Promise.allSettled(9).",
                  icon: Zap,
                  color: "amber"
                },
                {
                  step: "04",
                  title: "Analysis & Reduction (8 algorithms)",
                  desc: "Runs 8 algorithms: GOES ranking, CME trajectory (lat/lon), peak Kp, statistics, 9-table persistence, daily timeline aggregation, theming/visibility.",
                  icon: Cpu,
                  color: "purple"
                },
                {
                  step: "05",
                  title: "Render & Persistence",
                  desc: "Visualizes in Apache ECharts, calculates NOAA alerts, and saves records into SQLite database idempotently.",
                  icon: BarChart3,
                  color: "emerald"
                }
              ].map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-900/80 text-cyan-300 border border-slate-800">
                          {stage.step}
                        </span>
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white">{stage.title}</h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dual Backend & Frontend Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <div className="p-5 rounded-2xl bg-cyan-950/70/50 border border-cyan-800/60 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Scala 3 Data Engine — 9-Feed & 8-Algorithm
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  <code className="text-cyan-300 font-mono">scala/V9.scala</code> → <code className="text-cyan-300 font-mono">scala/spaceguard.jar</code> — 9-way <code className="text-cyan-300 font-mono">Future</code> fan-out (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations) + 8 algorithms (Future composition, lat/lon trajectory, GOES tuple-rank, Kp max-reduce, stats groupBy, 9-table transactional persistence with <code className="text-cyan-300 font-mono">INSERT OR IGNORE</code>, daily binning, theming). Persists to <code className="text-cyan-300 font-mono">database/spaceguard.db</code> — 10 tables (9 feeds + cache, cme_events 11 cols, wsa_enlil flattened <code className="text-cyan-300 font-mono">simulationID::cmeID</code>).
                </p>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10.5px]">
                  <code>java --enable-native-access=ALL-UNNAMED -jar scala/spaceguard.jar 2026-08-01 2026-08-30</code>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-3">
                <div className="flex items-center gap-2 text-cyan-900 font-bold text-sm">
                  <Globe className="w-4 h-4 text-cyan-700" />
                  React 18 + sql.js — 8 Phenomena & Live Galaxy
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Mirrors 8 Scala algorithms in JS: <code className="text-cyan-800 font-mono">Promise.allSettled(9)</code> + <code className="text-cyan-800 font-mono">getDailyCounts/getUnifiedDates</code> for 8 phenomena (geomagnetic 5-line, Flare→CME→SEP, RBE/HSS/MPC timelines, WSA arrival, 2D direction scatter). <code className="text-cyan-800 font-mono">sql.js</code> WASM — 9 tables + cache, 6 palettes, 8-visibility filter; live deep-purple galaxy canvas (no image, `GalaxyBackground.jsx` canvas) + translucent pills & dark/light themes via <code className="text-cyan-800 font-mono">sg_prefs</code>.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10.5px]">
                  <code>npm run dev &bull; Vite 5 + ECharts 5 + sql.js WASM (9 tables) + 8 phenomena</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SCALA PACKAGES & DEPENDENCIES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Scala Packages & Framework Dependencies</h2>
              <p className="text-xs text-slate-400 mt-0.5">Runtime dependencies, libraries, and language modules utilized in <code className="text-cyan-400 font-mono">V9.scala</code></p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
              6 Modules Specified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg, idx) => (
              <div key={idx} className="clean-card p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
                      {pkg.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                  <code className="block p-2 rounded-lg bg-slate-900 text-cyan-300 border border-slate-800 font-mono text-[10.5px]">
                    {pkg.directive}
                  </code>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {pkg.purpose}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Capabilities</span>
                  <ul className="space-y-1">
                    {pkg.features.map((feat, fidx) => (
                      <li key={fidx} className="text-[11px] text-slate-200 flex items-center gap-1.5 font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TECH STACK MATRIX */}
      {activeTab === 'techstack' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Complete Technology Stack Matrix</h2>
            <p className="text-xs text-slate-400 mt-0.5">Overview of technologies, frameworks, libraries, and protocols across all system tiers</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techStack.map((tier, idx) => (
              <div key={idx} className="clean-card p-6 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">{tier.layer}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tier.items.map((item, iidx) => (
                    <div key={iidx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                        {item.name}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SQLITE DDL SCHEMAS */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">SQLite Relational Database Schemas</h2>
              <p className="text-xs text-slate-400 mt-0.5">Identical DDLs implemented in both <code className="text-cyan-400 font-mono">spaceguard.db</code> and in-browser <code className="text-cyan-400 font-mono">sql.js</code> engine</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-purple-950/70 text-purple-400 rounded-full border border-purple-800/60">
              10 Tables Active (9 feeds + cache)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schemas.map((schema, idx) => (
              <div key={idx} className="clean-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-white font-mono">{schema.table}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700/60 font-mono">SQLite 3</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight mb-3">{schema.desc}</p>
                </div>

                <div className="relative rounded-xl bg-slate-900 p-3 overflow-hidden font-mono text-[10.5px] text-slate-200">
                  <button
                    onClick={() => handleCopy(schema.sql, `schema-${idx}`)}
                    className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                    title="Copy DDL"
                  >
                    {copiedIndex === `schema-${idx}` ? (
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <pre className="overflow-x-auto leading-relaxed">
                    <code>{schema.sql}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: NASA DONKI ENDPOINTS */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">NASA DONKI REST API Gateway</h2>
            <p className="text-xs text-slate-400 mt-0.5">9 Official Space Weather Data Feeds — 8 phenomena + WSA-ENLIL predictions (NASA GSFC + CCMC Kauai)</p>
          </div>

          <div className="space-y-4">
            {[
              {
                name: "Coronal Mass Ejections (CME)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME",
                altEndpoint: "https://api.nasa.gov/DONKI/CME",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Fetches solar plasma ejections, radial trajectory analyses, half-angles, speeds, latitude/longitude, linkedEvents and enlilList Earth-GB predictions."
              },
              {
                name: "Solar Flares (FLR)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR",
                altEndpoint: "https://api.nasa.gov/DONKI/FLR",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Queries GOES X-ray solar flare events, class designations (A, B, C, M, X), solar source active regions, and peak emission timestamps."
              },
              {
                name: "Geomagnetic Storms (GST)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/GST",
                altEndpoint: "https://api.nasa.gov/DONKI/GST",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Retrieves planetary geomagnetic storm events and multi-observatory planetary Kp index time-series matrices."
              },
              {
                name: "Solar Energetic Particles (SEP)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/SEP",
                altEndpoint: "https://api.nasa.gov/DONKI/SEP",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Provides high-energy proton flux detection events, instrument sensor telemetry, and linked CME identifiers."
              },
              {
                name: "Interplanetary Shocks (IPS)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/IPS",
                altEndpoint: "https://api.nasa.gov/DONKI/IPS",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Monitors heliospheric shock wave crossings at Lagrange point L1 instruments (ACE, DSCOVR, SOHO)."
              },
              {
                name: "Magnetopause Crossings (MPC)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/MPC",
                altEndpoint: "https://api.nasa.gov/DONKI/MPC",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Magnetopause boundary crossings from SWMF model — eventTime, MODEL: SWMF instrument, linkedEvents (CME/GST/IPS/HSS)."
              },
              {
                name: "Radiation Belt Enhancements (RBE)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/RBE",
                altEndpoint: "https://api.nasa.gov/DONKI/RBE",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Outer belt >2 MeV electron flux enhancements (GOES-P SEISS) — daily RBE count used as electron flux proxy, linked to HSS/GST."
              },
              {
                name: "High-Speed Streams (HSS)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/HSS",
                altEndpoint: "https://api.nasa.gov/DONKI/HSS",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Coronal-hole high-speed solar wind streams — DSCOVR PLASMAG / ACE SWEPAM/MAG / STEREO PLASTIC, daily HSS count as wind-speed proxy."
              },
              {
                name: "WSA-ENLIL Simulations (WSAEnlilSimulations)",
                endpoint: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/WSAEnlilSimulations",
                altEndpoint: "https://api.nasa.gov/DONKI/WSAEnlilSimulations",
                params: "startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&api_key=KEY",
                desc: "Heliospheric MHD predictions per CME input — flattened per cmeInput: simulationID::cmeID, latitude/longitude/speed/halfAngle, estimatedShockArrivalTime, isEarthGB, kp_90/135/180, rmin_re, impactList."
              }
            ].map((feed, idx) => (
              <div key={idx} className="clean-card p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                    {feed.name}
                  </h3>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 font-semibold">
                    HTTP GET REST
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">{feed.desc}</p>

                <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                  <div className="text-cyan-400">CCMC Endpoint: <span className="text-slate-300">{feed.endpoint}</span></div>
                  <div className="text-amber-400">NASA API Endpoint: <span className="text-slate-300">{feed.altEndpoint}</span></div>
                  <div className="text-slate-400 text-[10px]">Parameters: <span className="text-slate-400">{feed.params}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: ORBIT AI COPILOT (NEW) */}
      {activeTab === 'orbit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">ORBIT — AI Space Weather Copilot (9-Feed DB Aware)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Renamed from SpaceGuard AI → ORBIT. <code className="text-cyan-400 font-mono">openrouter/free</code> auto-router + Gemma fallbacks + <strong className="text-cyan-300">9-table DB access</strong> (list fastest CME, WSA Earth arrivals, DB counts) across 8 phenomena. Pure React, no HTML rerouting.</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">openrouter/free · 700 tokens · temp 0.3 · 9 tables</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-cyan-400" /> Identity & Branding</h3>
              <p className="text-xs text-slate-300 leading-relaxed">ORBIT is the conversational layer of SpaceGuard. Formerly SpaceGuard AI, now <strong className="text-white">ORBIT</strong> in all greetings, headers, and system prompts. Platform remains SpaceGuard; AI is ORBIT.</p>
              <div className="p-3 rounded-xl bg-slate-900 font-mono text-[11px] text-slate-200">
                <div>Header: <span className="text-cyan-300">ORBIT</span> · <span className="text-slate-400">openrouter/free · OpenRouter</span></div>
                <div>Launcher: <span className="text-cyan-300">ORBIT</span> Solar Telemetry Copilot</div>
                <div>Greeting: <span className="text-slate-400">👋 Hello! I am ORBIT…</span></div>
              </div>
            </div>

            <div className="clean-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Model Router (Sep 2026 fix)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">qwen/qwen3-8b:free is now paid-only (404). ORBIT uses resilient router with sequential fallbacks.</p>
              <code className="block p-2 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px]">const OPENROUTER_MODEL = 'openrouter/free';<br/>const OPENROUTER_FALLBACK_MODELS = [<br/>&nbsp;&nbsp;'google/gemma-4-26b-a4b-it:free',<br/>&nbsp;&nbsp;'google/gemma-4-31b-it:free',<br/>&nbsp;&nbsp;'meta-llama/llama-3.2-3b-instruct:free',<br/>&nbsp;&nbsp;'openai/gpt-oss-20b:free'<br/>];</code>
              <p className="text-[11px] text-slate-400 mt-1">On 404/400 model error, retries next fallback until success; surfaces auth vs model error in chat before local fallback.</p>
            </div>
          </div>

          <div className="clean-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Key className="w-4 h-4 text-cyan-400" /> Key Management — Chat Injection Removed</h3>
            <p className="text-xs text-slate-300 leading-relaxed">API key injection in chat removed per request. Manage only via <strong className="text-white">Settings → ORBIT AI Copilot</strong> or <code className="text-cyan-400 font-mono">.env</code> <code className="text-slate-400 font-mono">VITE_OPENROUTER_API_KEY=sk-or-v1-...</code>. Effective resolver:</p>
            <code className="block p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">getEffectiveOrbitKey(prop) → prop → localStorage('openrouter_api_key') → import.meta.env.VITE_OPENROUTER_API_KEY</code>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> SettingsPage and App.jsx hydrate via useEffect sync; ChatbotSidebar is read-only.</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Chat header shows <span className="font-mono text-cyan-300">ORBIT · openrouter/free</span> when key present else <span className="font-mono">Built-in Engine (no key)</span>.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="clean-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-400" /> Prompt & Conciseness (CME fix)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Simple definitions like <code className="text-cyan-400 font-mono">what are CME Events?</code> now return 80-120 words, 3-5 bullets, no tables. Live telemetry dump only when user asks <code className="text-cyan-400 font-mono">current/live/summary/status</code>.</p>
              <code className="block p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] whitespace-pre-wrap">temperature: 0.3, max_tokens: 700{'\n'}G-scale is Kp-only: G1≥5 G2≥6 G3≥7 G4≥8 G5≥9{'\n'}CME speed / M-X flares ≠ G-scale (R-scale)</code>
              <p className="text-[11px] text-slate-400">Previous verbose dump (139 events + 4 tables) truncated at 450 tokens mid-sentence — now fixed.</p>
            </div>

            <div className="clean-card p-6 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-rose-400" /> Threat Logic Fix (G3 false alarm)</h3>
              <p className="text-xs text-slate-300 leading-relaxed"><code className="text-cyan-400 font-mono">DashboardPage.jsx:136</code> was <code className="text-amber-300 font-mono">maxKp≥7 || hasMFlare → G3</code> → any M-flare forced Strong G3 even with <code className="text-cyan-300 font-mono">maxKp 0.00</code>. Now Kp-only + separate flareRisk.</p>
              <code className="block p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">if (maxKp≥9) G5 else if (maxKp≥8) G4 else if (maxKp≥7) G3 … // CME/M-X not used</code>
              <p className="text-[11px] text-slate-400">ORBIT explains G3 correctly; local fallback for “why G3?” returns Kp-only rule in 4 bullets.</p>
            </div>
          </div>

          <div className="clean-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Terminal className="w-4 h-4 text-cyan-400" /> Call Flow</h3>
            <code className="block p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px]">DashboardPage (lifts openRouterApiKey) → ChatbotSidebar (getEffectiveOrbitKey){'\n'}→ fetch https://openrouter.ai/api/v1/chat/completions (openrouter/free){'\n'}→ on 404 retry fallbacks → on 401/403 surface auth error → fallback local engine (ORBIT concise CME / why-G3 branches)</code>
          </div>

          <div className="clean-card p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Database className="w-4 h-4 text-cyan-400" /> 9-Feed DB Access & Phenomena Coverage (New)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">ORBIT local fallback now reads <code className="text-cyan-400 font-mono">data</code> (live 9 feeds: CME/FLR/GST/SEP/IPS/MPC/RBE/HSS/WSA) + <code className="text-cyan-400 font-mono">sqliteCounts</code> (persisted 10 tables) to answer <strong className="text-white">“how many in DB?”</strong>, <strong className="text-white">“list fastest CME”</strong>, <strong className="text-white">“WSA Earth arrivals”</strong> with sample rows. System prompt injects live window (9 counts, peak speed, Earth-GB, maxKp) + DB totals + 8-phenomena table + G-scale Kp-only rule.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <code className="block p-2 rounded-lg bg-slate-900 text-cyan-300 border border-slate-800">Live: CME 141 · SEP 8 · RBE 2 · HSS 6 · IPS 10 · MPC 0 · GST n · WSA n</code>
              <code className="block p-2 rounded-lg bg-slate-900 text-purple-300 border border-slate-800">DB: cmes/flares/storms/seps/ipss/mpcs/rbes/hss/wes/queries via getSQLiteCounts()</code>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-300">
              <li className="flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Phenomena deep dives: What is MPC/RBE/HSS/WSA? Best viz per table.</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> List intents: “list 3 MPC” / “show HSS” → samples from live `data.mpcs/hss/rbes/wes`.</li>
              <li className="flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Greeting updated to 9 feeds / 8 phenomena + DB hints.</li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 9: ENGINEERING TEAM */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">SpaceGuard Engineering Team</h2>
              <p className="text-xs text-slate-400 mt-0.5">Core developers and systems architects behind the SpaceGuard space weather monitoring platform</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              2 Core Contributors
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="clean-card p-6 space-y-5 flex flex-col justify-between hover:border-cyan-400 transition-all">
                <div className="space-y-4">
                  
                  {/* Member Profile Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${member.avatarBg} text-white flex items-center justify-center font-bold text-xl shadow-md`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700/60 font-mono">
                          {member.tag}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">{member.role}</p>
                    </div>
                  </div>

                  {/* Contributions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Key Contributions</span>
                    <ul className="space-y-2">
                      {member.contributions.map((c, cidx) => (
                        <li key={cidx} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Skills Badges */}
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Technical Competencies</span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill, sidx) => (
                      <span key={sidx} className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700/60 text-[11px] font-mono font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Collaborative Vision Banner */}
          <div className="clean-card p-6 bg-gradient-to-r from-teal-50/70 via-white to-amber-50/70 border border-cyan-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-cyan-700/60 text-cyan-400 shadow-sm">
                <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Co-Developed by Kailash & SriViknesh</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  9-feed DONKI intelligence (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSA-ENLIL) → 8 phenomena, 8 algorithms, 10-table SQLite (9 feeds + cache), live deep-purple galaxy (no image), 6 palettes & ORBIT 9-table DB-aware AI.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-cyan-700/60 whitespace-nowrap">
              VIT Python & Data Systems Project
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
