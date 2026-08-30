# Production deployment checklist

## 1. Repository safety
- Keep the GitHub repository private.
- Never commit `.env` files.
- Do not publish the full source code for commercial use unless you intend to open-source it.
- Keep the backend and frontend versioned separately if needed.

## 2. Backend configuration
- Set `NODE_ENV=production`
- Set a strong `JWT_SECRET`
- Set `ALLOWED_ORIGINS=https://yourdomain.com`
- Set `CLIENT_ORIGIN=https://yourdomain.com`
- Disable `SHOW_DEMO_OTP=false`

## 3. Frontend configuration
- Set `VITE_API_BASE=https://yourdomain.com/api`
- Build the app with `npm run build`
- Deploy the built static assets behind a secure web server or reverse proxy

## 4. Security operations
- Use HTTPS only
- Use a real certificate (Let's Encrypt or managed TLS)
- Run behind a reverse proxy such as Nginx or Azure App Service
- Keep secrets outside source control
- Restrict access to admin features by role
- Review audit logs regularly

## 5. Production launch checklist
- Confirm JWT secret is secret and unique
- Confirm allowed origins match the live domain only
- Confirm API rate limits are active
- Confirm no demo/test token values remain enabled
- Confirm the frontend is built from the latest code
