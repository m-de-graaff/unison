# Versioning and releases

Read this before tagging, bumping, or publishing. The first question is always the same one.

## The only question that changes the rules

**Does anything outside this repo depend on the version number?**

| | `kind: app` — deployed, no consumers | `kind: package` — published, has consumers |
|---|---|---|
| What the version *is* | a **deploy marker**: which build is in prod, what to roll back to | a **contract**: what breaking means, what upgrading costs |
| SemVer | optional; the number is a label | strict, and enforced |
| CHANGELOG | commit log is enough | required, and read by humans who did not write it |
| Pre-release channels | staging **is** the rc — no `-rc.N` ceremony | nightly → rc → stable, below |
| Breaking change | you migrate the one deployment | you owe a major, a migration note, and a deprecation window |

Do not run package ceremony on an app. A deploy marker that needs a release PR, a changelog
entry, and an rc soak is pure cost with no consumer on the other end.

**Apps:** tag every deploy `v<YYYY.MM.DD>-<short-sha>` or let release-please bump the number —
either works, the tag exists so `git checkout` can find the build. No changelog contract, no
pre-release channel, no promotion rule. `main` green = deployable.

Everything below is for `kind: package`.

## SemVer from conventional commits

| Commit | Bump | Notes |
|---|---|---|
| `feat:` | **minor** | new surface, nothing existing breaks |
| `fix:`, `perf:` | **patch** | behaviour under the existing contract |
| `type!:` or a `BREAKING CHANGE:` footer | **major** | `!` and the footer are equivalent; either alone triggers it |
| `refactor:`, `docs:`, `test:`, `chore:`, `ci:`, `build:`, `style:` | **none** | invisible to consumers |
| `revert:` | bump of whatever it reverts | reverting a `feat` after release is still a **major** — the surface is being removed |

**Pre-1.0 (`0.y.z`) is different and it bites people:** breaking → **minor** (`0.3.0` → `0.4.0`),
`feat` → **patch**. The tooling does this automatically. The consequence is that `^0.3.0` does
not protect a consumer from a break — which is the real argument for reaching `1.0.0` as soon
as the surface is one you would defend.

**Monorepo:** each package versions independently off the commits that touch its path. A
`feat` in `packages/core` bumps core; it bumps `packages/ui` only if ui depends on core, and
then only as a patch (`chore(deps)`), unless ui re-exports the new surface — then it is a
`feat` on ui too, and that has to be an explicit commit, not an inferred one.

## Tooling: use release-please

**Recommendation: `googleapis/release-please` via its GitHub Action, manifest mode in monorepos.**

It reads the conventional commits this skill already enforces, opens a **release PR** that
accumulates the pending bump and changelog, and cuts the tag + GitHub Release when that PR is
merged. Nothing publishes without a merge you can look at first.

Why not the others:

| Tool | Why not |
|---|---|
| **Changesets** | Requires a hand-written changeset file per change. Excellent when several people need to write consumer-facing prose and argue about the bump. For one person it is a ritual that gets skipped, and a skipped changeset is a silently missing release. |
| **semantic-release** | Publishes straight from CI the moment a commit lands on `main`. No artifact to inspect, no window to cancel, and the plugin chain is a second config surface to maintain. Fine for a high-volume library with a team watching; wrong default for a solo dev. |
| **Hand-rolled** | You will write the changelog generator, then the monorepo dependency bumps, then the pre-release tag handling. That is the whole of release-please, worse. |

**When to switch to Changesets:** a package with real external consumers where the changelog
needs human prose ("this replaces X, here is the migration"), not derived commit subjects. That
is a genuine judgment call, and derived changelogs are demonstrably worse at it. Switch for that
one package; keep release-please for the rest.

## Channels

| Channel | Cut from | Version | dist-tag | Who it is for |
|---|---|---|---|---|
| **nightly** | every merge to `main` | `X.Y.Z-nightly.<sha>` | `nightly` | you, and anyone reproducing a bug on tip |
| **rc** | a `release/X.Y` branch | `X.Y.0-rc.N` | `next` | consumers verifying before they commit |
| **stable** | promoting an rc, or merging the release PR | `X.Y.Z` | `latest` | everyone |

Skip the rc channel entirely for a patch release with no new surface — cut it straight to
stable. rc exists to buy soak time for *new* behaviour.

## Promotion rule: rc → stable

Promote when **all four** hold:

1. The rc has been published **≥ 72 hours**.
2. **Zero P0/P1 issues** filed against that rc.
3. CI is green on a **fresh re-run** of the release branch — not a cached result from when the
   rc was cut.
4. **Every commit on the release branch since the rc is `fix:` or `docs:`.**

If a `feat` lands on the release branch, cut `rc.N+1` and restart the 72 hours. That rule is
what makes an rc mean something: the surface being tested is the surface that ships.

If nothing at all landed on the release branch during the soak and all four hold — promote.
"Nobody complained" is the intended pass condition, not a reason to wait longer.

Cutting an rc that nobody installs teaches you nothing. If no consumer actually pulls `next`,
drop the rc channel and ship stable from a green `main` — the soak is theatre without an
installer on the other end.

## Tags, changelog, releases

- Tag `vX.Y.Z` (leading `v`), annotated, on the release commit. Monorepo: `pkg-name@X.Y.Z`.
- `CHANGELOG.md` per package, generated, `Keep a Changelog` sections. Hand-edit the generated
  entry before merging the release PR when a commit subject would read badly to a consumer —
  that is what the release PR is for.
- GitHub Release from the tag, body = that version's changelog section. Pre-release → `gh
  release create --prerelease`, which keeps it out of "Latest release" on the repo page.
- **Pre-releases never take `latest`:** `npm publish --tag next`. Publishing an rc without
  `--tag` makes it the default install for every consumer — this is the single most common
  release mistake and it is not reversible without a follow-up publish.
- Never move or delete a published tag. A wrong release is fixed by the next release.

## Hotfix on a released version while `main` has moved on

1. `git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z` — branch from the **tag**, not `main`.
2. Fix, `fix:` commit, PR into the release branch (or into a `release/X.Y` branch created from
   the tag if one does not exist).
3. Release `X.Y.Z+1` from there. It publishes to `latest` if `X.Y` is still the newest line;
   if `main` is already on `X.Y+1`, publish with the appropriate dist-tag so a newer stable is
   not overwritten by an older patch.
4. **Cherry-pick the fix forward to `main`** — `git cherry-pick -x <sha>`, which records the
   origin. A hotfix that never lands on `main` is a regression scheduled for the next release.
   Do this in the same session; it is the step that gets forgotten.
