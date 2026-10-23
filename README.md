# 🌌 SpaceGuard — NASA DONKI Telemetry & Space Weather Intelligence

<p align="center">
  <img src="https://img.shields.io/badge/Vite-5.x-purple?logo=vitejs" />
  <img src="https://img.shields.io/badge/React-18-blue?logo=react" />
  <img src="https://img.shields.io/badge/Scala-3.3-red?logo=scala" />
  <img src="https://img.shields.io/badge/Data-NASA%20DONKI-blue" />
  <img src="https://img.shields.io/badge/Charts-Apache%20ECharts-orange" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

**SpaceGuard** is a professional space weather intelligence platform that transforms raw NASA DONKI telemetry into interactive visual analytics, event relationships, hazard insights, and **AI-assisted exploration powered by ORBIT**.

---

## 🏗️ System Architecture

SpaceGuard intentionally separates the **Scala data-engineering engine** from the **React dashboard**. Unlike traditional client-server apps, these are sibling processes designed for maximum data throughput and zero-latency UI.

### 📉 Technical Flowchart
```mermaid
graph TD
    User((User)) --> Dashboard[React Dashboard]
    Dashboard --> Dates[Date Range Selection]
    
    Dates --> Cache{Cached Range?}
    Cache -- Yes --> WASM[sql.js Browser SQLite]
    Cache -- No --> API[NASA DONKI APIs]
    
    API --> Norm[Telemetry Normalization]
    Norm --> WASM
    
    WASM --> Model[React Data Model]
    Model --> Charts[Apache ECharts]
    Model --> ORBIT[ORBIT AI Assistant]
    ORBIT --> User((User))
    
    subgraph "Scala Data Engine (Backend)"
        S_Engine[Scala Engineering Engine] --> S_API[NASA DONKI APIs]
        S_API --> S_DB[(SQLite JDBC)]
    end
    
    S_DB -.->|Optional Export/Sync| WASM
```

---

## 🛠️ Core Systems Deep-Dive

### 🛰️ How DONKI Integration Works
The system integrates 9 distinct NASA feeds, mapping them into **8 Space Weather Phenomena**. 
- **The Process**: The Scala Engine performs a parallel "Fan-Out" fetch $\rightarrow$ applies **Temporal Chunking** (splitting large ranges to avoid HTTP 400) $\rightarrow$ normalizes raw JSON into a strictly typed relational model.
- **Phenomena Mapped**: 
  - **CME & WSA-ENLIL**: Tracking plasma ejections and shock arrival.
  - **Solar Flares**: Logarithmic intensity ranking (A $\rightarrow$ X class).
  - **Geomagnetic Storms**: Kp-index reduction to derive NOAA G-Scale threats.
  - **SEP, IPS, MPC, RBE, HSS**: High-energy particle and wind stream telemetry.

### 🚀 Mission Control (The SITREP)
**Mission Control** is the platform's high-level situational awareness hub. It provides a "SITREP" (Situation Report) by aggregating:
- **Global Threat Score**: A calculated 0-100 score based on current solar activity.
- **NOAA G-Scale**: Real-time classification of geomagnetic intensity.
- **Anomaly Detection**: Flagging "Outlier" events that deviate from the window mean.
- **Causal Chains**: Mapping the sequence: `Flare` $\rightarrow$ `CME` $\rightarrow$ `Solar Wind` $\rightarrow$ `Storm`.

---

## 🤖 ORBIT Reasoning Engine

ORBIT is the platform&apos;s **Hybrid Intelligence Layer** that bridges raw telemetry data with human understanding:

### 🎯 Core Architecture
1. **Intent Classification**: Every query is scored against an 11-intent taxonomy (`viz`, `dataQuery`, `briefing`, etc.)
2. **Deterministic Execution**: For data queries like &quot;Fastest CME?&quot;, ORBIT executes exact SQL-like filters achieving **0 API calls, 100% accuracy**
3. **Contextual Augmentation**: Complex questions trigger a **Compact Fact Block** generation, injecting current telemetry trends into LLMs via OpenRouter for grounded answers
4. **Route Visualization**: User requests for visual exploration automatically trigger `routeViz()` to navigate the dashboard to the correct tab

### 🚀 Advanced Capabilities
- **Zero-Hallucination Answers**: Pure data queries execute deterministically without external API calls
- **Contextual Intelligence**: Trend analysis and anomaly detection feed into LLM reasoning
- **Seamless UI Integration**: Automatic dashboard navigation for visual exploration
- **Multi-Intent Support**: Handles queries from simple facts to complex analytical briefings

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend** | Scala 3.3 / JVM | Parallel Ingestion, Data Reduction, Normalization |
| **Frontend** | React 18 / Vite 5 | Observability UI, State Orchestration |
| **Database** | SQLite / sql.js | Relational Storage (Local & WASM) |
| **Visualization**| Apache ECharts | Telemetry Plotting & Analytics |
| **Styling** | Tailwind CSS | Glassmorphic Design & Responsive Layout |
| **AI/LLM** | OpenRouter / Gemma | NLQ & Contextual Intelligence |

## 🏃 Getting Started

### Backend (Scala)
```bash
java --enable-native-access=ALL-UNNAMED -jar scala/spaceguard.jar 2026-01-01 2026-09-30
```

### Frontend (React)
```bash
npm install
npm run dev
```

---
**Developed by:** Kailash & SriViknesh  
**Project:** VIT Python & Data Systems Project
