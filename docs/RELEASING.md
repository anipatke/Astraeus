# Releasing the Astraeus packages to npm

For the owner. Eight packages are published together, always with the same version number: `astraeus`, `astraeus-data`, `astraeus-data-jupiter`, `-saturn`, `-uranus`, `-neptune`, `-mars` and `-pluto`. A GitHub release triggers `.github/workflows/publish.yml`, which runs the project's checks and then publishes them. Why it is built this way, and the npm sources: `docs/NPM_PACKAGING.md`.

## One-time setup (before the first release)

npm will only accept a trusted-publisher setting for a package that already exists, so the first version of each package goes up by hand, once, and the GitHub workflow takes over from then on.

1. **npm account.** Turn on two-factor authentication. Run `npm login` on your machine.
2. **Build and check.** In the repository: `npm ci`, then `npm run check:pack` (it builds every package into `packages/<name>/dist` and fails on a stray file or a size over its limit). Optionally `node tools/publish-packages.mjs --dry-run`, which lists what would go and runs `npm publish --dry-run` for each package.
3. **First publish by hand, once per package** (eight times). From the repository root:
   ```sh
   npm publish packages/astraeus/dist --access public
   ```
   and the same for `astraeus-data`, `astraeus-data-jupiter`, `astraeus-data-saturn`, `astraeus-data-uranus`, `astraeus-data-neptune`, `astraeus-data-mars` and `astraeus-data-pluto`. npm asks for your 2FA code each time. If a name turns out to be taken, stop and tell the planner: the names are in each `packages/<name>/package.json`.
   *Staged publishing (seen on the first publish, 2026-10-23):* npm may hold a new package's upload for a malware scan or a maintainer's approval. While held, the package shows a public `0.0.0-stage` placeholder and the real version is hidden; it went live on its own within minutes for all seven data packages. If one stays held, approve it with `npm stage list` then `npm stage approve <stage-id>` (npm 11.15 or later; asks for 2FA) or on npmjs.com under Staged Packages. The placeholder stays in the version list; `latest` points at the real version.
   Commands that need your browser or 2FA approval cannot run through Claude Code's `!` prefix; run them in your own terminal.
4. **Link each package to this repository (trusted publisher).** Quickest from the command line (npm 11.15 or later; asks for approval):
   ```sh
   for p in astraeus astraeus-data astraeus-data-jupiter astraeus-data-saturn astraeus-data-uranus astraeus-data-neptune astraeus-data-mars astraeus-data-pluto; do
     npm trust github $p --repo anipatke/Astraeus --file publish.yml --allow-publish --yes
   done
   ```
   `npm trust list <package>` shows the link. Or on the website: On npmjs.com, open the package, then Settings, then "Trusted Publisher", and choose GitHub Actions. Enter:
   - organisation or user: `anipatke`
   - repository: `Astraeus`
   - workflow filename: `publish.yml` (exactly, with the extension)
   - environment: leave empty

   Do this for all eight packages. npm does not check the entry when you save it; a mistake only shows when the workflow runs. A new entry must have its first successful publish within 2 days. An entry cannot be edited, only deleted and added again.
5. **Public repository.** The provenance badge on npm needs the GitHub repository to be public and its URL to match the `repository` field in each `package.json` (`git+https://github.com/anipatke/Astraeus.git`).

The workflow itself needs no secret: it signs in to npm with GitHub's own identity (`id-token: write`).

## Each release

1. **Pick the version.** While the version starts with `0.`, a new feature or an API change is a minor bump (`0.2.0`); a fix only is a patch (`0.1.1`). All eight packages move together.
2. **Bump it** in the `version` field of the eight `packages/<name>/package.json` files (the `x-publish` block needs no change). Nothing else names the version; `npm run check:pack` fails if a built package disagrees with its source.
3. **Write the changelog.** Add a `## <version>` section at the top of `packages/astraeus/CHANGELOG.md` and `packages/astraeus-data/CHANGELOG.md`: what a user will notice, and every change to the public API.
4. **Check it passes here:** `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run check:engine-alone`, `npm run check:pack`. (The workflow runs the same, so a failure there stops the release before anything is published.)
5. **Commit and push** to the default branch.
6. **Optional dry run.** On GitHub: Actions, "publish", "Run workflow". A manual run does every step except sending anything to npm (`npm publish --dry-run`).
7. **Create the release.** On GitHub: Releases, "Draft a new release", create a new tag named `v<version>` (for example `v0.2.0`) on the default branch, paste the changelog section as the notes, and press **Publish release**. The tag must equal the version in the packages, or the workflow refuses to publish anything.

The workflow then: checks out, runs `npm ci` and the gates, builds and checks the packs, and publishes each package from its `dist` folder with provenance. A package whose version is already on npm is skipped, so if one step fails you can fix the cause and run the workflow again (Actions, the failed run, "Re-run all jobs") without a duplicate-version error.

## After a release

- On npmjs.com, each of the eight packages shows the new version and a "Built and signed on GitHub Actions" provenance badge.
- In a scratch folder: `npm create vite@latest probe -- --template vanilla && cd probe && npm install astraeus`, paste the 20-line example from `packages/astraeus/README.md` into `main.js`, `npm run build`. The build must succeed and `npx vite preview` must draw Earth, the Moon and the probe.
- If something is wrong, do not unpublish (npm restricts it after 72 hours and it breaks installs). Fix it and release the next patch version; `npm deprecate astraeus@<bad> "use <good>"` marks the bad one.

## What is checked where

| Check | Where |
|---|---|
| Lint, typecheck, build, tests, engine alone | locally, and again in the workflow |
| Package contents and sizes | `npm run check:pack`, locally and in the workflow |
| The example app installs the packed tarball and draws | `npm run check:browser` (step `hello-scene`) at a Full Objective Check; locally `npm run build:example` |
| The tag equals every package version | `tools/publish-packages.mjs`, in the workflow |
| Already published versions are skipped | `tools/publish-packages.mjs` (`npm view`), in the workflow |
