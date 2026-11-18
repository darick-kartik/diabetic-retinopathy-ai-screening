# FastAPI integration map

Real patient workflows use the centralized Axios adapter. A separate, explicitly labeled frontend demo mode uses synthetic sample records and disables upload/inference. Paths below were verified in `backend/app/main.py`, route handlers and Pydantic schemas.

## Confirmed endpoints

| Frontend operation | Method and path | Payload / response and ownership |
| --- | --- | --- |
| Patient registration | `POST /auth/register` | JSON `{ full_name, email, password }`; returns `UserResponse` (`id`, `email`, `full_name`, `role`, `is_active`, `created_at`). Backend assigns the `PATIENT` role and creates the patient profile. |
| Login | `POST /auth/login` | JSON `{ email, password }`; returns `TokenResponse` with `access_token`, `token_type` (`bearer`) and `expires_in`. |
| Restore session / identity | `GET /auth/me` | Bearer token required; returns the authenticated `UserResponse`. |
| Read profile | `GET /patients/me` | Bearer token required; returns the profile for the current user only. |
| Update profile | `PATCH /patients/me` | JSON supports only `date_of_birth` and `gender`; the backend validates past dates and the gender enum. |
| Upload retinal image | `POST /images/upload` | Multipart `file` and `eye_side` (`LEFT`, `RIGHT`, `UNKNOWN`); authenticated. Backend validates JPEG/PNG content and a 10 MB maximum, stores it, and associates the returned image ID with the current patient. |
| List patient images | `GET /images/my-images?skip=0&limit=100` | Authenticated; response includes `total` and `images`. Backend selects by current user’s patient ID. |
| Retrieve original image | `GET /images/{image_id}/file` | Authenticated; backend checks patient ownership and storage path before returning the file. |
| Request prediction | `POST /predictions/{image_id}` | No body; authenticated and ownership checked. Runs the inference service and returns `PredictionResponse`. This is requested only after upload succeeds. |
| List predictions | `GET /predictions/my-predictions?skip=0&limit=100` | Authenticated; response includes `total`, `skip`, `limit`, and `predictions`. Joined to images by `retinal_image_id`. |
| Get prediction | `GET /predictions/{prediction_id}` | Authenticated; backend verifies that prediction belongs to the current patient. |
| Generate Grad-CAM | `POST /predictions/{prediction_id}/gradcam` | No body; authenticated and ownership checked. Returns a `gradcam_url` when generation succeeds. |
| Retrieve Grad-CAM | `GET /predictions/{prediction_id}/gradcam` | Authenticated; backend checks prediction ownership and file path before returning PNG. |

The protected **Ask about my records** page reads the authenticated patient screening list above and answers a small set of record-fact questions in the browser. It does not call an LLM or other AI Q&A endpoint, does not use external knowledge, and does not answer medical advice questions. A future LLM integration would need a new patient-scoped backend endpoint with ownership checks and strict answer grounding.

The route modules and schemas are the source of truth. The UI sends the bearer JWT in an Authorization header and does not associate records by email or display name.

## Unavailable backend capabilities

These are not connected because no corresponding route exists in the current FastAPI application. Their frontend pages show unavailable states without fabricated content.

| Capability needed | Current UI state |
| --- | --- |
| Password recovery/change | Contact administrator; requires reset/change endpoints and a secure reset workflow. |
| Doctor patient directory and patient-wide access | Unavailable; requires role-restricted routes and explicit access policy/ownership checks. |
| Doctor review queue and saved assessments | Unavailable; requires review list/create/update endpoints with doctor authorization and audit fields. |
| Treatment plans and prescriptions | Unavailable; requires doctor-authorized create/read APIs, patient association, approval/audit state, and prescription handling. AI-generated guidance must never issue prescriptions. |
| Recommendations / RAG sources | Unavailable; requires patient-scoped recommendation endpoints and citation/source responses. |
| Generated report history/files | Unavailable; requires authenticated report list and file/download endpoints. |
| Notifications | Unavailable; requires a patient-scoped notification feed and read-state endpoint. |
| Admin user management, audit and metrics | Unavailable; requires admin-only routes with appropriate privacy controls. |

## Error and transport behavior

- FastAPI `detail` strings and Pydantic validation details are normalized for display.
- A 401 clears the session token and dispatches the session-expired event.
- Network and timeout errors show a clear server-connection message; no local fallback data is substituted.
- Development requests use a Vite proxy to `http://localhost:8000` when `VITE_API_BASE_URL` is blank. A cross-origin production API must permit the frontend origin through backend CORS configuration; no backend CORS changes were made in this phase.
- The backend exposes OpenAPI at `/openapi.json` and `/docs` when running. A live OpenAPI document could not be fetched in this workspace.
