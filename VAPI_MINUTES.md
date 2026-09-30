# Vapi voice minutes — setup

## 1. SQL
Run `migrations/004_vapi_minutes.sql` in Supabase SQL Editor.

## 2. Env
```
NEXT_PUBLIC_PADDLE_PRICE_ID=...          # Simple = 100 min/mo
NEXT_PUBLIC_PADDLE_PRICE_ID_GROWTH=...   # 300 min/mo
NEXT_PUBLIC_PADDLE_PRICE_ID_PRO_VOICE=...# 1000 min/mo
NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_50=...
NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_100=...
NEXT_PUBLIC_PADDLE_PRICE_ID_PACK_300=...
NEXT_PUBLIC_VAPI_PUBLIC_KEY=...
NEXT_PUBLIC_VAPI_ASSISTANT_ID=...
```

## 3. Vapi dashboard
Server URL: `https://YOUR_DOMAIN/api/vapi/webhook`  
Enable **end-of-call-report**.

## 4. Flow
1. Customer opens `/voice?slug=...`
2. `POST /api/vapi/start-call` → remaining minutes + `maxDurationSeconds`
3. If 0 remaining → call blocked
4. Vapi starts with `maxDurationSeconds` hard cap
5. Call ends → Vapi posts end-of-call-report → minutes added to `minutes_used`
6. Dashboard Settings shows usage bar

## 5. Defaults
New businesses: `monthly_minutes_limit = 100`, `subscription_plan = simple`.
