# BookAI v2 — production setup

## What you get

- **One app entry:** `/` → `/bookai.html` (landing + **Sign up** + **Log in** + full dashboard + customer chat)
- **Pricing / legal / billing APIs** on Next.js routes
- **Pro gated by Paddle subscription** (WhatsApp connect, AI call simulator)
- **Your email** can always be Pro via `NEXT_PUBLIC_ADMIN_EMAILS` (no payment needed for you)

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local — see below
```

### Required in `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=

NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_PRICE_ID=
NEXT_PUBLIC_PADDLE_ENV=sandbox
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENV=sandbox

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=

NEXT_PUBLIC_SITE_URL=http://localhost:3000

# YOUR email — always unlocked Pro
NEXT_PUBLIC_ADMIN_EMAILS=you@gmail.com
```

**Also** put the same Supabase URL + anon key inside `public/bookai.html` (already there if you kept the file) — the static dashboard uses them directly.

### Database

In Supabase SQL Editor run:

1. `migrations/001_core.sql` (or your existing businesses/appointments schema)
2. `migrations/002_billing_and_whatsapp.sql`

Disable **Confirm email** in Supabase Auth settings so signup works immediately.

### Run

```bash
npm run dev
```

Open **http://localhost:3000** → redirects to **bookai.html** (single landing with Sign up + Log in).

## Behaviour

| Who | Can do |
|-----|--------|
| **Anyone (customer)** | Open chat link `?slug=...`, book via AI chat |
| **Owner (free / Starter)** | Dashboard, services, FAQs, bookings, preview chat. **No** WhatsApp connect, **no** call simulator until paid |
| **Owner (subscribed or admin email)** | Everything + Billing + WhatsApp + Call simulator |

Upgrade buttons open **/pricing** (Paddle checkout). Webhook updates `subscriptions` table → dashboard reads Pro status.

## Important URLs

| URL | Purpose |
|-----|---------|
| `/` or `/bookai.html` | Landing, signup, login, dashboard |
| `/bookai.html?slug=bizslug` | Customer chat only |
| `/pricing` | Subscribe (Paddle) |
| `/dashboard/billing` | Manage subscription |
| `/dashboard/whatsapp` | Connect WhatsApp (Pro only) |
| `/privacy` `/terms` `/refund` | Legal |

## Note on two Supabase clients

- `public/bookai.html` uses its own hardcoded `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- Next.js uses `NEXT_PUBLIC_SUPABASE_*` from `.env.local`

Keep them the **same project**.
