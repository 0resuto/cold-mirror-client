# Cold Mirror Client

A standalone desktop overlay application for iRacing, designed specifically for use with OBS Window Capture.

## Overview

Cold Mirror Client provides transparent, high-performance telemetry widgets (such as Live Standings, Relatives, and Fuel tracking) that overlay directly on top of the iRacing simulator or can be captured in OBS. 

It runs as a fully independent Node.js/Electron application, directly reading iRacing shared memory via `irsdk-node` without requiring an external backend or database.

## Architecture

- **Main Process (Node.js)**: Runs a 30 FPS polling loop using `irsdk-node` to read telemetry data directly from the simulator's memory. Filters data to minimize IPC payload overhead.
- **Renderer Process (React/Vite)**: Receives lightweight telemetry updates via IPC. Uses Zustand for reactive state management and TailwindCSS for styling.
- **Communication**: Strict isolation via `contextBridge` in `preload.js`. The React application has no Node integration.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

This will launch both the Vite development server and the Electron application.

## Building for Production

To build the executable for distribution:

```bash
npm run build
```

This will output the compiled executables into the `dist` and `release` directories.
