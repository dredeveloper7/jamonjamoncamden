# Jamon Jamon — Menu App

A mobile-friendly digital menu built with React, Vite, and Tailwind CSS.

## Running Locally

**Requirements:** Node.js 18+

```bash
cd menu-app
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

## Editing the Menu

All restaurant data (name, categories, items, prices, tags, theme colours) lives in one file:

```
src/data/restaurant-data.json
```

Edit that file and the browser will hot-reload instantly.

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy that folder to any static host (Vercel, Netlify, etc.).
