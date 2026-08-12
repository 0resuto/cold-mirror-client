# Changelog

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
