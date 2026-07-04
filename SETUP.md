# Hope's & Go Setup

## 1. Supabase

In your Supabase project, open the SQL editor and run:

1. `supabase/schema.sql`
2. `supabase/storage.sql`

Then copy these into your local `.env` file:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep the service role key private. Do not paste it into chat.

## 2. Stripe Sandbox

Add your Stripe sandbox keys to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 3. Text Alerts

For texts to `319-594-4964`, use Twilio and add:

```env
OWNER_PHONE_NUMBER=+13195944964
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=...
```

## 4. Run Locally

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000
```
