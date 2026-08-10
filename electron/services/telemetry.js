import { IRacingSDK } from 'irsdk-node';

export class TelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.iracing = new IRacingSDK();
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    // Check if sim is running
    const isRunning = await IRacingSDK.IsSimRunning();
    if (!isRunning) {
        console.warn("iRacing is not running.");
    }
    
    this.iracing.startSDK();
    
    const TIMEOUT = Math.floor((1 / 30) * 1000); // ~30fps for UI

    const loop = () => {
        if (!this.isRunning) return;
        
        if (this.iracing.waitForData(TIMEOUT)) {
            const session = this.iracing.getSessionData();
            const telemetry = this.iracing.getTelemetry();
            
            if (session) {
                this.ipcSender('session-info', { data: session });
            }
            if (telemetry) {
                const payload = this.filterTelemetry(telemetry);
                this.ipcSender('telemetry-update', payload);
            }
        }
        
        // Loop again
        setTimeout(loop, 10);
    };
    
    loop();
  }

  stop() {
    this.isRunning = false;
    this.iracing.stopSDK();
  }

  filterTelemetry(data) {
    const values = data?.values || data || {};
    return {
      SessionTime: values.SessionTime,
      CarIdxPosition: values.CarIdxPosition,
      CarIdxClassPosition: values.CarIdxClassPosition,
      CarIdxEstTime: values.CarIdxEstTime,
      CarIdxF2Time: values.CarIdxF2Time,
      CarIdxLap: values.CarIdxLap,
      CarIdxLapDistPct: values.CarIdxLapDistPct,
    };
  }
}
