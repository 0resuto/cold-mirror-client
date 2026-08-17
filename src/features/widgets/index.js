import React from 'react';
import { componentRegistry } from './RendererWidgetRegistry.jsx';

// Lazily load components to save memory per BrowserWindow
componentRegistry.register('standings', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveStandings }))));
componentRegistry.register('relative', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveRelative }))));
componentRegistry.register('fuel', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveFuel }))));
componentRegistry.register('inputs', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.LiveInputs }))));
componentRegistry.register('trackmap', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.TrackMap }))));
componentRegistry.register('weather', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.Weather }))));
componentRegistry.register('pit', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.PitStops }))));
componentRegistry.register('dash', React.lazy(() => import('cold-mirror-widgets').then(module => ({ default: module.DashboardDashboard }))));

export { componentRegistry };
