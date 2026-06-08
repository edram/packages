---
name: features-breaking
description: Breaking change syntax — exclamation mark and BREAKING CHANGE footer; both signal a SemVer MAJOR bump
---

## Usage

### Exclamation mark (inline)

Append `!` immediately before the colon. Scope, if present, comes before `!`:

```
feat!: remove POST /v1/users/legacy

feat(api)!: rename config key `timeout` to `timeoutMs`
```

### `BREAKING CHANGE` footer

Add a `BREAKING CHANGE:` token in the footer. No `!` required:

```
feat: allow config object to extend other configs

BREAKING CHANGE: `extends` key now merges configs rather than replacing them
```

### Combined (both `!` and footer)

Use `!` for signal visibility in the subject line and the footer for the full migration note:

```
feat(auth)!: drop support for JWT v1 tokens

JWT v1 tokens are no longer accepted. All clients must migrate
to v2 tokens before upgrading.

BREAKING CHANGE: JWT v1 tokens are rejected with HTTP 401.
Migrate via POST /auth/migrate — see docs/auth-migration.md.
```

## Key Points

- `BREAKING CHANGE` MUST be uppercase — it is the only case-sensitive footer token
- A commit with only a `BREAKING CHANGE` footer (no `!`) is still a MAJOR bump
- Any commit type can carry a breaking change (`fix!:`, `refactor!:`, etc.)
- Always include a body or detailed footer when breaking — document what changed and how to migrate
- The `!` alone (without the footer) is sufficient to signal a breaking change; the footer adds detail

<!--
Source references:
- https://www.conventionalcommits.org/en/v1.0.0/#specification (items 15-16)
- https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md
-->
