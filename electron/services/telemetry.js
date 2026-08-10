import { IRacingSDK } from 'irsdk-node';

export class TelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.iracing = new IRacingSDK();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    this.iracing.on('Telemetry', (data) => {
      const payload = this.filterTelemetry(data);
      this.ipcSender('telemetry-update', payload);
    });

    this.iracing.on('SessionInfo', (data) => {
      this.ipcSender('session-info', data);
    });
    
    this.iracing.startSDK();
  }

  stop() {
    this.isRunning = false;
    this.iracing.stopSDK();
  }

  filterTelemetry(data) {
    const values = data?.values || {};
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
