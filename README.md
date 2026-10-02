# 🌌 SpaceGuard: NASA DONKI Space Weather Monitoring Platform

SpaceGuard is a high-precision telemetry platform designed to ingest, analyze, and visualize space weather data from NASA's **Database of Notifications, Knowledge, and Information (DONKI)**. It implements a symmetric asynchronous architecture, pairing a high-performance Scala 3 data engine with a reactive React 18 observability dashboard.

## 🚀 Key Features

### 🛰️ Data Engineering Pipeline
- **9-Feed Parallel Ingestion**: Concurrent fetching of CME, FLR, GST, SEP, IPS, MPC, RBE, HSS, and WSA-ENLIL feeds.
- **Temporal Chunking**: Automatic splitting of date ranges $>30$ days into sub-windows to prevent NASA API HTTP 400 rejections.
- **Idempotent Persistence**: A 10-table SQLite schema utilizing `INSERT OR IGNORE` for ACID-compliant data storage.
- **High-Throughput Parsing**: Leverages `uPickle` in Scala for zero-reflection JSON processing.

### 📊 Observability Dashboard
- **Multi-Phenomena Analysis**: Visualizations for 8 distinct space weather phenomena.
- **Advanced Charting**: 2D direction scatter plots (Lat/Lon), peak Kp area charts, and unified daily timelines via **Apache ECharts**.
- **Immersive UI**: A glassmorphic design featuring a **Live Galaxy Canvas** (procedural stardust and nebula clouds) and custom theming palettes.
- **WASM Mirroring**: Uses `sql.js` to maintain a browser-side mirror of the SQLite database for zero-latency filtering.

### 🤖 ORBIT AI Intelligence Layer
- **Hybrid Reasoning**: Combines a deterministic intent classifier with LLM augmentation (via OpenRouter).
- **Natural Language Queries (NLQ)**: Convert plain-text questions into precise DB queries or visualization routes.
- **Contextual Briefings**: Generates authoritative summaries based on real-time telemetry rather than recalled training data.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Scala 3.3 / JVM | Parallel Ingestion, Data Reduction, Normalization |
| **Frontend** | React 18 / Vite 5 | Observability UI, State Orchestration |
| **Database** | SQLite / sql.js | Relational Storage (Local & WASM) |
| **Visualization**| Apache ECharts | Telemetry Plotting & Analytics |
| **Styling** | Tailwind CSS | Glassmorphic Design & Responsive Layout |
| **AI/LLM** | OpenRouter / Gemma | NLQ & Contextual Intelligence |

## 📐 System Architecture

`NASA DONKI API` $\rightarrow$ `Scala Engine (Temporal Chunking)` $\rightarrow$ `SQLite (10 Tables)` $\rightarrow$ `React Frontend (sql.js Mirror)` $\rightarrow$ `ECharts Visualization`

## 🏃 Getting Started

### Backend (Scala)
1. Ensure Java 17+ is installed.
2. Run the compiled JAR:
   ```bash
   java --enable-native-access=ALL-UNNAMED -jar scala/spaceguard.jar 2026-01-01 2026-09-30
   ```

### Frontend (React)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 API Endpoints Integrated
- **CME**: Coronal Mass Ejections
- **FLR**: Solar Flares
- **GST**: Geomagnetic Storms
- **SEP**: Solar Energetic Particles
- **IPS**: Interplanetary Shocks
- **MPC**: Magnetopause Crossings
- **RBE**: Radiation Belt Enhancements
- **HSS**: High-Speed Streams
- **WSA**: WSA-ENLIL Heliospheric Predictions

---
**Developed by:** Kailash & SriViknesh  
**Project:** VIT Python & Data Systems Project
