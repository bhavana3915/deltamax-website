# DeltaMax Website - Local Server and SendGrid

This project serves the static website and exposes a secure `/api/send-email` endpoint that forwards contact form submissions to SendGrid. The server keeps your SendGrid API key on the server (never in browser JS).

Important: Do NOT paste your SendGrid API key into public chat or commit it to source control. If you already pasted a key publicly, rotate it immediately in the SendGrid UI.

## Setup (Windows PowerShell)

1. Install Node.js (v16+ recommended) from https://nodejs.org/ and ensure `node` and `npm` are available.

2. In the project folder:

```powershell
cd 'C:\Users\bhava\OneDrive\Desktop\website'
npm install
```

3. Set the SendGrid API key for the current shell only (do NOT check this into Git):

```powershell
$env:SENDGRID_API_KEY = 'PASTE_YOUR_KEY_HERE'
$env:SENDGRID_FROM_EMAIL = 'bhavana@neualto.com'  # optional
npm start
```

To persist the variable across sessions use `setx` (requires restarting the shell):

```powershell
setx SENDGRID_API_KEY "PASTE_YOUR_KEY_HERE"
setx SENDGRID_FROM_EMAIL "bhavana@neualto.com"
```

4. Open `http://localhost:3000/schedule.html` in your browser and submit the contact form.

## Test the API directly (curl)

While the server is running, you can test the endpoint directly with:

```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","workEmail":"test@example.com","phoneNumber":"1234567890","companyName":"ACME","service":"Data Quality Monitoring","message":"Hello"}'
```

The server will return a JSON response. Check the server console for any debug logs.

## Security notes

- Never commit real API keys. Add `.env` to `.gitignore` and keep keys local.
- If you posted an API key publicly, rotate it in the SendGrid dashboard immediately.

## Debugging

- Server logs show minimal request info and SendGrid error responses.
- If the browser shows the client error message, open DevTools → Network to inspect the `/api/send-email` request and response.

If you want, I can add an automated health-check route or expand logging to include timestamps and request IDs. Let me know which you prefer.
