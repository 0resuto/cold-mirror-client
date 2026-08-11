export class MockTelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.isRunning = false;
    this.sessionTime = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("Mock Telemetry started");

    const sessionData = {
      data: {
        DriverInfo: {
          Drivers: [
            { CarIdx: 0, UserName: "Mock Driver 1", CarNumber: "1", iRating: 2500, LicString: "A 3.50" },
            { CarIdx: 1, UserName: "Mock Driver 2", CarNumber: "2", iRating: 2100, LicString: "B 2.10" },
            { CarIdx: 2, UserName: "Mock Driver 3", CarNumber: "42", iRating: 1800, LicString: "C 3.99" },
            { CarIdx: 3, UserName: "Mock Driver 4", CarNumber: "99", iRating: 3100, LicString: "A 4.99" },
          ]
        }
      }
    };

    const loop = () => {
      if (!this.isRunning) return;

      this.sessionTime += 0.033; // 30fps

      // Send session info periodically (e.g., every ~1 second) so late-loading windows catch it
      this.tickCount = (this.tickCount || 0) + 1;
      if (this.tickCount % 30 === 0) {
        this.ipcSender('session-info', sessionData);
      }

      // Generate some fake moving data
      const telemetry = {
        values: {
          SessionTime: this.sessionTime,
          CarIdxPosition: [1, 3, 4, 2],
          CarIdxClassPosition: [1, 3, 4, 2],
          CarIdxEstTime: [100.1, 100.5, 102.0, 100.3],
          CarIdxF2Time: [1.2, 5.5, 15.0, 2.3],
          CarIdxLap: [10, 10, 10, 10],
          CarIdxLapDistPct: [
            Math.abs((this.sessionTime * 0.01) % 1),
            Math.abs((this.sessionTime * 0.01 - 0.02) % 1),
            Math.abs((this.sessionTime * 0.01 - 0.05) % 1),
            Math.abs((this.sessionTime * 0.01 - 0.01) % 1),
          ],
        }
      };

      const payload = this.filterTelemetry(telemetry);
      this.ipcSender('telemetry-update', payload);

      setTimeout(loop, 33);
    };

    loop();
  }

  stop() {
    this.isRunning = false;
  }

  filterTelemetry(data) {
    const values = data?.values || data || {};
    const grid = {};
    
    // We assume 64 cars max for this simple mapping
    for (let i = 0; i < 64; i++) {
      if (values.CarIdxPosition && values.CarIdxPosition[i] > 0) {
        grid[i] = {
          Position: values.CarIdxPosition[i],
          ClassPosition: values.CarIdxClassPosition ? values.CarIdxClassPosition[i] : 0,
          LapDistPct: values.CarIdxLapDistPct ? values.CarIdxLapDistPct[i] : 0,
          Lap: values.CarIdxLap ? values.CarIdxLap[i] : 0,
          LastLapTime: values.CarIdxLastLapTime ? values.CarIdxLastLapTime[i] : -1,
          TrackSurface: values.CarIdxTrackSurface ? values.CarIdxTrackSurface[i] : 3,
          OnPitRoad: values.CarIdxOnPitRoad ? values.CarIdxOnPitRoad[i] : false,
        };
      }
    }

    return {
      SessionTime: values.SessionTime,
      grid
    };
  }
}
