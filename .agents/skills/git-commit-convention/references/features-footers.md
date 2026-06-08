---
name: features-footers
description: Footer token format rules, common tokens, and issue reference patterns
---

## Usage

### Token format

```
Token: prose value
Token #numeric-ref
```

```
Closes #123
Refs #456
Co-Authored-By: Alice <alice@example.com>
Reviewed-by: Bob
BREAKING CHANGE: describe what broke and the migration path
```

### Common tokens

| Token | Format | Effect |
|-------|--------|--------|
| `Closes` / `Fixes` | `Closes #N` | Closes the linked issue when the PR merges (GitHub/GitLab) |
| `Refs` | `Refs #N` | References an issue without closing it |
| `Co-Authored-By` | `Co-Authored-By: Name <email>` | Credits a co-author; GitHub surfaces the avatar |
| `Reviewed-by` | `Reviewed-by: Name` | Records the reviewer in the commit |
| `BREAKING CHANGE` | `BREAKING CHANGE: description` | Signals a MAJOR SemVer bump — see [features-breaking](features-breaking.md) |

### Multiple footers

```
fix: handle null pointer in user serializer

Closes #88
Refs #72
Co-Authored-By: Alice <alice@example.com>
Reviewed-by: Bob
```

## Key Points

- Footer block starts after one blank line following the body (or header if no body)
- No blank lines between individual footer tokens — a blank line would be parsed as the start of another body paragraph
- Token names use hyphens not spaces (`Co-Authored-By`, not `Co Authored By`)
- All tokens are case-insensitive **except** `BREAKING CHANGE`
- `Token #value` (space-hash) is for numeric references; `Token: value` (colon-space) is for everything else
- Multiple `Closes` tokens are valid: `Closes #10`, `Closes #11` on separate lines

<!--
Source references:
- https://www.conventionalcommits.org/en/v1.0.0/#specification (items 13-14)
- https://git-scm.com/docs/git-interpret-trailers
-->
