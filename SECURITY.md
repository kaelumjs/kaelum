# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.4.x   | ✅ Active  |
| < 1.4   | ❌ End of life |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email us at: **campagno.matheus@gmail.com**

Include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix & release**: Depending on severity, typically within 2 weeks

## Disclosure Policy

- We will coordinate with you on disclosure timing
- We will credit reporters in the release notes (unless you prefer anonymity)
- We follow [responsible disclosure](https://en.wikipedia.org/wiki/Responsible_disclosure) practices

## Security Best Practices for Users

- Always use the latest version of Kaelum
- Keep your dependencies up to date (`npm audit`)
- Never expose `exposeStack: true` in production
- Use `helmet` via `setConfig({ helmet: true })` for HTTP security headers
