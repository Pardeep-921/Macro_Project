# MACO ERP Demo

This is a self-contained React/Vite demo build for client presentation. The frontend uses seeded mock data in browser `localStorage`, so it can be deployed directly on Vercel without an API server or database.

## Demo Login

Use either account:

```text
Admin: admin / admin
Customer: customer / customer

Also supported:
Admin: admin@maco.demo / demo123
Customer: customer@maco.demo / demo123
```

Demo data includes companies, products, orders, supplies, CRM leads/deals/tasks, master data, reporting charts, CSV exports, and PDF generation flows.

## Local Launch

```powershell
npm install
npm run dev
```

To reset the demo data, clear the browser's local storage for the site or run this in the browser console:

```js
localStorage.removeItem('maco_demo_db_v1');
localStorage.removeItem('maco_user');
localStorage.removeItem('maco_po_cart');
location.reload();
```

## Deploy on Vercel

Use these Vercel project settings:

- Framework Preset: `Vite`
- Root Directory: project root
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

No Vercel environment variables are required for the demo version.

The included `vercel.json` keeps React Router pages working on refresh by routing all app paths back to `index.html`.
