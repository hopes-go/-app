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

## 5. Restaurant Marketplace Pilot

The restaurant partner login appears inside **Driver/Admin Login**. For local testing, the server creates one pilot account the first time it starts:

- Username: `pilotrestaurant`
- Temporary password: `Pilot123!`

Before giving the account to a restaurant, set unique `PILOT_RESTAURANT_*` values in `config/.env` using `.env.example`. Delete `.data/restaurant-state.json` once to recreate the pilot account with those new settings. Never use the temporary password on a live website.

Add the restaurant's Stripe connected-account ID as `PILOT_RESTAURANT_STRIPE_ACCOUNT_ID`. Until this is present, the public menu can be tested but restaurant checkout intentionally remains unavailable.

At checkout, the server re-reads the current menu prices and calculates the split. The restaurant receives the food subtotal plus its configured food tax. Hope's & Go retains its service and add-on charges and the driver tip before Stripe processing fees. Confirm the correct food-tax rate with a tax professional before accepting live orders.

The restaurant editor supports store details, daily hours, menu items, prices, availability, food pictures, and weekly deals. Saving publishes changes directly to the customer restaurant page.

Before production, apply `supabase/schema.sql` so restaurant data and restaurant order lines are stored in Supabase rather than the local pilot data file.
