# Deployment Guide

JoePDF is a fully static single-page application. There is no backend. Deploy `dist/` to any static web host.

## Build

```bash
npm ci
npm run build
# Output: dist/
```

## Option 1 — Docker (recommended for internal hosting)

```bash
docker build -t joepdf .
docker run -p 8080:80 joepdf
```

Open `http://localhost:8080`.

To run in production with a named container:

```bash
docker run -d --name joepdf --restart unless-stopped -p 8080:80 joepdf
```

## Option 2 — nginx static serve

Copy `dist/` to your nginx web root and use the provided `nginx.conf`:

```bash
cp nginx.conf /etc/nginx/conf.d/joepdf.conf
cp -r dist/* /var/www/joepdf/
nginx -s reload
```

The `nginx.conf` sets:
- Content-Security-Policy (no `unsafe-eval`, allows `worker-src 'self' blob:`)
- `X-Frame-Options: SAMEORIGIN`
- Immutable cache headers for versioned assets
- SPA fallback (`try_files $uri /index.html`)

## Option 3 — Azure Static Web Apps

1. Create an Azure Static Web App resource.
2. Connect to this GitHub repository.
3. Set build output directory to `dist`.
4. The GitHub Actions workflow will deploy on push to `main`.

Or deploy manually:

```bash
npm run build
az staticwebapp deploy --app-location . --output-location dist
```

## Option 4 — GitHub Pages

```bash
npm install --save-dev gh-pages
npm run build
npx gh-pages -d dist
```

Set repository Pages source to the `gh-pages` branch.

## Option 5 — Netlify

Drag and drop the `dist/` folder onto [app.netlify.com](https://app.netlify.com).

Or via CLI:

```bash
npm install -g netlify-cli
netlify deploy --dir=dist --prod
```

## Security headers

The application ships with CSP in `index.html` (meta tag, for dev) and in `nginx.conf` (HTTP header, for production). For highest security, use the HTTP header — meta-tag CSP is not enforced for some content types.

Recommended headers for any reverse proxy:

```
Content-Security-Policy: default-src 'self'; worker-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:;
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Reverse proxy (HTTPS)

Use nginx or Caddy as a reverse proxy with a TLS certificate. Example Caddyfile:

```
joepdf.example.com {
    root * /var/www/joepdf
    file_server
    try_files {path} /index.html
    header {
        Content-Security-Policy "default-src 'self'; worker-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self' data:;"
        X-Frame-Options SAMEORIGIN
        X-Content-Type-Options nosniff
    }
}
```

## Does this need a backend?

No. The MVP is fully static. No server, no database, no API keys. Documents are never uploaded anywhere.

Future features that would require a backend: collaborative editing, server-side OCR, certificate-based digital signatures, audit logging.
