import { IRacingSDK } from 'irsdk-node';
import { MockTelemetryService } from './mockTelemetry.js';

export function filterTelemetry(data, sessionInfo) {
  const values = data?.values || data || {};
  const grid = {};
  
  const gridSize = values.CarIdxPosition?.length || 64;
  for (let i = 0; i < gridSize; i++) {
    if (values.CarIdxPosition && values.CarIdxPosition[i] > 0) {
      grid[i] = {
        Position: values.CarIdxPosition[i],
        ClassPosition: values.CarIdxClassPosition ? values.CarIdxClassPosition[i] : 0,
        LapDistPct: values.CarIdxLapDistPct ? values.CarIdxLapDistPct[i] : 0,
        Lap: values.CarIdxLap ? values.CarIdxLap[i] : 0,
        LastLapTime: values.CarIdxLastLapTime ? values.CarIdxLastLapTime[i] : -1,
        BestLapTime: values.CarIdxBestLapTime ? values.CarIdxBestLapTime[i] : -1,
        F2Time: values.CarIdxF2Time ? values.CarIdxF2Time[i] : -1,
        TrackSurface: values.CarIdxTrackSurface ? values.CarIdxTrackSurface[i] : 3,
        OnPitRoad: values.CarIdxOnPitRoad ? values.CarIdxOnPitRoad[i] : false,
        HasDamage: values.CarIdxHasDamage ? values.CarIdxHasDamage[i] : false,
        IsFastestLap: values.CarIdxIsFastestLap ? values.CarIdxIsFastestLap[i] : false,
      };
    }
  }

  return {
    SessionTime: values.SessionTime,
    player_name: sessionInfo?.data?.DriverInfo?.Drivers?.[sessionInfo?.data?.DriverInfo?.DriverCarIdx]?.UserName || '',
    playerCarIdx: sessionInfo?.data?.DriverInfo?.DriverCarIdx,
    AirTemp: values.AirTemp || 0,
    TrackTemp: values.TrackTemp || 0,
    WindVel: values.WindVel || 0,
    WindDir: values.WindDir || 0,
    Yaw: values.Yaw || 0,
    FuelLevel: values.FuelLevel || 0,
    FuelUsePerHour: values.FuelUsePerHour || 0,
    SteeringWheelAngle: values.SteeringWheelAngle || 0,
    Throttle: values.Throttle || 0,
    Brake: values.Brake || 0,
    Clutch: values.Clutch || 0,
    Gear: values.Gear || 0,
    RPM: values.RPM || 0,
    ShiftIndicatorPct: values.ShiftIndicatorPct || 0,
    Speed: values.Speed || 0,
    PitSvFlags: values.PitSvFlags || 0,
    PitSvFuel: values.PitSvFuel || 0,
    CarLeftRight: values.CarLeftRight || 0,
    grid
  };
}

export class TelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.iracing = new IRacingSDK();
    this.isRunning = false;
    this.mockService = null;
    this.latestSession = null;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Check if sim is running
    const isRunning = await IRacingSDK.IsSimRunning();
    if (!isRunning) {
        console.warn("iRacing is not running.");
        // Fallback to mock in dev mode
        if (process.env.VITE_DEV_SERVER_URL) {
            console.log("Starting Mock Telemetry as fallback...");
            this.mockService = new MockTelemetryService(this.ipcSender);
            this.mockService.start();
            return;
        }
    }
    
    this.iracing.startSDK();
    
    let lastSessionSend = 0;

    const loop = () => {
        if (!this.isRunning) return;
        if (this.mockService) return; // Mock is running
        
        // Use 0ms to prevent blocking the Node event loop
        if (this.iracing.waitForData(0)) {
            const session = this.iracing.getSessionData();
            const telemetry = this.iracing.getTelemetry();
            
            if (session) {
                this.latestSession = session;
            }
            
            const now = Date.now();
            if (session && (now - lastSessionSend > 1000)) {
                this.ipcSender('session-info', { data: session });
                lastSessionSend = now;
            }
            if (telemetry) {
                const payload = filterTelemetry(telemetry, this.latestSession);
                this.ipcSender('telemetry-update', payload);
            }
        }
        
        // Loop again asynchronously for ~30fps
        setTimeout(loop, 33);
    };
    
    loop();
  }

  stop() {
    this.isRunning = false;
    if (this.mockService) {
      this.mockService.stop();
      this.mockService = null;
    } else {
      this.iracing.stopSDK();
    }
  }

}
