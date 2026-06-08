---
name: git-commit-convention
description: Reference for writing structured git commit messages. Use when asked to write a commit, generate a commit message, review commit style, or work with conventional commits format.
metadata:
  author: edram
  version: 2026.06.05
  source: https://www.conventionalcommits.org/en/v1.0.0/
---

Conventional Commits 1.0.0 — a specification for writing commit messages that are human-readable and machine-parseable. Maps directly to Semantic Versioning: `feat` → MINOR bump, `fix`/`perf` → PATCH bump, breaking changes → MAJOR bump.

- Only `type` and `description` are required; everything else is optional
- Scope narrows the affected area: `feat(auth):`, `fix(api):`
- Breaking changes use `!` suffix or `BREAKING CHANGE:` footer (or both)
- Footer tokens follow Git trailer convention

```
<type>[optional scope]<!>: <description>

[optional body]

[optional footer(s)]
```

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Format | Full grammar, header/body/footer rules, length limits | [core-format](references/core-format.md) |
| Types | All 11 types with SemVer impact and when to use each | [core-types](references/core-types.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Breaking Changes | `!` syntax and `BREAKING CHANGE` footer — when and how | [features-breaking](references/features-breaking.md) |
| Footers | Token format rules, issue references, common tokens | [features-footers](references/features-footers.md) |
