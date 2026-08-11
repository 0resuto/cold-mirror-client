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
        WeekendInfo: {
          TrackLength: "4.00 km"
        },
        DriverInfo: {
          DriverCarIdx: 1,
          Drivers: [
            { CarIdx: 0, UserName: "Mock Driver 1", CarNumber: "1", iRating: 2500, LicString: "A 3.50", CarClassColor: 0xff0000 },
            { CarIdx: 1, UserName: "Mock Driver 2 (Player)", CarNumber: "2", iRating: 2100, LicString: "B 2.10", CarClassColor: 0x00ff00 },
            { CarIdx: 2, UserName: "Mock Driver 3", CarNumber: "42", iRating: 1800, LicString: "C 3.99", CarClassColor: 0x00ff00 },
            { CarIdx: 3, UserName: "Mock Driver 4", CarNumber: "99", iRating: 3100, LicString: "A 4.99", CarClassColor: 0xff0000 },
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
      const throttle = Math.max(0, Math.sin(this.sessionTime * 2));
      const brake = Math.max(0, -Math.sin(this.sessionTime * 2));
      const steering = Math.sin(this.sessionTime) * 1.5; // rad
      const gear = Math.floor(Math.abs(Math.sin(this.sessionTime * 0.5) * 6)) + 1;
      const rpm = 3000 + (throttle * 4000);
      const speed = gear * 30 + (throttle * 20); // roughly km/h
      const fuelLevel = Math.max(0, 50 - (this.sessionTime * 0.05));

      const telemetry = {
        values: {
          SessionTime: this.sessionTime,
          FuelLevel: fuelLevel,
          FuelUsePerHour: 15.5,
          SteeringWheelAngle: steering,
          Throttle: throttle,
          Brake: brake,
          Clutch: 0,
          Gear: gear,
          RPM: rpm,
          Speed: speed,
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
      player_name: "Mock Driver 2 (Player)",
      FuelLevel: values.FuelLevel || 0,
      FuelUsePerHour: values.FuelUsePerHour || 0,
      SteeringWheelAngle: values.SteeringWheelAngle || 0,
      Throttle: values.Throttle || 0,
      Brake: values.Brake || 0,
      Clutch: values.Clutch || 0,
      Gear: values.Gear || 0,
      RPM: values.RPM || 0,
      Speed: values.Speed || 0,
      grid
    };
  }
}
