import { filterTelemetry } from './telemetry.js';
import log from 'electron-log/main.js';

export class MockTelemetryService {
  constructor(ipcSender) {
    this.ipcSender = ipcSender;
    this.isRunning = false;
    this.sessionTime = 0;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    log.info("Mock Telemetry started");

    const sessionData = {
      data: {
        WeekendInfo: {
          TrackLength: "4.00 km"
        },
        DriverInfo: {
          DriverCarIdx: 1,
          Drivers: [
            { CarIdx: 0, UserName: "Тестер Радара 1", CarNumber: "1", IRating: 2500, LicLevel: 17, LicString: "A 3.50", CarClassColor: 0xff0000, CarClassShortName: "GT3" },
            { CarIdx: 1, UserName: "Player", CarNumber: "2", IRating: 2100, LicLevel: 14, LicString: "B 2.10", CarClassColor: 0x00ff00, CarClassShortName: "LMP2" },
            { CarIdx: 2, UserName: "Radar Tester 2", CarNumber: "42", IRating: 1800, LicLevel: 11, LicString: "C 3.99", CarClassColor: 0x00ff00, CarClassShortName: "LMP2" },
            { CarIdx: 3, UserName: "Быстрый Гонщик", CarNumber: "99", IRating: 3100, LicLevel: 18, LicString: "A 4.99", CarClassColor: 0xff0000, CarClassShortName: "GT3" },
            { CarIdx: 4, UserName: "Lapped Car", CarNumber: "7", IRating: 1200, LicLevel: 8, LicString: "D 2.50", CarClassColor: 0x0000ff, CarClassShortName: "GT4" },
            { CarIdx: 5, UserName: "Rival", CarNumber: "33", IRating: 2150, LicLevel: 15, LicString: "B 3.00", CarClassColor: 0x00ff00, CarClassShortName: "LMP2" },
            { CarIdx: 6, UserName: "Leader", CarNumber: "10", IRating: 4000, LicLevel: 17, LicString: "A 4.00", CarClassColor: 0xff0000, CarClassShortName: "GT3" },
          ]
        }
      }
    };

    const loop = () => {
      if (!this.isRunning) return;

      this.sessionTime += 0.033; // 30fps

      // Send session info periodically
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

          const playerDist = (this.sessionTime * 0.010) % 1;
          
          // Cars 0 and 2 stay close but occasionally leave the radar zone to test inactivity
          const car0Dist = (playerDist + Math.sin(this.sessionTime * 0.2) * 0.05 + 1) % 1;
          const car2Dist = (playerDist + Math.cos(this.sessionTime * 0.15) * 0.06 + 1) % 1;
          
          // Other cars are spread across the track for the Track Map widget
          const car3Dist = (playerDist + 0.15) % 1; // 15% ahead
          const car4Dist = (playerDist + 0.50) % 1; // Opposite side of track
          const car5Dist = (playerDist + 0.85) % 1; // 15% behind
          const car6Dist = (playerDist + Math.sin(this.sessionTime * 0.1) * 0.05 + 1) % 1; // Oscillates ±5% (±200m) slowly

          let delta0 = car0Dist - playerDist;
          if (delta0 > 0.5) delta0 -= 1; if (delta0 < -0.5) delta0 += 1;
          
          let delta2 = car2Dist - playerDist;
          if (delta2 > 0.5) delta2 -= 1; if (delta2 < -0.5) delta2 += 1;
          
          let delta6 = car6Dist - playerDist;
          if (delta6 > 0.5) delta6 -= 1; if (delta6 < -0.5) delta6 += 1;
          
          let leftRight = 1; // Clear
          if (Math.abs(delta0 * 4000) < 5) leftRight = 2; // Car 0 Left
          else if (Math.abs(delta2 * 4000) < 5) leftRight = 3; // Car 2 Right
          else if (Math.abs(delta6 * 4000) < 5) leftRight = 2; // Car 6 Left

          const airTemp = 22.5 + Math.sin(this.sessionTime * 0.05) * 0.5;
          const trackTemp = 35.2 + Math.cos(this.sessionTime * 0.02) * 1.5;
          const windVel = 2.5 + Math.sin(this.sessionTime * 0.1) * 1.0;
          const windDir = (this.sessionTime * 0.05) % (Math.PI * 2); // Rotating wind for testing
          const yaw = (this.sessionTime * 0.3) % (Math.PI * 2); // Simulate car turning around the track

          const isPlayerOnPit = (this.sessionTime % 15) < 7.5; // On pit road 50% of the time for testing
          // Simulate some pit service flags (1+2+4+8 = 15 for 4 tires, +16 = 31 for fuel)
          const pitSvFlags = 31;
          const pitSvFuel = 25.5;

          const telemetry = {
            values: {
              SessionTime: this.sessionTime,
              AirTemp: airTemp,
              TrackTemp: trackTemp,
              WindVel: Math.max(0, windVel),
              WindDir: windDir,
              Yaw: yaw,
              FuelLevel: fuelLevel,
              FuelUsePerHour: 15.5,
              SteeringWheelAngle: steering,
              Throttle: throttle,
              Brake: brake,
              Clutch: 0,
              Gear: gear,
              RPM: rpm,
              ShiftIndicatorPct: (rpm - 3000) / 4000, // mock: 3000 is 0, 7000 is 1.0
              Speed: speed,
              PitSvFlags: pitSvFlags,
              PitSvFuel: pitSvFuel,
              // Added 7 cars total
              CarIdxPosition: [6, 3, 5, 2, 7, 4, 1],
              CarIdxClassPosition: [6, 3, 5, 2, 7, 4, 1],
              CarIdxLap: [9, 10, 11, 10, 8, 10, 10], 
              CarIdxLapDistPct: [car0Dist, playerDist, car2Dist, car3Dist, car4Dist, car5Dist, car6Dist],
              CarLeftRight: leftRight,
              CarIdxOnPitRoad: [false, isPlayerOnPit, true, false, false, false, false], 
              CarIdxHasDamage: [true, false, false, false, true, false, false], 
              CarIdxIsFastestLap: [false, false, false, false, false, false, true], 
              CarIdxBestLapTime: [75.2, 72.1, 74.5, 71.8, 80.0, 73.0, 71.5],
              CarIdxLastLapTime: [76.1, 72.3, 75.0, 72.0, 81.2, 73.5, 71.5],
              CarIdxF2Time: [12.5, 0.0, 4.2, -1.5, 45.0, 2.1, -15.0],
            }
          };

      const payload = filterTelemetry(telemetry, sessionData);
      this.ipcSender('telemetry-update', payload);

      setTimeout(loop, 33);
    };

    loop();
  }

  stop() {
    this.isRunning = false;
  }
}
