# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `span()` returns the period from the first start to the last end, without subjects, so that `span().subtract(periods)` gives the gaps between them.
- The README has a "Why periodz?" section.
- The date-adapters example and guide show how to wrap Chronera.

### Changed

- `CONTRIBUTING.md` asks for a changelog entry with every change and describes the release steps in full.
- The README's Usage intro now says that a period is created from a start and an end value of a supported type.

## [0.8.1]

### Changed

- Releases are published from GitHub Actions with npm provenance.
- The README shows the mutation score from the Stryker dashboard.

## [0.8.0]

First public release.

### Added

- `Period` and `PeriodSeq` factories and the `theEmptyPeriod` singleton.
- Set operations `intersection()`, `union()`, `subtract()` and `mix()`, which all take and return a `PeriodLike`.
- Predicates `eq()`, `overlaps()`, `touches()`, `contains()` and `existsAt()`, and `periodsAt()` on `PeriodSeq`.
- Support for numbers, `Date`, Day.js and custom types with `compareTo()` and `diff()` methods.
- Subjects and `propsMerger` to carry metadata through operations.
- Type guards `isPeriod()`, `isPeriodSeq()` and `isEmpty()`, and the `PeriodzError` error class.

[Unreleased]: https://github.com/jonasohrn/periodz/compare/v0.8.1...HEAD
[0.8.1]: https://github.com/jonasohrn/periodz/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/jonasohrn/periodz/releases/tag/v0.8.0
