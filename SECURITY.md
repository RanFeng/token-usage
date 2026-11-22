# Security Policy

## Privacy & Security Architecture

**Token Usage** is designed from the ground up as a **100% local, read-only, zero-dependency** plugin:

- Reads local Antigravity transcripts directly from `~/.gemini/antigravity/brain/`.
- Never uploads transcripts, prompts, file paths, or telemetry to external servers.
- Lite DLP secret detection runs purely in-memory on your machine and never stores or renders raw credential values.
- The only optional outbound request is the user-initiated or cached *Check for Updates* call to GitHub's public Releases API.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| `1.1.x` | Yes       |
| `< 1.1` | No        |

## Reporting a Vulnerability

If you discover a security vulnerability (for example, an XSS issue in the Sidecar web UI, a path traversal bug in local file export, or a secret leak in share cards):

1. **Please do NOT open a public GitHub Issue.**
2. Report it privately using GitHub's **Security Advisories** (*Security* tab → *Report a vulnerability*) on [RanFeng/token-usage](https://github.com/RanFeng/token-usage/security/advisories/new).
3. Include a clear description of the vulnerability, steps to reproduce, and any suggested mitigation.

We will acknowledge receipt within 72 hours and coordinate a fix and disclosure timeline with you.
