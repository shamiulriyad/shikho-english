# Shikho English frontend

React 19 + TypeScript (strict), built with Vite and styled with Tailwind CSS.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 (the port the backend's CORS policy allows) |
| `npm run typecheck` | Strict TypeScript check of the app and the Vite config |
| `npm test` | Runs the Vitest + React Testing Library suite once (`npm run test:watch` to watch) |
| `npm run build` | Type-checks, then builds the production bundle into `dist/` |
| `npm run preview` | Serves the built `dist/` on http://localhost:3000 |

## Configuration

Settings live in the single `.env` file at the repository root (copy `../.env.example`); Vite reads
it through `envDir: '..'` in `vite.config.ts`. The frontend only uses:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Only variables prefixed with `VITE_` are exposed to the browser, and they are visible to anyone
who loads the app. The backend secrets in the same file are never bundled; all AI calls go through the backend.

## Structure

```
src/
  main.tsx            entry point (providers + router)
  App.tsx             routes
  components/         UI components (+ their tests)
  context/            AuthContext, PracticeContext
  hooks/              useRequireAuth
  pages/              one component per route
  types/api.ts        response shapes of the backend API
  utils/api.ts        fetch wrapper: auth header, ProblemDetails errors, session expiry
  test/               Vitest setup and shared test helpers
```
