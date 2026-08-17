# Changelog

## [0.2.0](https://github.com/0resuto/cold-mirror-client/compare/v0.1.0...v0.2.0) (2026-08-17)

### Features

* add build wrapper with pre-flight checks and error handling ([9903b65](https://github.com/0resuto/cold-mirror-client/commit/9903b654cfc5307e01f3a4716c875a00fbd2d478))
* add inactive opacity setting and fix mock telemetry for radar testing ([891f822](https://github.com/0resuto/cold-mirror-client/commit/891f82265bd12ae10d50b6979dc78b993f65ef35))
* add trace range setting slider for inputs widget ([65df712](https://github.com/0resuto/cold-mirror-client/commit/65df712da8a255ab104e60bdda97c99673936688))
* **backend:** implement structured logging via electron-log ([79d1081](https://github.com/0resuto/cold-mirror-client/commit/79d10813b39b021dce2b179e953210a96a844a8a))
* calculate session best lap and decode windows-1251 strings for names ([ad5871b](https://github.com/0resuto/cold-mirror-client/commit/ad5871bbb8bd1163f4e3c2b47cc8b82365be4cda))
* set application process name to Cold Mirror ([0fe15af](https://github.com/0resuto/cold-mirror-client/commit/0fe15af6585738f1cf36ae4e190f56e6980e2ccb))
* **ui:** add recovery functionality to ErrorBoundary ([28fc56b](https://github.com/0resuto/cold-mirror-client/commit/28fc56b81f80fc7166ed6200d6b7067f0850d301))
* **ui:** add widget/bg opacity controls, window backdrops, and fix mock telemetry ([aaf7a9b](https://github.com/0resuto/cold-mirror-client/commit/aaf7a9b6c30ad1834648d0b73c0114b4479446e7))

### Bug Fixes

* address critical data race conditions and add CSP ([aecdf29](https://github.com/0resuto/cold-mirror-client/commit/aecdf29a0038adae74b1d169ed8d1da11c19cd1e))
* address high-priority architecture and UI warnings ([54c27a1](https://github.com/0resuto/cold-mirror-client/commit/54c27a13b5381e96311165cf441c5ce247567228))
* **build:** show electron-builder logs and disable code signing ([08d578a](https://github.com/0resuto/cold-mirror-client/commit/08d578a4d860f255f105665c640aaf430ace0953))
* close orphaned overlay widgets on dashboard exit ([d172dc5](https://github.com/0resuto/cold-mirror-client/commit/d172dc5787c623f98f0256ef9260198cfe529398))
* ensure CarLeftRight is always cast to integer for radar spotter ([a53d083](https://github.com/0resuto/cold-mirror-client/commit/a53d083092abaa1118300fce80a69d5a9b3f3667))
* **main:** repair telemetry session handling, async store writes, IPC filtering ([ea678de](https://github.com/0resuto/cold-mirror-client/commit/ea678de8a951e51f1cfa9d0ab656e3ec04a86f42))
* pass columns configuration to standings and relative widgets ([bf29a6c](https://github.com/0resuto/cold-mirror-client/commit/bf29a6c604f7b5bd3733302815e9981f0e8ced74))
* prevent native SDK mock fallback by externalizing irsdk-node ([74f6008](https://github.com/0resuto/cold-mirror-client/commit/74f6008fca6be00365d3721bee621cf1e1adee4b))
* rename RendererWidgetRegistry.js to .jsx to fix esbuild JSX parsing error ([6e45982](https://github.com/0resuto/cold-mirror-client/commit/6e45982e3cf8dd8299a02dc015c5b4323e6540f4))
* **renderer:** isolate re-renders, throttle IPC, debounce settings, remove dead code ([3ac14a8](https://github.com/0resuto/cold-mirror-client/commit/3ac14a83fef81a983a0384f009f84f330a566d5f))
* **sync:** resolve optimistic UI race condition using senderId pattern ([6b75efc](https://github.com/0resuto/cold-mirror-client/commit/6b75efc2d5a4f63a250d850456f999a86202fb4f))
* **telemetry:** unwrap CarLeftRight from array returned by iRacing SDK ([1e30f6c](https://github.com/0resuto/cold-mirror-client/commit/1e30f6c32913daea5946388b80ffb5729822be44))
* widgets grid data receiving ([e835739](https://github.com/0resuto/cold-mirror-client/commit/e835739c23338146dc30f315c9d790b145d36151))
* **widgets:** map missing and incorrectly named components in registry ([11f49fc](https://github.com/0resuto/cold-mirror-client/commit/11f49fc3e4eab40480a8f6da7105ae2c21187165))

## 0.1.0 (2026-08-12)

### Features

* add fuel and input trace overlays ([cc6ed9c](https://github-main/0resuto/cold-mirror-client/commit/cc6ed9c503e13fd29f941c3d15aa8274df210ea7))
* add settings store and dashboard UI ([144cedb](https://github-main/0resuto/cold-mirror-client/commit/144cedb9a1ea42dbf1d9aac712df09e719f473a7))
* complete IPC telemetry loop in electron ([d14ad51](https://github-main/0resuto/cold-mirror-client/commit/d14ad513c85355664532247911be4b87e286d35a))
* dynamic radar based on LapDistPct ([0e763b8](https://github-main/0resuto/cold-mirror-client/commit/0e763b81b7087cc2b92410cb8d8ef95a55ee29d3))
* init standalone electron overlays with irsdk-node ([14869c9](https://github-main/0resuto/cold-mirror-client/commit/14869c952391ccca870794ee1dc23afba64b222c))
* **inputs:** add LiveInputs widget with SVG trace graph, steering indicator, and responsive layout ([340ad25](https://github-main/0resuto/cold-mirror-client/commit/340ad259929180f1769c29ae1f9f6cc329b2229c))
* **pit-helper:** add pit helper widget with speeding alerts and service status ([cc317ee](https://github-main/0resuto/cold-mirror-client/commit/cc317ee170466ede27576bd091282aebd7ef19be))
* redesign LiveRelative, extract shared UI components, and add column settings ([1a591b4](https://github-main/0resuto/cold-mirror-client/commit/1a591b49d9142a935505b37891609704bacd7419))
* setup github release pipeline, changelog, and release-it automation ([5696ddb](https://github-main/0resuto/cold-mirror-client/commit/5696ddb72e91e24f93a3fb4a59fac3508e257972))
* **standings:** implement premium modern design, split SR badge, and fix layout widths ([1a37bc0](https://github-main/0resuto/cold-mirror-client/commit/1a37bc0cf8d77e83772190ea84b9da1fc51dfbd4))
* **trackmap:** implement linear track map with lapped indicators and status icons ([ebb91f4](https://github-main/0resuto/cold-mirror-client/commit/ebb91f4ddcfc93f6c6bd30adaa0928ae6438f02b))
* **ui:** overhaul dashboard UI, add global widget opacity system, native window controls, and app icons ([b857374](https://github-main/0resuto/cold-mirror-client/commit/b857374b0be354fe6d64dd0e557b91a99f497ddd))
* **weather:** add weather and track conditions widget with rotating wind compass ([ff609d2](https://github-main/0resuto/cold-mirror-client/commit/ff609d2c016a9c1902e3b1e076f32c6e41828298))

### Bug Fixes

* app_icon.ico size ([0cad71a](https://github-main/0resuto/cold-mirror-client/commit/0cad71a113ed5dec31acc2b850a50321341d1f50))
* configure app icon for electron build and React UI ([0706056](https://github-main/0resuto/cold-mirror-client/commit/070605642c1ecfe966d47c5339ba95f3705a36cc))
* resolve IPC memory leaks and configure release builder ([feeee94](https://github-main/0resuto/cold-mirror-client/commit/feeee9452e503a9953100f5c7f02cf35aca32442))
* stabilize production widgets, add ErrorBoundary, LoadingState, and fix auto-hide UX ([b9872fa](https://github-main/0resuto/cold-mirror-client/commit/b9872fae4c4dfebb6c16dc51231258fdf9398b60))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial open-source infrastructure (LICENSE, GitHub Actions, Templates, Husky).
- Basic UI with transparent overlay support.
- Integration with `irsdk-node` for telemetry polling.
