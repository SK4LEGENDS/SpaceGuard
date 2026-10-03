import React, { useState } from 'react';
import ArchitectureFlow from './ArchitectureFlow';
import { 
  Cpu, Database, BookOpen, Check, Copy, Globe, Layers, 
  Workflow, Zap, Shield, Code2, Server, BarChart3, Binary, ArrowRight,
  Terminal, Sparkles, CheckCircle2, Users, Award, Code, Heart, Star, Compass,
  Sun, ShieldAlert, Activity, Atom, Flame, Magnet, Radio, Orbit, Gauge, Bot, Key, Wind,
  Sigma, GitBranch, TrendingUp, MessageSquare, LineChart, Navigation, Wrench, Brain
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
       description: "Dispatches 9 concurrent non-blocking HTTP GET to NASA DONKI (CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations) via Scala Future monadic composition + ForkJoinPool. Mirrored in JS via Promise.allSettled(9) with an added Temporal Chunking layer that automatically splits ranges >30 days into sub-windows to prevent API HTTP 400 rejections. Global 120s Await barrier, CCMC Kauai fallback.",
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
// JS mirror: async fetchDonkiEndpoint() { if (diff > 30) return chunkAndMerge(); ... }`

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
        { name: "ORBIT Intelligence Layer", desc: "9 capabilities (NLQ, calc, correlation, trends, briefing, viz routing, explanation, context, fallback) over orbitEngine.js + openrouter/free augmentation, 10-table DB, 700 tokens, Kp-only G-scale" }
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
        { name: "NASA DONKI 9 REST", desc: "CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, WSAEnlilSimulations (NASA GSFC + CCMC DONKI Data API)" },
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

  /** ORBIT v2 — the nine core capabilities and the engine module behind each. */
  const orbitCapabilities = [
    {
      id: 'nlq', name: 'Natural-Language Queries', icon: MessageSquare, tint: 'cyan',
      module: 'classify()',
      summary: 'Understands plain-language questions about SpaceGuard telemetry and maps them onto a feed, metric and operation.',
      detail: 'Scores every query against an 11-intent taxonomy with an explicit confidence value. Longest-alias-wins feed detection means "radiation belt" resolves to RBE rather than SEP. Below 0.5 confidence the engine defers to the legacy keyword chain rather than guessing — a confidently wrong answer is worse than a question.'
    },
    {
      id: 'analysis', name: 'Data Analysis', icon: Sigma, tint: 'emerald',
      module: 'runQuery() + stats()',
      summary: 'Performs real calculation over any of the 9 feeds: count, average, median, min/max, sum, standard deviation and filtered subsets.',
      detail: 'A generic table-query executor, not hardcoded answers. Filters rows by a comparator, aggregates over a numeric field, ranks, then returns the full distribution (n, mean, median, min, max, sum, σ) so every answer carries context — "2 CMEs above 1000 km/s" is always accompanied by the matched range.'
    },
    {
      id: 'correlation', name: 'Event Correlation', icon: GitBranch, tint: 'purple',
      module: 'buildCorrelations()',
      summary: 'Identifies causal and statistical relationships between CMEs, flares, geomagnetic storms, SEP and other events.',
      detail: 'Pearson r for CME speed vs. resulting Kp, flare→CME association rate, SEP→parent-CME linkage rate, and chain-completeness ratio. Chains are reconstructed as Flare → CME → Solar Wind → Storm → Radiation timelines with per-stage confidence.'
    },
    {
      id: 'compare', name: 'Comparison & Trends', icon: TrendingUp, tint: 'sky',
      module: 'buildTrends()',
      summary: 'Compares time periods, event types and telemetry metrics, with linear regression over CME velocity.',
      detail: 'Splits the requested window at its own midpoint (not at "now", so historical ranges compare correctly), then reports per-feed first-vs-second-half deltas and direction. CME velocity gets a least-squares slope per day to distinguish accelerating from decelerating.'
    },
    {
      id: 'briefing', name: 'Space-Weather Briefings', icon: ShieldAlert, tint: 'rose',
      module: 'buildFacts()',
      summary: 'Summarises significant activity into a concise current-dataset overview with threat assessment and hazard score.',
      detail: 'buildFacts() compacts the window into an authoritative key=value block (feed counts, DB totals, threat level, trends, correlations, chains, anomalies) injected into the system prompt. The model reasons over these numbers instead of re-deriving them, which is what keeps answers inside the 700-token budget.'
    },
    {
      id: 'viz', name: 'Visualization Assistance', icon: LineChart, tint: 'teal',
      module: 'routeViz()',
      summary: 'Resolves a query to the specific SpaceGuard view and tab that answers it, then actually navigates the user there.',
      detail: 'Explicit view requests ("mission control", "open the stage flow") override feed inference. Otherwise the named feed maps to its DashboardPage activeTab. The onNavigate callback in App.jsx reaches both the view router and tab state, so ORBIT moves the user rather than only naming a chart.'
    },
    {
      id: 'explain', name: 'Intelligent Explanation', icon: Brain, tint: 'amber',
      module: 'analysis.brief',
      summary: 'Converts complex telemetry and analytical output into clear, contextual explanations.',
      detail: 'Backed by the same telemetryAnalysis layer as Mission Control, so explanations are grounded in the actual rows. The NOAA G-scale rule is enforced as Kp-only in the prompt, and a style rule requires the model to state when a figure is unavailable rather than invent one.'
    },
    {
      id: 'context', name: 'Conversational Context', icon: MessageSquare, tint: 'cyan',
      module: 'resolveContext()',
      summary: 'Maintains context across follow-up questions so an event can be investigated naturally.',
      detail: 'The previous turn\'s intent, feed and metric are carried in a ref and inherited by follow-ups. "Why?" or "tell me more" after a CME-speed question keeps that subject instead of falling through to generic help. An explicitly named new subject overrides the inherited one.'
    },
    {
      id: 'fallback', name: 'Fallback Intelligence', icon: Wrench, tint: 'slate',
      module: 'generateLocalResponse()',
      summary: 'Continues answering telemetry questions through the local engine when external AI services are unavailable.',
      detail: 'Data queries and visualization routing are answered deterministically before any network call, so the most common questions work with no API key and cannot be affected by a 700-token LLM sample. The legacy keyword chain covers explanation, DB, engine and team branches when the router is unreachable.'
    }
  ];

  /** The five-stage engine pipeline, in execution order. */
  const orbitPipeline = [
    { step: '1', title: 'Classify', module: 'classify()', icon: MessageSquare, desc: 'Score the query against 11 intents, extract feed + metric + number, flag low confidence as a follow-up.' },
    { step: '2', title: 'Resolve Context', module: 'resolveContext()', icon: GitBranch, desc: 'Inherit intent / feed / metric from the previous turn when the query is a bare follow-up ("why?", "more").' },
    { step: '3', title: 'Answer Exactly', module: 'runQuery() / routeViz()', icon: Sigma, desc: 'Visualization and data-query intents are answered deterministically — 0 API calls, no token budget.' },
    { step: '4', title: 'Augment', module: 'buildFacts()', icon: Sparkles, desc: 'Everything else goes to OpenRouter with a compact authoritative facts block plus the full analysis brief.' },
    { step: '5', title: 'Degrade Gracefully', module: 'generateLocalResponse()', icon: Wrench, desc: 'On 404 / 401 / network failure, fall back through the model chain to the local engine so the user always gets an answer.' }
  ];

  const CAP_TINT = {
    cyan: 'text-cyan-400', emerald: 'text-emerald-400', purple: 'text-purple-400',
    sky: 'text-sky-400', rose: 'text-rose-400', teal: 'text-teal-400',
    amber: 'text-amber-400', slate: 'text-slate-400'
  };
  const CAP_CHIP = {
    cyan: 'border-cyan-800/60 bg-cyan-950/50 text-cyan-300',
    emerald: 'border-emerald-800/60 bg-emerald-950/50 text-emerald-300',
    purple: 'border-purple-800/60 bg-purple-950/50 text-purple-300',
    sky: 'border-sky-800/60 bg-sky-950/50 text-sky-300',
    rose: 'border-rose-800/60 bg-rose-950/50 text-rose-300',
    teal: 'border-teal-800/60 bg-teal-950/50 text-teal-300',
    amber: 'border-amber-800/60 bg-amber-950/50 text-amber-300',
    slate: 'border-slate-700 bg-slate-900 text-slate-300'
  };

  return (
    <div className="py-4">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vertical Sidebar Navigation */}
        <nav className="lg:w-64 shrink-0 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">
            Documentation
          </div>
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-600/20 text-cyan-300 border-l-4 border-cyan-500 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border-l-4 border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-8">
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
          </div>

          {/* Tab Contents */}
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

                      <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
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

          {activeTab === 'architecture' && (
            <div className="space-y-8">
              <ArchitectureFlow />
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">System Architecture</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  Design Patterns
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="clean-card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Workflow className="w-4 h-4" />
                    Data Flow Architecture
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    SpaceGuard utilizes a <strong>Symmetric Asynchronous</strong> architecture. The Scala Data Engine and React Dashboard are sibling processes that interact with the same data sources (NASA DONKI) but optimize for different needs: high-throughput batch ingestion (Scala) vs. low-latency interactive exploration (React).
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                    Sourcing → Normalization → SQLite Storage → ECharts Render
                  </div>
                </div>
                <div className="clean-card p-6 space-y-4">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                    <Database className="w-4 h-4" />
                    Persistence Layer
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    A hybrid SQLite strategy is employed. The backend uses <strong>SQLite JDBC</strong> for permanent file-based storage, while the frontend uses <strong>sql.js WASM</strong> to maintain a mirror of the current analysis window in browser memory for instant filtering and zero-latency re-renders.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
                    Local DB (.db) &lt;— API &gt;— Browser WASM (RAM)
                  </div>
                </div>
              </div>
              <div className="clean-card p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Component Hierarchy
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: "App Container", desc: "State Orchestrator & Router" },
                    { name: "Dashboard", desc: "Telemetry View & Filters" },
                    { name: "Mission Control", desc: "Situational Analysis" },
                    { name: "Event Timeline", desc: "Causal Chain Viewer" },
                    { name: "ORBIT Copilot", desc: "Intelligence Layer" },
                    { name: "Settings", desc: "User Prefs & Keys" },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Scala Dependencies & Packages</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  v3.3 Runtime
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packages.map((pkg) => (
                  <div key={pkg.name} className="clean-card p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                          <Server className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-white">{pkg.name}</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {pkg.category}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-500">
                      {pkg.directive}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{pkg.purpose}</p>
                    <div className="flex flex-wrap gap-2">
                      {pkg.features.map((f, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'techstack' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Full Technology Stack</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  Production Ready
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {techStack.map((layer) => (
                  <div key={layer.layer} className="clean-card p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-6 rounded-full bg-current ${layer.color === 'teal' ? 'text-teal-500' : layer.color === 'cyan' ? 'text-cyan-500' : layer.color === 'purple' ? 'text-purple-500' : 'text-amber-500'}`} />
                      <h3 className="text-sm font-bold text-white">{layer.layer}</h3>
                    </div>
                    <div className="space-y-3">
                      {layer.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/60">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-200">{item.name}</div>
                            <div className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">SQLite Storage Schema</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  Relational Model
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {schemas.map((s) => (
                  <div key={s.table} className="clean-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-bold text-white">{s.table}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{s.desc}</span>
                    </div>
                    <div className="relative rounded-xl bg-slate-950 p-4 overflow-hidden font-mono text-xs text-cyan-300 border border-slate-800">
                      <button
                        onClick={() => handleCopy(s.sql, `sql-${s.table}`)}
                        className="absolute top-2 right-2 p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                      >
                        {copiedIndex === `sql-${s.table}` ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <pre className="whitespace-pre-wrap">{s.sql}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'endpoints' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">NASA DONKI API Endpoints</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  REST Gateway
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { feed: "CME", ep: "CME", desc: "Coronal Mass Ejections" },
                  { feed: "FLR", ep: "FLR", desc: "Solar Flares" },
                  { feed: "GST", ep: "GST", desc: "Geomagnetic Storms" },
                  { feed: "SEP", ep: "SEP", desc: "Solar Energetic Particles" },
                  { feed: "IPS", ep: "IPS", desc: "Interplanetary Shocks" },
                  { feed: "MPC", ep: "MPC", desc: "Magnetopause Crossings" },
                  { feed: "RBE", ep: "RBE", desc: "Radiation Belt Enhancements" },
                  { feed: "HSS", ep: "HSS", desc: "High-Speed Streams" },
                  { feed: "WSA", ep: "WSAEnlilSimulations", desc: "WSA-ENLIL Prediction" },
                ].map((ep, i) => (
                  <div key={i} className="clean-card p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{ep.feed} {ep.desc}</div>
                        <div className="text-[10px] font-mono text-slate-500">/get/{ep.ep}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      GET / JSON
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orbit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">ORBIT AI Intelligence Layer</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  Reasoning Engine
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orbitCapabilities.map((cap) => (
                  <div key={cap.id} className="clean-card p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${CAP_TINT[cap.tint]}`}>
                        {React.createElement(cap.icon, { className: "w-5 h-5" })}
                      </div>
                      <h3 className="text-sm font-bold text-white">{cap.name}</h3>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-800/40 inline-block">
                      Module: {cap.module}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">{cap.summary}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{cap.detail}</p>
                  </div>
                ))}
              </div>
              <div className="clean-card p-6">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  ORBIT Execution Pipeline
                </h3>
                <div className="flex flex-col gap-4">
                  {orbitPipeline.map((step, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800 group hover:border-cyan-500/40 transition-all">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-slate-700 group-hover:bg-cyan-600 transition-colors">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{step.title}</span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/60">{step.module}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-400 transition-colors">
                        {React.createElement(step.icon, { className: "w-4 h-4" })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Engineering Team</h2>
                <span className="text-xs font-semibold px-3 py-1 bg-cyan-950/70 text-cyan-400 rounded-full border border-cyan-800/60">
                  Core Contributors
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamMembers.map((member) => (
                  <div key={member.name} className="clean-card p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${member.avatarBg} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                        <p className="text-xs text-slate-400 font-medium">{member.role}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        <Award className="w-3.5 h-3.5" />
                        Core Contributions
                      </div>
                      <ul className="space-y-2">
                        {member.contributions.map((c, i) => (
                          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                            <span className="text-cyan-500">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                          {s}
                        </span>
                          ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }
