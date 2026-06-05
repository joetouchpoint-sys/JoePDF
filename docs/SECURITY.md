# Security and Privacy Overview

## Privacy by design

- **No uploads**: PDF documents are loaded via the browser File API directly into memory (`ArrayBuffer`). They are never sent to any server.
- **No analytics**: No tracking, telemetry, crash reporting, or third-party scripts are included.
- **No persistence**: Documents are not stored in `localStorage`, `IndexedDB`, or any other persistent storage. Memory is cleared when the browser tab is closed.
- **No external requests**: The Content Security Policy (`connect-src 'self'`) prevents any network requests to external services.

## Redaction security

### What we do

Redaction uses **canvas rasterisation**:

1. The affected PDF page is rendered to an offscreen HTML5 canvas via PDF.js at 2× resolution.
2. Redaction boxes are drawn as solid black rectangles directly onto the canvas pixels.
3. The canvas is exported as a PNG image.
4. pdf-lib replaces the original page with a new page containing only the rasterised PNG.

The resulting page contains **no text content stream** — there is nothing for copy-paste, text extraction, or annotation-removal tools to recover.

### What we do not do

We do **not** implement redaction as an overlay annotation (black box on top of visible text). That approach is cosmetic only and can be bypassed by:
- Removing the annotation layer
- Text extraction tools
- Copy-paste
- Dimension-based inference attacks (measuring the width of the redaction box)

### Known limitations

| Content type | Redaction guarantee |
|---|---|
| PDF text content streams | ✅ Fully removed (rasterised) |
| Embedded vector graphics | ✅ Fully removed (rasterised) |
| Page annotations / form fields | ✅ Removed (rasterised, not copied) |
| Document metadata (author, title…) | ✅ Optional removal via export settings |
| Embedded attachments | ⚠️ Not currently removed — use "Remove metadata" option and verify |
| Bookmarks referencing redacted text | ⚠️ Bookmarks/outlines not currently stripped |
| JavaScript embedded in PDF | ⚠️ JavaScript is stripped by pdf-lib during save, but verify |
| Encrypted PDFs | ❌ Encrypted documents cannot be opened by this application |

**Important:** After redacting, verify the output PDF in a separate viewer and confirm the redacted content is not selectable or visible.

### Trade-offs of rasterisation

- **File size increases** (~2–5 MB per rasterised page at 2× quality vs typically 50–200 KB for a vector page)
- **Text is no longer searchable** on rasterised pages
- **Visual quality** is high at 2× but marginally below the original vector rendering at very high zoom

## Content Security Policy

The application ships with the following CSP:

```
default-src 'self';
worker-src 'self' blob:;
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'self';
font-src 'self' data:;
```

`unsafe-inline` for styles is required by Tailwind CSS's runtime class generation and Konva's inline canvas styles. Scripts do not use `unsafe-inline` or `unsafe-eval`.

## Dependency security

Dependencies are pinned by `package-lock.json`. Run `npm audit` regularly to check for known vulnerabilities. At the time of initial release, zero vulnerabilities were detected.

Key security notes per library:

- **PDF.js (pdfjs-dist v5)**: CVE-2024-4367 (arbitrary JS execution) was fixed in v4.2.67. We use v5.x which is not affected. `isEvalSupported` is not set (defaults to disabled in v5).
- **Konva**: No known CVEs. Does not use `eval` or `new Function`.
- **pdf-lib**: No known CVEs. Pure JavaScript PDF manipulation.

## Branding data

Branding configuration (logo, colours, organisation name) is stored in `localStorage` only. This data stays on the user's device and is never transmitted.

## Recommended deployment practices

- Serve over **HTTPS only** in production.
- Set the **`X-Frame-Options: SAMEORIGIN`** header to prevent clickjacking.
- Use the nginx.conf provided in this repository which includes all recommended headers.
- Do not serve the application with `unsafe-eval` in the CSP — this would open XSS attack vectors.
- Restrict access to internal network or VPN for confidential document workflows.
