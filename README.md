# Macro_Project
This is the project for enterprise.

## Local Launch Checklist

1. Create `backend/.env` with `JWT_SECRET`, `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE`.
2. Optional backend settings: `MYSQL_PORT=3306`, `MYSQL_POOL_SIZE=10`, `CORS_ORIGIN=http://localhost:5173`, and SMTP settings for live emails.
3. Create frontend `.env` in this folder with `VITE_API_URL=http://localhost:3000`.
4. Install dependencies in both folders:

```powershell
npm install
cd backend
npm install
```

5. From `backend`, run the final QA checks:

```powershell
npm test
npm run audit:phase6
```

6. Start local services in two terminals:

```powershell
cd backend
npm run dev
```

```powershell
npm run dev
```

Manual smoke path: log in as `admin/admin` and `customer/customer`, browse catalog, submit a customer order, approve it as admin, upload challan details, verify customer supply tracking, generate PDF, and export catalog/orders/supplies.

## Configure API URL

The frontend reads the backend URL from `VITE_API_URL`.

- Create a file named `.env` in the project root (same folder as `package.json`)
- Add:

`VITE_API_URL=http://localhost:3000`

If you don't create `.env`, it defaults to `http://localhost:3000`.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
