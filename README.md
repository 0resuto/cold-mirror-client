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

Cold Mirror Client provides transparent, high-performance telemetry widgets (such as Live Standings, Relatives, and Fuel tracking) that overlay directly on top of the iRacing simulator. 

It runs as a fully independent application, reading iRacing shared memory via `irsdk-node` without requiring an external backend or database.

## Architecture

- **Main Process**: Node.js polling loop reading telemetry directly from simulator memory. Filters data to minimize IPC overhead.
- **Renderer Process**: React/Vite application receiving lightweight telemetry updates. Uses Zustand for state management and TailwindCSS for styling.
- **Communication**: Strict isolation via `contextBridge`. No Node integration in the Renderer.

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
