# BookAI — complete project (ready to deploy)

## 1. Install
```bash
npm install
cp .env.example .env.local
```

## 2. Fill `.env.local` (and the same keys on Vercel)

See `.env.example` for the full list.

**Required minimum:**
- Supabase URL, anon, service role
- Anthropic API key
- `NEXT_PUBLIC_ADMIN_EMAILS=your@email.com`

**Paddle (checkout):**
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_ENV=sandbox` or `production`
- `NEXT_PUBLIC_PADDLE_PRICE_ID` → Simple $59
- `NEXT_PUBLIC_PADDLE_PRICE_ID_GROWTH` → Growth $149
- `NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_VOICE` → Pro $379
- Packs: `..._PACK_50` / `100` / `300` / `500` / `1000`

**Also hardcode Supabase URL + anon key** at the top of `public/bookai.html` (same values as env).

## 3. Supabase SQL (run in order)
1. `migrations/SUPABASE_SETUP.sql` (or 001 + 002 + 003 if starting fresh)
2. `migrations/004_vapi_minutes.sql`

Auth → Email → **disable Confirm email**.

Approve owners: set `businesses.approval_status = 'approved'`.

## 4. Run locally
```bash
npm run dev
```
Open http://localhost:3000

## 5. Deploy (Vercel)
```bash
git push
```
Add all `NEXT_PUBLIC_*` env vars on Vercel → **Redeploy**.

### Webhooks
| Service | URL |
|---------|-----|
| Paddle | `https://YOUR_DOMAIN/api/paddle/webhook` |
| WhatsApp | `https://YOUR_DOMAIN/api/whatsapp/webhook` |
| Vapi | `https://YOUR_DOMAIN/api/vapi/webhook` |

## Plans
| Plan | Price | Voice min/mo | Chat history |
|------|-------|--------------|--------------|
| Simple | $59 | 100 | last 10 |
| Growth | $149 | 300 | last 30 |
| Pro Voice | $379 | 1000 | last 70 |

Minute top-ups: $0.40/min · bulk 500+ / 1000 @ $0.35/min.
