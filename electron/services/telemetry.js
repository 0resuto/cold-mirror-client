import { IRacingSDK, CarLeftRight as IrsdkCarLeftRight } from 'irsdk-node';
import { MockTelemetryService } from './mockTelemetry.js';

function getSessionData(sessionInfo) {
  return sessionInfo?.data || sessionInfo || {};
}

function decodeIRacingString(str) {
  if (!str) return str;
  
  let isLatin1 = true;
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) {
      isLatin1 = false;
      break;
    }
  }
  
  if (!isLatin1) return str;

  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch (e) {
    return new TextDecoder('windows-1251').decode(buf);
  }
}

function normalizeSessionData(sessionInfo) {
  const sessionData = getSessionData(sessionInfo);
  const driverInfo = sessionData?.DriverInfo;
  if (!driverInfo) return sessionData;
  const driverCarIdx = Number(driverInfo.DriverCarIdx);

  return {
    ...sessionData,
    DriverInfo: {
      ...driverInfo,
      DriverCarIdx: Number.isFinite(driverCarIdx) ? driverCarIdx : null,
      Drivers: (driverInfo.Drivers || []).map((driver) => ({
        ...driver,
        CarIdx: Number.isFinite(Number(driver.CarIdx)) ? Number(driver.CarIdx) : null,
        UserName: decodeIRacingString(driver.UserName),
        TeamName: decodeIRacingString(driver.TeamName),
        CarClassShortName: decodeIRacingString(driver.CarClassShortName),
      })),
    },
  };
}

function normalizeTelemetryValues(data) {
  const rawValues = data?.values || data || {};
  return Object.fromEntries(
    Object.entries(rawValues).map(([key, value]) => [
      key,
      value && typeof value === 'object' && 'value' in value ? value.value : value,
    ])
  );
}

export function filterTelemetry(data, sessionInfo) {
  const values = normalizeTelemetryValues(data);
  const sessionData = normalizeSessionData(sessionInfo);
  const driverInfo = sessionData?.DriverInfo || {};
  const drivers = driverInfo.Drivers || [];
  const playerCarIdx = driverInfo.DriverCarIdx;
  const grid = {};

  const gridSize = Math.max(
    values.CarIdxPosition?.length || 0,
    values.CarIdxLapDistPct?.length || 0,
    values.CarIdxTrackSurface?.length || 0,
    values.CarIdxLap?.length || 0,
    drivers.length,
    64
  );

  let sessionBestLapTime = -1;
  if (values.CarIdxBestLapTime) {
    for (let i = 0; i < values.CarIdxBestLapTime.length; i++) {
      const time = values.CarIdxBestLapTime[i];
      if (time > 0 && (sessionBestLapTime === -1 || time < sessionBestLapTime)) {
        sessionBestLapTime = time;
      }
    }
  }

  for (let i = 0; i < gridSize; i++) {
    const position = values.CarIdxPosition?.[i] || 0;
    const lapDistPct = values.CarIdxLapDistPct?.[i];
    const lap = values.CarIdxLap?.[i];
    const trackSurface = values.CarIdxTrackSurface?.[i];
    const indexedDriver = drivers[i];
    const driver = drivers.find((entry) => entry?.CarIdx === i) || (indexedDriver?.CarIdx == null ? indexedDriver : null);

    const hasLiveCarData =
      position > 0 ||
      (Number.isFinite(lapDistPct) && lapDistPct >= 0) ||
      (Number.isFinite(lap) && lap >= 0) ||
      (Number.isFinite(trackSurface) && trackSurface > 0);

    if (driver || hasLiveCarData) {
      grid[i] = {
        Position: position,
        ClassPosition: values.CarIdxClassPosition ? values.CarIdxClassPosition[i] : 0,
        LapDistPct: Number.isFinite(lapDistPct) ? lapDistPct : 0,
        Lap: Number.isFinite(lap) ? lap : 0,
        LastLapTime: values.CarIdxLastLapTime ? values.CarIdxLastLapTime[i] : -1,
        BestLapTime: values.CarIdxBestLapTime ? values.CarIdxBestLapTime[i] : -1,
        F2Time: values.CarIdxF2Time ? values.CarIdxF2Time[i] : -1,
        TrackSurface: Number.isFinite(trackSurface) ? trackSurface : 0,
        OnPitRoad: values.CarIdxOnPitRoad ? values.CarIdxOnPitRoad[i] : false,
        HasDamage: values.CarIdxHasDamage ? values.CarIdxHasDamage[i] : false,
        IsFastestLap: values.CarIdxIsFastestLap ? values.CarIdxIsFastestLap[i] : false,
        IsSessionBest: values.CarIdxBestLapTime && values.CarIdxBestLapTime[i] > 0 && values.CarIdxBestLapTime[i] === sessionBestLapTime,
        IsLastLapSessionBest: values.CarIdxLastLapTime && values.CarIdxLastLapTime[i] > 0 && values.CarIdxLastLapTime[i] === sessionBestLapTime,
      };
    }
  }

  return {
    SessionTime: values.SessionTime,
    SessionBestLapTime: sessionBestLapTime,
    player_name: drivers.find((entry) => entry?.CarIdx === playerCarIdx)?.UserName || drivers[playerCarIdx]?.UserName || '',
    playerCarIdx,
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
    CarLeftRight: typeof values.CarLeftRight === 'string' ? (IrsdkCarLeftRight?.[values.CarLeftRight] || 0) : (values.CarLeftRight || 0),
    grid
  };
}

export class TelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.iracing = new IRacingSDK({ autoEnableTelemetry: true });
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
        
        if (this.iracing.waitForData(0)) {
            const session = this.iracing.getSessionData();
            const telemetry = this.iracing.getTelemetry();
            
            if (session) {
                this.latestSession = session;
            }
            
            const now = Date.now();
            if (session && (now - lastSessionSend > 1000)) {
                this.ipcSender('session-info', { data: normalizeSessionData(session) });
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
