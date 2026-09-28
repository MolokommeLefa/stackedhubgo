# StackedHub Go Frontend — User Manual

This guide explains how to run the StackedHub frontend locally for demos, testing, and user acceptance.

## 1) What this application is

StackedHub is a restaurant management and customer engagement frontend.  
It can run in:

- **Demo mode** (no backend required)
- **Live API mode** (connected to the backend API)

---

## 2) System requirements

Install the following before starting:

- **Node.js 20+** (recommended: latest LTS)
- **npm 10+**
- A modern browser (Chrome, Edge, Firefox)

To confirm installation:

```sh
node -v
npm -v
```

---

## 3) Get the project

```sh
git clone <this-repository-url>
cd stackedhubgo
```

---

## 4) Install dependencies

```sh
npm install
```

Run this command again whenever `package.json` changes.

---

## 5) Start the application (development mode)

```sh
npm run dev
```

After startup, open the URL shown in the terminal (typically `http://localhost:5173`).

### Stop the app

Press `Ctrl + C` in the same terminal window.

---

## 6) Connect to backend API (optional)

If you want live backend data instead of demo data, configure the API base URL.

### Option A: Use environment variable (recommended for setup)

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Then restart:

```sh
npm run dev
```

### Option B: Configure from the app Settings page

The app can also save API URL and auth token in browser local storage.

### Important behavior

- If no API URL is configured, the app stays in **demo mode**
- If API URL is configured, API calls use JWT auth where required

---

## 7) Build for deployment

Create a production build:

```sh
npm run build
```

Build output is generated in `dist/`.

Preview the production build locally:

```sh
npm run preview
```

---

## 8) Quality checks

Lint the project:

```sh
npm run lint
```

Format code:

```sh
npm run format
```

---

## 9) Troubleshooting

### Port already in use

If Vite reports a port conflict, stop the other process or rerun with another port:

```sh
npm run dev -- --port 5174
```

### Dependencies fail to install

Delete `node_modules` and reinstall:

```sh
rm -rf node_modules
npm install
```

### API not reachable

- Confirm backend is running
- Confirm `VITE_API_BASE_URL` points to the correct host/port
- Restart the frontend after changing `.env`

---

## 10) Project scripts reference

- `npm run dev` — start local development server
- `npm run build` — create production build
- `npm run build:dev` — create development-mode build
- `npm run preview` — preview built app
- `npm run lint` — run ESLint checks
- `npm run format` — run Prettier formatting

---

## Lovable sync

This project is connected to [Lovable](https://lovable.dev) and can also be edited in the [Lovable project editor](https://lovable.dev/projects/bd7363b2-0415-4c19-a5c6-dea7f1f4dfd7).
