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

Don't add a version heading or change the compare links. That happens when the maintainer releases.

## Pull requests

1. For larger changes, open an issue first, so we can agree on the approach before you write the code.
2. Fork the repository and create a branch from `main`.
3. Make your change with tests, and add a changelog entry.
4. Run `npm run check`, and `npm run test:mutation` if you changed code in `src/`.
5. Open a pull request against `main` that describes what changed and why.

CI runs `npm run check` on Node.js 22, 24 and 26, checks the package, smoke-tests the build on Node.js 16.9, 18 and
20, and runs mutation testing when `src/` changes. All of them must pass before the pull request is merged.
