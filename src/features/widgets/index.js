import React from 'react';
import { componentRegistry } from './RendererWidgetRegistry.jsx';

// Lazily load components to save memory per BrowserWindow
componentRegistry.register('standings', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveStandings }))));
componentRegistry.register('relative', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveRelative }))));
componentRegistry.register('fuel', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveFuel }))));
componentRegistry.register('inputs', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveInputs }))));
componentRegistry.register('radar', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveRadar }))));
componentRegistry.register('trackmap', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LinearTrackMap }))));
componentRegistry.register('weather', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveWeather }))));
componentRegistry.register('pit', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.PitHelper }))));
componentRegistry.register('dash', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.DigitalDash }))));

export { componentRegistry };
