---
name: core-types
description: All 11 commit types with SemVer correlation and usage guidance
---

## Usage

| Type | SemVer | Use for |
|------|--------|---------|
| `feat` | MINOR | New feature visible to users or API consumers |
| `fix` | PATCH | Bug fix |
| `perf` | PATCH | Performance improvement with no API change |
| `refactor` | — | Code restructuring — no new feature, no bug fix |
| `style` | — | Formatting, whitespace, missing semicolons — zero logic change |
| `test` | — | Adding or correcting tests |
| `docs` | — | Documentation only |
| `build` | — | Build system, tooling config, or external dependency changes |
| `ci` | — | CI/CD configuration files and scripts |
| `chore` | — | Miscellaneous maintenance; does not touch source or test files |
| `revert` | — | Reverts a previous commit |

```
feat(api): add pagination to GET /users

fix(auth): handle expired token on refresh

perf(db): replace N+1 query with single JOIN

refactor(cart): extract price calculation to domain service

style: apply prettier formatting across src/

test(user): add coverage for null email edge case

docs: document rate-limiting behavior in README

build: upgrade webpack to v5

ci: add caching step for node_modules in GitHub Actions

chore: remove unused env variable from .env.example

revert: feat(api): add pagination to GET /users
```

### `revert` specifics

Header uses the original commit's full header:
```
revert: feat(api): add pagination to GET /users

This reverts commit a1b2c3d. The pagination implementation caused
a regression in the search endpoint response time.
```

Body MUST include `This reverts commit <SHA>` plus the reason.

## Key Points

- Only `feat` and `fix` have formal SemVer semantics per the spec; all other types are community convention
- `refactor` vs `chore`: `refactor` touches production source code; `chore` does not
- `style` vs `refactor`: `style` is purely cosmetic (a formatter ran); `refactor` changes structure
- Adding a breaking change to any type bumps MAJOR regardless of the type's normal SemVer level

<!--
Source references:
- https://www.conventionalcommits.org/en/v1.0.0/
- https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md
-->
