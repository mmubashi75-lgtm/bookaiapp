# BookAI — start here

## 1. Supabase (5 minutes)

1. SQL Editor → paste and run **`migrations/SUPABASE_SETUP.sql`**
2. Authentication → Email → **disable “Confirm email”**
3. (Optional) Storage → create public bucket **`business-branding`**

Your existing `businesses` and `appointments` tables are kept.
The script only adds WhatsApp/branding columns + new tables:
`subscriptions`, `conversations`, `conversation_messages`, `appointment_reminders`.

## 2. Env

```bash
cp .env.example .env.local
```

Fill all keys. Set `NEXT_PUBLIC_ADMIN_EMAILS` to your Gmail.

**Also** open `public/bookai.html` and set the same Supabase URL + anon key
near the top (`SUPABASE_URL` / `SUPABASE_ANON_KEY`) so the dashboard matches.

## 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 4. Sign up once with your admin email

Use the same email as `NEXT_PUBLIC_ADMIN_EMAILS` so you get Pro free.

## 5. Test URLs

- Dashboard: `/bookai.html`
- Customer chat: `/chat/YOUR_SLUG` or `/bookai.html?slug=YOUR_SLUG`
- Voice: `/voice?slug=YOUR_SLUG`
- Pricing: `/pricing`
- Billing: `/dashboard/billing`

## 6. Webhooks (when you deploy)

- Paddle: `https://YOUR_DOMAIN/api/paddle/webhook`
- WhatsApp: `https://YOUR_DOMAIN/api/whatsapp/webhook`
