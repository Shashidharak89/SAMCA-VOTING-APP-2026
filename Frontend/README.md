# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## API / CORS

During development the frontend uses a Vite dev server proxy (`vite.config.js`) so any request to relative paths starting with `/api` is forwarded to `http://localhost:5000`. Components now default to `API_BASE = '/api'` unless you set `VITE_API_BASE_URL` in a `.env` file. This avoids cross-origin CORS issues between the two GitHub Codespace preview ports. For custom backends provide `VITE_API_BASE_URL` (including protocol + host). When deploying you can set that env var at build time.
