# JoePDF

Browser-based PDF editor for internal company use. All processing runs entirely client-side — no files are ever uploaded to a server.

## Features

- Annotate PDFs — text, shapes, freehand drawing, highlights, images
- Secure redaction (canvas rasterisation — content is truly removed)
- Sign PDFs — draw, type, or upload a signature and stamp it anywhere
- Page management — reorder, delete, duplicate, rotate pages
- Split and merge PDFs
- Compress PDFs
- Undo / redo for all edits
- Company branding — logo, colours, fonts (saved to the repo via GitHub API)

## Running locally

```bash
npm install
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm test           # unit tests
npm run type-check # TypeScript check
```

## Admin login

The settings gear opens a branding panel protected by an admin login.

**Default credentials:** username `Admin`, password `AdminPDF!`

You can change these from inside the panel (Settings → Change credentials). Custom credentials are stored in your browser's localStorage on the current device only.

> **Note:** The admin panel only changes branding — colours, logo, fonts, app name. Saving changes globally commits to the GitHub repo via the GitHub API using a Personal Access Token stored on your own device. Without that PAT, changes are local to your browser only. There is no meaningful security risk to having the default credentials visible here.

## Stack

React 19 · TypeScript · Vite · pdf.js · pdf-lib · Konva · Zustand · Tailwind CSS
