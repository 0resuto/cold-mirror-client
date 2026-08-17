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

<img width="2216" height="1059" alt="Cold Mirror Widgets Playground" src="https://github.com/user-attachments/assets/97cf5eef-3a05-4823-ac9e-2ec1e526b789" />

## Overview

Cold Mirror Client provides transparent, telemetry widgets (such as Live Standings, Relatives, and Fuel tracking) that overlay directly on top of the iRacing simulator. 

It runs as a fully independent application, reading iRacing shared memory via `irsdk-node` without requiring an external backend or database.

## Architecture

`cold-mirror-widgets` is an Electron app that reads live telemetry from the iRacing SDK in the main process and streams it to a dashboard window plus any number of overlay windows via IPC.

```mermaid
%%{init: {
  'theme': 'base',
  'flowchart': { 'curve': 'basis', 'nodeSpacing': 45, 'rankSpacing': 65, 'wrap': true },
  'themeVariables': {
    'fontSize': '14px',
    'primaryColor': '#37474F',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#78909C',
    'lineColor': '#90A4AE',
    'secondaryColor': '#37474F',
    'tertiaryColor': '#37474F'
  }
}}%%
flowchart TB
    subgraph MAIN["🖥️ Main Process"]
        direction LR
        SDK(["iRacing SDK<br/>Shared Memory"])
        P1(["poll @ ~30fps"]):::plate
        TS["TelemetryService<br/>telemetry.js"]
        WM["WindowManager<br/>windowManager.js"]
        ST[("Store<br/>store.js")]
        SDK --> P1 --> TS
        TS --> WM
        WM --> ST
    end

    PL["preload.js<br/>contextBridge"]
    MAIN ~~~ PL

    P2(["broadcast telemetry & session"]):::plate
    P3(["ipc send"]):::plate
    WM ==> P2 ==> PL
    PL ==> P3 ==> WM

    subgraph OVERLAY["🪟 Renderer · Overlay N"]
        direction LR
        LT["useLiveTelemetryIPC"]
        LS[["useLiveStore<br/>Zustand"]]
        TBR["TelemetryBridge"]
        TP["TelemetryProvider<br/>shared widgets"]
        W(["Widget Components<br/>Speed, Fuel, …"])
        LT --> LS --> TBR --> TP --> W
    end

    subgraph DASH["📊 Renderer · Dashboard"]
        direction LR
        DB["Dashboard.jsx"]
        AS[["useAppStore<br/>Zustand"]]
        WC["WidgetCard.jsx"]
        DB --> AS --> WC
    end

    PL ~~~ OVERLAY
    PL ~~~ DASH

    P4(["telemetry update"]):::plate
    P5(["settings update"]):::plate
    P6(["control actions"]):::plate
    PL -.-> P4 -.-> LT
    PL -.-> P5 -.-> AS
    WC --> P6 --> PL

    OVERLAY ~~~ DASH

    subgraph LEGEND["🔑 Legend"]
        direction LR
        L1[" "]
        LL1(["Primary IPC channel"]):::plate
        L2[" "]
        L3[" "]
        LL2(["Subscription callback"]):::plate
        L4[" "]
        L5[" "]
        LL3(["Direct call / data flow"]):::plate
        L6[" "]
        L1 ==> LL1 ==> L2
        L3 -.-> LL2 -.-> L4
        L5 --> LL3 --> L6
        LG[("On-disk store")]
        LZ[["In-memory state · Zustand"]]
    end

    OVERLAY ~~~ LEGEND

    classDef core fill:#1565C0,stroke:#90CAF9,stroke-width:1.5px,color:#ffffff
    classDef bridge fill:#E65100,stroke:#FFCC80,stroke-width:1.5px,color:#ffffff
    classDef app fill:#2E7D32,stroke:#A5D6A7,stroke-width:1.5px,color:#ffffff
    classDef overlay fill:#6A1B9A,stroke:#CE93D8,stroke-width:1.5px,color:#ffffff
    classDef diskstore fill:#AD1457,stroke:#F48FB1,stroke-width:1.5px,color:#ffffff
    classDef memstore fill:#F57F17,stroke:#FFE082,stroke-width:1.5px,color:#ffffff
    classDef plate fill:#37474F,stroke:#607D8B,stroke-width:1px,color:#ffffff

    class SDK,TS,WM core
    class PL bridge
    class DB,WC app
    class LT,TBR,TP,W overlay
    class ST,LG diskstore
    class AS,LS,LZ memstore

    style MAIN fill:none,stroke:#78909C,stroke-width:1px,color:#90A4AE
    style DASH fill:none,stroke:#78909C,stroke-width:1px,color:#90A4AE
    style OVERLAY fill:none,stroke:#78909C,stroke-width:1px,color:#90A4AE
    style LEGEND fill:none,stroke:#546E7A,stroke-width:1px,stroke-dasharray: 3 3,color:#78909C

    style L1 fill:none,stroke:none
    style L2 fill:none,stroke:none
    style L3 fill:none,stroke:none
    style L4 fill:none,stroke:none
    style L5 fill:none,stroke:none
    style L6 fill:none,stroke:none
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
