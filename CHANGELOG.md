# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.5] - 2026-08-21

### Changed
- Upgraded `jewish-holidays` `^1.2.1` → `^2.0.1` (major)
- Upgraded `@types/node` `^25.5.0` → `^26.2.0` (major)
- Upgraded `lint-staged` `^16.4.0` → `^17.3.0` (major)
- Upgraded `bumpp` `^11.0.1` → `^12.2.1` (major)
- Upgraded `@biomejs/biome` `^2.4.9` → `^2.5.9`
- Upgraded `vitest` `^4.1.1` → `^4.1.11` and `@vitest/coverage-v8` `4.1.1` → `4.1.11`
- Upgraded `tsdown` `^0.22.8` → `^0.22.14`
- Upgraded `typescript` `^6.0.2` → `^6.0.3` (deliberately staying on the 6.x line)

No source changes were required; the public API is unchanged.

## [1.0.4] - 2026-07-26

### Added
- 22 npm keywords covering domain terms, transliterated zman names, and solar
  calculation terms — including both `shabbat` and `shabbos`, since npm does not
  stem across the two transliterations

## [1.0.3] - 2026-07-15

### Added
- Time-aware `isShabbat` and `isYomTov` flags on `getTimes()`, following the
  halachic day from candle lighting on the erev through tzeis
- `jewish-holidays` dependency backing the new calendar flags
- `tests/holidays.test.ts` covering the new flags

## [1.0.2] - 2026-07-15

### Added
- `geo-tz` dependency for offline GPS → IANA timezone lookup
- Tests for coordinate-based timezone resolution, including unresolvable coordinates

### Changed
- `fromCoordinates()` now resolves timezones via `geo-tz` instead of the previous
  heuristic lookup
- Rewrote the README around the coordinate-first API

## [1.0.1] - 2026-03-26

### Added
- GitHub Actions workflow for build, test, and release
- `inc-version` and `get-version` helper scripts
- Multiple Vitest coverage reporters

### Changed
- `exports` map now declares `types` for both the ESM and CJS conditions, so
  `moduleResolution: "node16"`/`"bundler"` consumers pick up the right `.d.ts`
- Upgraded Yarn to 4.13.0

## [1.0.0] - 2025-06-01

### Added
- Initial release of `jewish-zmanim`
- Jean Meeus solar position algorithm with iterative two-pass refinement
- `Zmanim` class with full halachic time calculations (16+ zmanim)
- `fromCityRow()` static factory for built-in cities
- `fromCoordinates()` static factory with automatic timezone and DST detection
- Built-in city registry: 18 cities across Israel, US, Europe, and Australia
- GRA and Alter Rebbe (MGA) shaah zmanit calculation methods
- Israel-aware defaults for candle lighting (Jerusalem 40 min, Israel 30 min, diaspora 18 min)
- Elevation-adjusted sunrise/sunset calculations
- Shabbat enter/exit times with Unix timestamps
- Dual CJS/ESM distribution via `tsdown`
- Full TypeScript type definitions
- 80+ accuracy tests validated against MyZmanim.com (5–30 second tolerance)
