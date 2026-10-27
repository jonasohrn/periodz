# Contributing to Periodz

## Setup

Use the Node.js version in `.nvmrc` (for example with `nvm use`), then install the dependencies:

```bash
npm ci
```

## Scripts

```bash
npm run check          # Type-check, lint and test: run this before you push
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage, which must stay at 100%
npm run test:mutation  # Run Stryker mutation testing (incremental)
npm run test:smoke     # Smoke-test dist/ on the current Node version (build first)
npm run type-check     # Check types only
npm run lint           # Run ESLint
npm run lint:fix       # Fix lint issues
npm run build          # Build dist/ with tsup
npm run check:package  # Check the packed package with publint and attw
```

## Tests

- Test files are named `*.test.ts` and live next to the code in `src/`.
- `Period.test.ts` and `PeriodSeq.test.ts` have one `describe('<op>()')` block per operation, in the same order:
  factory, `propsMerger` (Period only), accessors, predicates, set operations, `toString`. Within a block, cases go
  in this order: with Period, with PeriodSeq, with empty period, special cases, subjects, propsMerger.
- Tests cover every supported value type: numbers, `Date`, Day.js and custom `compareTo()` types (`Version` and
  `Rank` in `src/testHelpers.ts`).
- Shared test helpers live in `src/testHelpers.ts`. Never import helpers from a `*.test.ts` file, since that runs
  its tests again in the importing file.
- The library supports Node.js 16.9 and later, but the dev tools (tsup, Vitest, ESLint, Stryker) need the version in
  `.nvmrc`. CI therefore builds with that version and then runs only `scripts/smoke-test.mjs` with Node.js 16.9, 18
  and 20. To do the same locally, run `npm ci` and `npm run build`, switch Node version, and run
  `npm run test:smoke`. Don't use JavaScript built-ins newer than ES2022 in `src/`.

## Mutation testing

The mutation score is 100%, and CI fails if it drops. Kill new survivors with tests. Only code that exists purely
for performance may get a `// Stryker disable` comment, with a reason. See
[docs/MUTATION_TESTING.md](docs/MUTATION_TESTING.md).

## Changelog

Every change adds an entry to `CHANGELOG.md` under `## [Unreleased]`, in the same commit. Put it under a
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) subsection such as `### Added`, `### Changed` or
`### Fixed`, and write it for users of the library.

## Releasing

1. In `CHANGELOG.md`, remove the `Unreleased` entries that users don't need, move the rest under a new version
   heading, and update the compare links, including [Unreleased], at the bottom. Commit the change, since `npm version` needs a clean
   working tree.
2. Run `npm version <patch|minor|major>`, which commits the version and creates a `v*` tag.
3. Run `git push --follow-tags`. The release workflow then publishes to npm with provenance and creates a GitHub
   release.
