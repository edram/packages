---
name: core-format
description: Full commit message grammar — header, body, footer structure and writing rules
---

## Usage

```
<type>[optional scope]<!>: <description>
<BLANK LINE>
[optional body]
<BLANK LINE>
[optional footer(s)]
```

**Minimal:**
```
fix: prevent racing condition in request queue
```

**With scope:**
```
feat(parser): add support for array destructuring
```

**With body and footers:**
```
fix: correct timeout on idle connections

Previously the connection pool held idle connections open
indefinitely. This caused exhaustion under sustained low traffic.

Reviewed-by: Alice
Refs: #42
```

### Header rules

- **Type**: lowercase noun (`feat`, `fix`, `docs`, …)
- **Scope**: optional, lowercase noun in parentheses — describes the affected area
- **`!`**: placed immediately before the colon to flag a breaking change
- **Description**: imperative present tense ("add", not "added" or "adds"); lowercase first letter; no trailing period; ≤72 chars total (aim ≤50 for description alone)

### Body rules

- Explain the **why**, not the what — the diff already shows what changed
- Separated from the header by exactly one blank line
- Wrap at 72 characters per line
- May contain multiple paragraphs separated by blank lines

### Footer rules

- Separated from the body (or header if no body) by exactly one blank line
- One token per line; no blank lines between footer tokens
- `Token: value` for prose, `Token #value` for numeric references
- Token names use hyphens instead of spaces (`Co-Authored-By`, not `Co Authored By`)
- All tokens are case-insensitive **except** `BREAKING CHANGE` (must be uppercase)

## Key Points

- Blank lines between sections are mandatory — parsers rely on them
- Scope is free-form; teams define their own scope vocabulary
- Multiple footers are allowed; list them consecutively without blank lines between them

<!--
Source references:
- https://www.conventionalcommits.org/en/v1.0.0/
- https://github.com/angular/angular/blob/main/contributing-docs/commit-message-guidelines.md
-->
