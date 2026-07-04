const express = require("express");
const path = require("path");
const Stripe = require("stripe");
const twilio = require("twilio");

require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "config", ".env"), override: false });

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
const ownerPhoneNumber = process.env.OWNER_PHONE_NUMBER || "+13195944964";
let stripeClient = null;
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const services = [
  { id: 1, name: "Pickup & Delivery", price: 10, category: "Main Services" },
  { id: 2, name: "Shop & Deliver", price: 15, category: "Main Services" },
  { id: 3, name: "Custom Request", price: 20, category: "Main Services" },
  { id: 4, name: "Holiday & After-Hours Service", price: 10, category: "Add-ons" },
  { id: 5, name: "Additional Stop", price: 5, category: "Add-ons" },
  { id: 6, name: "Service Area Tier 1", price: 10, category: "Service Areas" },
  { id: 7, name: "Service Area Tier 2", price: 15, category: "Service Areas" },
  { id: 8, name: "Service Area Tier 3", price: 20, category: "Service Areas" },
  { id: 9, name: "Service Area Tier 4", price: 30, category: "Service Areas" },
];

const discounts = [
  { code: "NIGHT50", type: "percent", amount: 50 },
  { code: "NEW10", type: "fixed", amount: 10 },
  { code: "BUSYDAY", type: "percent", amount: 10 },
  { code: "CARE5", type: "fixed", amount: 5 },
];

app.use(express.json());
app.use(express.static(__dirname));

function toCents(amount) {
  return Math.max(0, Math.round(amount * 100));
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

function getDiscountAmount(subtotal, code) {
  const discount = discounts.find((item) => item.code === String(code || "").toUpperCase());
  if (!discount) return 0;
  if (discount.type === "percent") return subtotal * (discount.amount / 100);
  return Math.min(discount.amount, subtotal);
}

function normalizePhoneNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(phone || "").trim();
}

async function sendTextMessage(to, message) {
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER || !to) {
    console.log(`SMS not sent. Configure Twilio to text ${to || "recipient"}: ${message}`);
    return;
  }

  await twilioClient.messages.create({
    to: normalizePhoneNumber(to),
    from: process.env.TWILIO_FROM_NUMBER,
    body: message,
  });
}

async function sendOwnerText(message) {
  await sendTextMessage(ownerPhoneNumber, message);
}

app.post("/send-verification-code", async (req, res) => {
  const phone = normalizePhoneNumber(req.body.phone);
  const code = String(req.body.code || "").trim();

  if (!phone || !code) {
    return res.status(400).json({ error: "Phone and code are required." });
  }

  try {
    await sendTextMessage(
      phone,
      `Hope's & Go: Your verification code is ${code}. Do not share this code. Reply STOP to unsubscribe or HELP for help.`
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("Verification SMS failed:", error.message);
    res.status(500).json({ error: "Verification text could not be sent yet." });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY." });
  }

  const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
  const selectedItems = requestedItems
    .map((item) => {
      const service = services.find((entry) => entry.id === Number(item.id));
      const quantity = Math.max(1, Number(item.quantity || 1));
      return service ? { ...service, quantity } : null;
    })
    .filter(Boolean);

  if (!selectedItems.length) {
    return res.status(400).json({ error: "No checkout items selected." });
  }

  const customer = req.body.customer || {};
  const hasMainService = selectedItems.some((item) => item.category === "Main Services");
  if (!hasMainService) {
    return res.status(400).json({ error: "Choose a main service before checkout." });
  }

  const hasServiceArea = selectedItems.some((item) => item.category === "Service Areas");
  const outsideBaseArea = /west burlington|mediapolis|fort madison|mount pleasant|danville|new london/i.test(
    customer.deliveryAddress || ""
  );
  if (outsideBaseArea && !hasServiceArea) {
    return res.status(400).json({ error: "Add the correct service area tier before checkout." });
  }

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = getDiscountAmount(subtotal, req.body.discountCode);
  const tip = Math.max(0, Number(req.body.tip || 0));
  const shoppingHold = Math.max(0, Number(req.body.shopping?.holdTotal || 0));
  const finalTotal = Math.max(0.5, subtotal - discountAmount + tip + shoppingHold);

  const description = [
    `Customer: ${customer.name || "Not provided"}`,
    `Phone: ${customer.phone || "Not provided"}`,
    `Pickup: ${customer.pickupAddress || "Not provided"}`,
    `Delivery: ${customer.deliveryAddress || "Not provided"}`,
  ].join(" | ");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customer.email,
    phone_number_collection: {
      enabled: false,
    },
    submit_type: "pay",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: "Hope's & Go request authorization",
            description,
          },
          unit_amount: toCents(finalTotal),
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual",
      description: "Hope's & Go request authorization. Capture after driver accepts.",
      metadata: {
        customer_name: customer.name || "",
        customer_phone: customer.phone || "",
        pickup_address: customer.pickupAddress || "",
        delivery_address: customer.deliveryAddress || "",
        selected_services: selectedItems.map((item) => `${item.name} x${item.quantity}`).join(", "),
        discount_code: req.body.discountCode || "",
        tip: String(tip),
        shopping_estimate: String(req.body.shopping?.estimate || 0),
        shopping_cushion: String(req.body.shopping?.cushion || 0),
        shopping_hold_total: String(req.body.shopping?.holdTotal || 0),
        shopping_items: Array.isArray(req.body.shopping?.items) ? req.body.shopping.items.join(", ") : "",
        shopping_photo_names: Array.isArray(req.body.shopping?.photos) ? req.body.shopping.photos.join(", ") : "",
        refund_note: "Refund unused shopping estimate funds immediately when shopping is completed.",
      },
    },
    success_url: `${baseUrl}/index.html?checkout=authorized#storefront`,
    cancel_url: `${baseUrl}/index.html?checkout=cancelled#storefront`,
  });

  const ownerMessage = [
    "New Hope's & Go request",
    `Customer: ${customer.name || "Not provided"}`,
    `Phone: ${customer.phone || "Not provided"}`,
    `Services: ${selectedItems.map((item) => `${item.name} x${item.quantity}`).join(", ")}`,
    `Estimated total: $${finalTotal.toFixed(2)}`,
    `Pickup: ${customer.pickupAddress || "Not provided"}`,
    `Delivery: ${customer.deliveryAddress || "Not provided"}`,
  ].join("\n");

  sendOwnerText(ownerMessage).catch((error) => {
    console.error("Owner SMS failed:", error.message);
  });

  res.json({ url: session.url });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Hope's & Go app running at ${baseUrl}`);
});
