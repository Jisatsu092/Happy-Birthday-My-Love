# Galaxy App — Delfi Suryani

## Struktur
```
/          → Portfolio HTML (halaman pertama)
/galaxy    → React galaxy app
```

## Deploy ke Vercel

1. Push project ini ke GitHub
2. Buka vercel.com → New Project → import repo
3. Framework: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy

Selesai. Vercel otomatis baca `vercel.json` untuk routing.

## Dev lokal
```bash
npm install
npm run dev
```
- Portfolio: http://localhost:5173/
- Galaxy: http://localhost:5173/galaxy
