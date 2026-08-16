# voting-app

College election app.

## Backend Setup

1. Install dependencies: (from `Backend/`)
   ```bash
   npm install
   ```
2. Copy `Backend/.env.example` to `Backend/.env` and fill values.
3. Make sure you add email credentials:
   - For Gmail: enable 2FA, create an "App password", use full email as `EMAIL_USER` and the 16-char password (no
     spaces) as `EMAIL_PASS`.
   - Or provide custom SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`).
4. Start the server:
   ```bash
   cd Backend
   npm run dev
   ```

If `EMAIL_USER` / `EMAIL_PASS` are missing you'll see: `Email transport not configured`. Add them and restart.

## Frontend Setup

From `Frontend/`:

```bash
npm install
npm run dev
```

## Environment Variables (summary)

See `Backend/.env.example` for all variables. Required minimum:

```
MONGO_URI=...
ADMIN_PASS=...
EMAIL_USER=...
EMAIL_PASS=...
```

Optional: voting window (`VOTING_START`, `VOTING_END`).

OTP expiry length can be customized with `OTP_EXPIRY_MINUTES` (default 30). Increase if users need more time, decrease
for higher security.

## OTP Email

The backend sends OTP emails when users request to vote. If email creds are invalid startup will log a verification
error.
