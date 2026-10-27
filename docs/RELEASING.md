# Releasing

These steps are for the maintainer. Contributors don't need them, see [CONTRIBUTING.md](../CONTRIBUTING.md).

1. Check that CI and mutation testing are green on `main`.
2. In `CHANGELOG.md`, remove the `Unreleased` entries that users don't need, move the rest under a new version
   heading, and update the compare links, including [Unreleased], at the bottom. Commit the change, since
   `npm version` needs a clean working tree.
3. Run `npm version <patch|minor|major>`, which commits the version and creates a `v*` tag.
4. Run `git push --follow-tags`. The release workflow then publishes to npm with provenance and creates a GitHub
   release.
