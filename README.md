<div align="center">
  <h1>Cold Mirror Client</h1>
  <p>A standalone desktop overlay application for iRacing.</p>

  <p>
    <a href="https://github.com/0resuto/cold-mirror-client/actions/workflows/lint.yml"><img src="https://github.com/0resuto/cold-mirror-client/actions/workflows/lint.yml/badge.svg" alt="Lint Status" /></a>
    <img src="https://img.shields.io/github/license/0resuto/cold-mirror-client" alt="License" />
    <a href="https://github.com/0resuto/cold-mirror-client/releases/latest"><img src="https://img.shields.io/github/v/release/0resuto/cold-mirror-client?include_prereleases" alt="Release" /></a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/Electron-191970?logo=electron&logoColor=white" alt="Electron" />
    <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  </p>
</div>

---

## Overview

Cold Mirror Client provides transparent, telemetry widgets (such as Live Standings, Relatives, and Fuel tracking) that overlay directly on top of the iRacing simulator. 

It runs as a fully independent application, reading iRacing shared memory via `irsdk-node` without requiring an external backend or database.

## Architecture

`cold-mirror-widgets` is an Electron app that reads live telemetry from the iRacing SDK in the main process and streams it to a dashboard window plus any number of overlay windows via IPC.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '14px' }}}%%
flowchart LR
    subgraph MAIN["🖥️ Main Process"]
        direction TB
        SDK(["iRacing SDK<br/>Shared Memory"])
        TS["TelemetryService<br/><sub>telemetry.js</sub>"]
        WM{{"WindowManager<br/><sub>windowManager.js</sub>"}}
        ST[("Store<br/><sub>store.js · JSON</sub>")]

        SDK -->|"poll @ ~30fps"| TS
        TS --> WM
        WM --> ST
    end

    PL{{"preload.js<br/><sub>contextBridge</sub>"}}

    subgraph DASH["📊 Renderer · Dashboard"]
        direction TB
        DB["Dashboard.jsx"]
        AS[["useAppStore<br/><sub>Zustand</sub>"]]
        WC["WidgetCard.jsx"]

        DB --> AS --> WC
    end

    subgraph OVERLAY["🪟 Renderer · Overlay N"]
        direction TB
        LT["useLiveTelemetryIPC"]
        LS[["useLiveStore<br/><sub>Zustand</sub>"]]
        TBR["TelemetryBridge"]
        TP["TelemetryProvider<br/><sub>shared widgets package</sub>"]
        W(["Widget Components<br/><sub>Speed, Fuel, …</sub>"])

        LT --> LS --> TBR --> TP --> W
    end

    WM ==>|"broadcast telemetry & session"| PL
    PL -.->|"settings update"| AS
    PL -.->|"telemetry update"| LT
    WC -->|"control actions"| PL
    PL ==>|"ipc send"| WM

    classDef core fill:#E3F2FD,stroke:#1565C0,stroke-width:1.5px,color:#0D47A1
    classDef bridge fill:#FFF3E0,stroke:#E65100,stroke-width:1.5px,color:#E65100
    classDef app fill:#E8F5E9,stroke:#2E7D32,stroke-width:1.5px,color:#1B5E20
    classDef overlay fill:#F3E5F5,stroke:#6A1B9A,stroke-width:1.5px,color:#4A148C
    classDef diskstore fill:#FCE4EC,stroke:#AD1457,stroke-width:1.5px,color:#880E4F
    classDef memstore fill:#FFFDE7,stroke:#F9A825,stroke-width:1.5px,color:#F57F17

    class SDK,TS,WM core
    class PL bridge
    class DB,WC app
    class LT,TBR,TP,W overlay
    class ST diskstore
    class AS,LS memstore

    style MAIN fill:#FAFAFA,stroke:#90A4AE,stroke-width:1px
    style DASH fill:#FAFAFA,stroke:#90A4AE,stroke-width:1px
    style OVERLAY fill:#FAFAFA,stroke:#90A4AE,stroke-width:1px
```

<sub>Legend</sub>

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'fontSize': '12px' }}}%%
flowchart TB
    A[" "] ==>|"Primary IPC channel"| B[" "]
    C[" "] -.->|"Subscription callback"| D[" "]
    E[" "] -->|"Direct call / data flow"| F[" "]
    G[("On-disk store")]
    H[["In-memory state · Zustand"]]

    classDef diskstore fill:#FCE4EC,stroke:#AD1457,stroke-width:1.5px,color:#880E4F
    classDef memstore fill:#FFFDE7,stroke:#F9A825,stroke-width:1.5px,color:#F57F17
    class G diskstore
    class H memstore

    style A fill:none,stroke:none
    style B fill:none,stroke:none
    style C fill:none,stroke:none
    style D fill:none,stroke:none
    style E fill:none,stroke:none
    style F fill:none,stroke:none
```

**Data flow, in short:**
1. `TelemetryService` polls the iRacing shared-memory SDK and forwards frames to `WindowManager`.
2. `WindowManager` broadcasts telemetry and session info to every renderer through `preload.js`'s `contextBridge`.
3. The **Dashboard** renderer keeps settings/overlay state in `useAppStore` and sends control actions back through the same bridge.
4. Each **Overlay** renderer consumes the live stream via `useLiveTelemetryIPC` → `useLiveStore` → `TelemetryBridge` → `TelemetryProvider`, which feeds the individual widget components.

## Getting Started

### Prerequisites

- Node.js
- iRacing (running to provide telemetry data)

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   > Launches the Vite development server and the Electron application concurrently.

## Build

Compile executables for distribution:

```bash
npm run build
```
> Outputs are generated in the `dist` and `release` directories.
