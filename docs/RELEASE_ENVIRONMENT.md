# Production environment contract

The backend must receive these values from the deployment secret store, never from committed files:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` (different from `JWT_SECRET`)
- `SETTINGS_ENCRYPTION_KEY` (exactly 64 hexadecimal characters; back it up securely and never rotate it without re-entering encrypted settings)
- `CORS_ORIGINS` (comma-separated trusted web origins)
- `GEMINI_API_KEY` is optional as an environment fallback. The normal production flow is Admin → AI Ayarları, where a key is verified and stored with AES-256-GCM encryption.
- `GEMINI_CHAT_MODEL` (default: `gemini-3.6-flash`)
- `GEMINI_MODERATION_MODEL` (default: `gemini-3.5-flash-lite`)
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` when web push is enabled. `VAPID_EMAIL` may be the HTTPS support URL; a mailbox is not required.
- `ADMIN_EMAIL` only when running the one-off admin promotion script

Mobile production builds must provide the Firebase values and OAuth identifiers referenced by the Expo config. The backend and web public API URL must resolve to the same production API over HTTPS.

Release verification must fail if the Admin AI connection test fails, JWT/encryption secrets are missing or sample values, support ticket creation/status/admin management fails, or database migrations do not match the deployed backend image.
