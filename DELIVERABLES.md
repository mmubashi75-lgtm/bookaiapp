# BookAI v2 — Final deliverables

## 1. Files changed
- `public/bookai.html` — full dashboard: Pro gating, booking filters, analytics, conversations, branding fields, AI date awareness, legal footer, logo in chat
- `lib/ai-prompt.ts` — date awareness (today/tomorrow/next Monday…)
- `components/whatsapp/WhatsAppConnectPanel.tsx` — Pro-only
- `app/page.tsx` — redirect `/` → `/bookai.html`
- `app/layout.tsx` — admin email inject helper
- `.env.example` — complete variable list
- `README.md`

## 2. New files
- `migrations/001_core.sql`
- `migrations/002_billing_and_whatsapp.sql`
- `migrations/003_branding_reminders_analytics.sql`
- `app/api/config/route.ts`
- `app/api/reminders/run/route.ts`
- `app/api/book/route.ts`
- `app/api/paddle/*` (webhook, manage, subscription)
- `app/api/whatsapp/webhook/route.ts`
- `app/pricing`, `privacy`, `terms`, `refund`, `dashboard/billing`, `dashboard/whatsapp`
- Billing / pricing / legal components under `components/`
- `lib/*` paddle, claude, whatsapp, auth-server, supabase-admin

## 3. SQL migrations
Run in order in Supabase SQL Editor:
1. `001_core.sql` (or keep existing businesses/appointments if already created)
2. `002_billing_and_whatsapp.sql`
3. `003_branding_reminders_analytics.sql`

## 4. Required `.env.local`
See `.env.example` — includes:
- Supabase URL, anon, service role
- Anthropic
- Paddle client token, price id, env, API key, webhook secret
- WhatsApp access token + verify token
- NEXT_PUBLIC_SITE_URL
- CRON_SECRET
- NEXT_PUBLIC_ADMIN_EMAILS
- Optional Vapi

## 5. Paddle configuration
- Create **one** monthly product/price
- Put price id in `NEXT_PUBLIC_PADDLE_PRICE_ID`
- Webhook URL: `https://YOUR_DOMAIN/api/paddle/webhook`
- Events: subscription.created, subscription.updated, subscription.activated, subscription.canceled
- Copy webhook secret → `PADDLE_WEBHOOK_SECRET`

## 6. Meta Developer configuration
- App → WhatsApp → API Setup
- Webhook callback: `https://YOUR_DOMAIN/api/whatsapp/webhook`
- Verify token = `WHATSAPP_VERIFY_TOKEN`
- Subscribe to `messages`
- Permanent token → `WHATSAPP_ACCESS_TOKEN`
- Owners paste Phone number ID + WABA ID in Dashboard → Connect WhatsApp (Pro)

## 7. Supabase configuration
- Auth: disable email confirm for smooth signup
- Run migrations above
- RLS policies included in migrations
- Same project keys in `.env.local` **and** inside `public/bookai.html` SUPABASE_URL / ANON_KEY

## 8. Webhook URLs
| Service | URL |
|---------|-----|
| Paddle | `https://YOUR_DOMAIN/api/paddle/webhook` |
| WhatsApp | `https://YOUR_DOMAIN/api/whatsapp/webhook` |
| Reminders cron | `POST https://YOUR_DOMAIN/api/reminders/run` Header `Authorization: Bearer CRON_SECRET` every 10–15 min |

## 9. Storage buckets
- Create public bucket: `business-branding`
- Path convention: `{user_id}/logo.png`, `cover.jpg`, etc.
- Owners paste public URLs into Settings → Branding (logo / cover)
- Policy: authenticated upload only into own folder; public read

## 10. Database policies
- businesses / appointments / subscriptions / conversations: owner RLS
- appointment_reminders: SELECT own; writes via service role
- Webhooks use service role (bypass RLS)

## 11. Indexes
- subscriptions(user_id), paddle_subscription_id
- businesses(whatsapp_phone_number_id) unique partial
- conversations(user_id), conversation_messages(conversation_id)
- appointments(user_id, date), status
- appointment_reminders(appointment_id)

## 12. Testing checklist
- [ ] `npm install` && `npm run build` zero errors
- [ ] `/` opens bookai landing (signup + login)
- [ ] Footer: Privacy / Terms / Refund / Pricing
- [ ] Signup creates auth user + business
- [ ] Free owner: no chat link, bookings locked, WhatsApp locked
- [ ] Admin email: full Pro without paying
- [ ] `/pricing` checkout opens Paddle
- [ ] Webhook sets subscription active → Pro unlocks
- [ ] Customer `?slug=` chat books via AI + `/api/book`
- [ ] Dashboard bookings filters: All/Today/Upcoming/Completed/Cancelled
- [ ] Live Chat tab lists WhatsApp conversations
- [ ] Billing page status / invoices / cancel
- [ ] WhatsApp webhook replies using same AI + book API
- [ ] Logo URL shows in customer chat header
- [ ] Cron reminders endpoint returns JSON

## 13. Deployment checklist
- [ ] Env vars set on host (Vercel/etc.)
- [ ] Migrations applied
- [ ] Paddle webhook → production URL
- [ ] Meta webhook → production URL
- [ ] Cron hits `/api/reminders/run`
- [ ] Storage bucket created
- [ ] `NEXT_PUBLIC_SITE_URL` = production domain
- [ ] Disable sandbox Paddle tokens for live

## Behaviour summary
| Role | Access |
|------|--------|
| Customer | Chat link only — book/cancel via AI |
| Free owner | Setup business, branding URLs, services/FAQs — **no** live bookings view, **no** public chat link, **no** WhatsApp |
| Paid / admin | Everything + Billing + WhatsApp + Call sim + Conversations |

One subscription only. No Starter/Pro tiers in billing — dashboard “Pro” means **subscribed**.
