# RetinaCare frontend

JavaScript-only React application for the Diabetic Retinopathy AI Screening System. It connects to the existing FastAPI backend and includes an explicitly labeled local demo mode for exploring the interface without a database. The project is an academic research prototype, not a clinically validated diagnostic product.

## Local demo account

Use these credentials on the login page to enter the demo patient workspace without starting FastAPI or PostgreSQL:

- Email: `demo@retinacare.local`
- Password: `RetinaCareDemo!2026`

The demo uses synthetic sample records and fictional screening grades, clearly labeled throughout the workspace. It does not use a database, accept retinal uploads, or run AI inference/Grad-CAM. Sign out to leave demo mode. For real records and screening, configure and start the backend below.

## Start the backend

From the repository root, configure the existing backend environment and database using the root `.env.example`, then start FastAPI:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
# Set DATABASE_URL and a generated JWT_SECRET_KEY in .env before starting.
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The existing backend requires PostgreSQL, its Python dependencies, and the configured model checkpoint for inference. The repository currently has no backend dependency lock/requirements file. FastAPI publishes OpenAPI at `http://127.0.0.1:8000/docs` when the server is running.

## Start the frontend

```powershell
cd frontend
npm install
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Open the Vite URL printed in the terminal. For a production bundle and local preview:

```powershell
npm run build
npm run preview
```

## API configuration

`VITE_API_BASE_URL` is the FastAPI origin. In local development, leave it blank: Vite proxies `/auth`, `/patients`, `/images`, and `/predictions` to `http://localhost:8000`, avoiding a development CORS dependency. For deployments where the API is on a different origin, set the public API origin here and configure the backend to allow the frontend origin via CORS. If left blank in production, requests use the frontend origin and require a same-origin reverse proxy.

Vite exposes `VITE_*` values to browser code. Do not put secrets in these variables. The token is sent only in the Authorization header; no passwords are retained by the frontend.

## Connected backend operations

The adapter matches the inspected FastAPI route handlers and Pydantic schemas. See [src/services/API_ENDPOINTS.md](src/services/API_ENDPOINTS.md) for exact mapping and unsupported features.

- Patient registration and login; session restoration and role-aware UI.
- Patient profile read and supported date-of-birth/gender updates.
- Account-scoped image upload and history, including unprocessed uploads.
- Prediction history and prediction requests for the authenticated patient’s image ID.
- Protected image and Grad-CAM retrieval.
- Patient dashboard and history charts built only from API responses.
- Protected record Q&A reads the current patient’s screening history and answers limited record-fact questions in the browser. It is not an LLM or medical advice feature; an AI-backed assistant needs a separate authenticated, patient-scoped backend endpoint.

Pagination follows backend totals. Image and prediction records are joined using the backend’s `retinal_image_id`. Image uploads remain separate records if prediction creation fails; the UI reports that state and never invents a result.

## Backend capabilities not present

The existing API has no endpoints for doctor review queues/decisions, doctor patient directories, treatment plans or prescriptions, recommendation content/sources, generated reports, notifications, password recovery/change, or administrative dashboards/user management. Related pages display an unavailable state without placeholder records. The backend capability needed for each item is documented in [src/services/API_ENDPOINTS.md](src/services/API_ENDPOINTS.md).

The existing role field may identify a doctor or administrator, but these role-specific APIs are not implemented. Login can confirm the real role while the corresponding workspace explains the missing server capability.

## Security and medical limitations

- FastAPI issues an access token with `access_token`, `token_type: bearer`, and `expires_in`. The frontend calls `/auth/me` to obtain the authoritative user and role.
- The current backend does not provide HttpOnly cookie authentication. The bearer token is kept in `sessionStorage`, cleared on logout and 401 expiry, and is not written to localStorage. JavaScript running on the same origin can access sessionStorage; use HTTPS and protect against XSS.
- Backend authentication and ownership checks protect patient profiles, retinal images, prediction records and Grad-CAM files. Frontend route guards are only a usability layer.
- Demo mode includes fictional patient and grade data solely for UI exploration. It is never mixed with backend accounts, and the persistent demo banner states that results are synthetic. Demo uploads and AI inference are disabled.
- Model outputs are research results and may be uncalibrated. Grad-CAM is not lesion confirmation. Only an authorized doctor may approve and issue an actual prescription.

## Verification status

- `npm run build` is used to verify production bundling.
- The FastAPI service was not reachable in the current workspace during this phase, so live login, registration, patient data, upload and prediction tests must be run after configuring its database, dependencies, CORS/proxy and model checkpoint.
- When live API testing is unavailable, frontend build success is not reported as proof of backend integration.
