import { WidgetDefinition } from './WidgetDefinition.js';
import { WidgetRegistry } from './WidgetRegistry.js';

export const widgetRegistry = new WidgetRegistry();

widgetRegistry.register(new WidgetDefinition({
  id: 'standings',
  name: 'Live Standings',
  description: 'Real-time positions, gaps, and iRating.',
  dimensions: { defaultWidth: 400, defaultHeight: 600, minWidth: 200, minHeight: 300 },
  defaultSettings: {
    enabled: false,
    x: 100, y: 100, clickThrough: false,
    columns: { pos: true, num: true, driver: true, carName: false, carClass: true, classPos: true, srating: true, irating: true, gap: true, bestLap: false, lastLap: true, trackPct: false, laps: false }
  }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'relative',
  name: 'Relative',
  description: 'Drivers immediately ahead and behind on track.',
  dimensions: { defaultWidth: 400, defaultHeight: 600, minWidth: 200, minHeight: 300 },
  defaultSettings: { enabled: false, x: 500, y: 100, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'fuel',
  name: 'Fuel Calculator',
  description: 'Live fuel usage and remaining laps.',
  dimensions: { defaultWidth: 250, defaultHeight: 150, minWidth: 200, minHeight: 100 },
  defaultSettings: { enabled: false, x: 100, y: 750, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'inputs',
  name: 'Input Trace',
  description: 'Steering wheel, pedals, gear and speed.',
  dimensions: { defaultWidth: 300, defaultHeight: 150, minWidth: 300, minHeight: 120 },
  defaultSettings: { enabled: false, x: 400, y: 750, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'radar',
  name: 'Proximity Radar',
  description: 'Visual indicator for cars in your blind spots.',
  dimensions: { defaultWidth: 150, defaultHeight: 150, minWidth: 100, minHeight: 150 },
  defaultSettings: { enabled: false, x: 100, y: 100, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'trackmap',
  name: 'Live Track Map',
  description: 'Linear track map showing all cars.',
  dimensions: { defaultWidth: 800, defaultHeight: 80, minWidth: 400, minHeight: 80 },
  defaultSettings: { enabled: false, x: 100, y: 100, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'weather',
  name: 'Weather',
  description: 'Air/track temp and wind direction.',
  dimensions: { defaultWidth: 420, defaultHeight: 80, minWidth: 420, minHeight: 60 },
  defaultSettings: { enabled: false, x: 100, y: 100, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'pit',
  name: 'Pit Helper',
  description: 'Pit speed limiter and service status.',
  dimensions: { defaultWidth: 420, defaultHeight: 140, minWidth: 380, minHeight: 100 },
  defaultSettings: { enabled: false, x: 100, y: 100, clickThrough: false }
}));

widgetRegistry.register(new WidgetDefinition({
  id: 'dash',
  name: 'Digital Dashboard',
  description: 'RPM, Gear, Speed, and Shift Lights.',
  dimensions: { defaultWidth: 600, defaultHeight: 300, minWidth: 400, minHeight: 200 },
  defaultSettings: { enabled: false, x: 100, y: 100, clickThrough: false }
}));
