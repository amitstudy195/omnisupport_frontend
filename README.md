# OmniSupport Frontend

This folder contains the React frontend for the OmniSupport real-time ticketing system.

## What it includes
- Customer support portal for submitting and tracking tickets
- Agent dashboard for claiming tickets, updating status, and live chat
- Admin dashboard for ticket audit, monitoring progress, and system oversight
- Tailwind CSS styling and responsive layout
- Socket.IO client for real-time updates

## Run locally

1. Open a terminal in `frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open the Vite URL shown in the terminal (typically `http://localhost:5173`)

## Available scripts
- `npm run dev` — start frontend development server
- `npm run build` — create a production build
- `npm run preview` — preview the production build
- `npm run lint` — run Oxlint checks

## Notes
- The frontend communicates with the backend API at `API_BASE_URL` from `src/context/AuthContext.jsx`.
- Make sure the backend is running before testing login, ticket creation, or live chat.
- If you change backend routes or authentication, update the frontend API base URL accordingly.
