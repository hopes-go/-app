const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Stripe = require("stripe");
const twilio = require("twilio");

require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "config", ".env"), override: false });

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.APP_BASE_URL || `http://localhost:${port}`;
const ownerPhoneNumber = process.env.OWNER_PHONE_NUMBER || "+13195944964";
const operationsTimeZone = "America/Chicago";
const availabilityDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const operatingStartMinutes = 8 * 60;
const operatingEndMinutes = 24 * 60;
const defaultOwnerScheduleDays = {
  Monday: [{ start: "08:00", end: "17:00" }, { start: "20:30", end: "00:00" }],
  Tuesday: [{ start: "08:00", end: "00:00" }],
  Wednesday: [{ start: "08:00", end: "00:00" }],
  Thursday: [{ start: "08:00", end: "17:00" }, { start: "21:00", end: "00:00" }],
  Friday: [{ start: "08:00", end: "00:00" }],
  Saturday: [{ start: "08:00", end: "00:00" }],
  Sunday: [{ start: "13:00", end: "00:00" }],
};
const operationsStatePath = path.join(__dirname, ".data", "operations-state.json");
const defaultDriverSchedules = {
  "Landyn Gavin": {
    days: {
      Monday: [{ start: "15:00", end: "00:00" }],
      Thursday: [{ start: "15:00", end: "00:00" }],
    },
    updatedAt: "",
  },
};
let stripeClient = null;
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;
const twilioMessagingServiceSid = String(process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();

const defaultOperationsState = {
  ownerOverride: "Auto",
  ownerOverrideUpdatedAt: "",
  drivers: {},
  driverSchedules: defaultDriverSchedules,
  alerts: [],
  clockInAlertKeys: [],
};

function loadOperationsState() {
  try {
    const saved = JSON.parse(fs.readFileSync(operationsStatePath, "utf8"));
    return {
      ...defaultOperationsState,
      ...saved,
      drivers: saved.drivers || {},
      driverSchedules: { ...defaultDriverSchedules, ...(saved.driverSchedules || {}) },
      alerts: Array.isArray(saved.alerts) ? saved.alerts : [],
      clockInAlertKeys: Array.isArray(saved.clockInAlertKeys) ? saved.clockInAlertKeys : [],
    };
  } catch {
    return { ...defaultOperationsState, drivers: {}, driverSchedules: defaultDriverSchedules, alerts: [], clockInAlertKeys: [] };
  }
}

let operationsState = loadOperationsState();

function saveOperationsState() {
  try {
    fs.mkdirSync(path.dirname(operationsStatePath), { recursive: true });
    fs.writeFileSync(operationsStatePath, JSON.stringify(operationsState, null, 2));
  } catch (error) {
    console.error("Operations state could not be saved:", error.message);
  }
}

function getCentralTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: operationsTimeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour || 0) % 24;
  const minute = Number(values.minute || 0);
  return {
    weekday: values.weekday,
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
  };
}

function getOperatingContext(date = new Date()) {
  const parts = getCentralTimeParts(date);
  const isOperatingHours = parts.minuteOfDay >= 8 * 60 && parts.minuteOfDay < 24 * 60;
  const blocks = [
    { id: "shift-a", label: "Shift A", start: 8 * 60, end: 14 * 60 },
    { id: "shift-b", label: "Shift B", start: 14 * 60, end: 20 * 60 },
    { id: "shift-c", label: "Shift C", start: 20 * 60, end: 24 * 60 },
  ];
  const currentBlock = blocks.find(
    (block) => parts.minuteOfDay >= block.start && parts.minuteOfDay < block.end
  ) || null;
  return { ...parts, isOperatingHours, currentBlock, blocks };
}

function getOwnerAutomaticStatus(date = new Date()) {
  const context = getOperatingContext(date);
  if (!context.isOperatingHours) return "Offline";
  return isWithinWeeklySchedule(getOwnerScheduleDays(), context) ? "Online" : "Offline";
}

function timeValueToMinutes(value, { end = false } = {}) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return NaN;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return NaN;
  if (end && hour === 0 && minute === 0) return operatingEndMinutes;
  return hour * 60 + minute;
}

function normalizeWeeklySchedule(days = {}) {
  const normalized = {};
  availabilityDays.forEach((day) => {
    const intervals = Array.isArray(days[day]) ? days[day] : [];
    const valid = intervals
      .slice(0, 8)
      .map((interval) => ({
        start: String(interval?.start || ""),
        end: String(interval?.end || ""),
      }))
      .filter((interval) => {
        const start = timeValueToMinutes(interval.start);
        const end = timeValueToMinutes(interval.end, { end: true });
        return Number.isFinite(start) && Number.isFinite(end) && start >= operatingStartMinutes && end <= operatingEndMinutes && start < end;
      })
      .sort((a, b) => timeValueToMinutes(a.start) - timeValueToMinutes(b.start));
    if (valid.length) normalized[day] = valid;
  });
  return normalized;
}

function getOwnerScheduleDays() {
  const saved = normalizeWeeklySchedule(operationsState.driverSchedules?.Hope?.days || {});
  return Object.keys(saved).length ? saved : defaultOwnerScheduleDays;
}

function isWithinWeeklySchedule(days, context) {
  return (days?.[context.weekday] || []).some((interval) => {
    const start = timeValueToMinutes(interval.start);
    const end = timeValueToMinutes(interval.end, { end: true });
    return context.minuteOfDay >= start && context.minuteOfDay < end;
  });
}

function getScheduleGaps(ownerDays, day) {
  const intervals = (ownerDays?.[day] || [])
    .map((interval) => ({
      start: timeValueToMinutes(interval.start),
      end: timeValueToMinutes(interval.end, { end: true }),
    }))
    .sort((a, b) => a.start - b.start);
  const gaps = [];
  let cursor = operatingStartMinutes;
  intervals.forEach((interval) => {
    if (interval.start > cursor) gaps.push({ start: cursor, end: interval.start });
    cursor = Math.max(cursor, interval.end);
  });
  if (cursor < operatingEndMinutes) gaps.push({ start: cursor, end: operatingEndMinutes });
  return gaps;
}

function formatScheduleTime(value) {
  const minutes = typeof value === "number" ? value : timeValueToMinutes(value, { end: true });
  if (minutes === operatingEndMinutes) return "12:00 AM";
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function getOwnerScheduleSnapshot() {
  const ownerDays = getOwnerScheduleDays();
  return {
    timeZone: operationsTimeZone,
    operatingHours: "8:00 AM-12:00 AM",
    exactDays: ownerDays,
    days: availabilityDays.map((day) => {
      const online = (ownerDays[day] || [])
        .map((interval) => `${formatScheduleTime(interval.start)}-${formatScheduleTime(interval.end)}`)
        .join(" and ") || "Offline";
      const gaps = getScheduleGaps(ownerDays, day);
      const breakText = gaps.length
        ? gaps.map((gap) => `Offline ${formatScheduleTime(gap.start)}-${formatScheduleTime(gap.end)}`).join(" and ")
        : "No scheduled break";
      return { day, online, break: breakText };
    }),
  };
}

function getOwnerEffectiveStatus(date = new Date()) {
  return operationsState.ownerOverride && operationsState.ownerOverride !== "Auto"
    ? operationsState.ownerOverride
    : getOwnerAutomaticStatus(date);
}

function getEffectiveDriverStatuses(date = new Date()) {
  const ownerStatus = getOwnerEffectiveStatus(date);
  const drivers = [
    {
      name: "Hope",
      role: "Owner / Driver",
      status: ownerStatus,
      clockedIn: ["Online", "Busy"].includes(ownerStatus),
      available: ownerStatus === "Online",
      source: operationsState.ownerOverride === "Auto" ? "Automatic schedule" : "Manual override",
      updatedAt: operationsState.ownerOverrideUpdatedAt || "",
    },
  ];
  const additionalDriverNames = new Set([
    ...Object.keys(operationsState.drivers || {}),
    ...Object.keys(operationsState.driverSchedules || {}).filter((name) => name.toLowerCase() !== "hope"),
  ]);
  additionalDriverNames.forEach((name) => {
    if (name.toLowerCase() === "hope") return;
    const record = operationsState.drivers?.[name] || {};
    const status = ["Online", "Busy", "Offline"].includes(record.status) ? record.status : "Offline";
    const schedule = normalizeWeeklySchedule(operationsState.driverSchedules?.[name]?.days || {});
    const withinScheduledCoverage = Object.keys(schedule).length
      ? isWithinWeeklySchedule(schedule, getOperatingContext(date))
      : true;
    const effectiveStatus = withinScheduledCoverage ? status : "Offline";
    drivers.push({
      name,
      role: "Driver",
      status: effectiveStatus,
      clockedIn: ["Online", "Busy"].includes(effectiveStatus),
      available: effectiveStatus === "Online",
      source: Object.keys(schedule).length ? "Driver clock + scheduled coverage" : "Driver clock",
      updatedAt: record.updatedAt || "",
    });
  });
  return drivers;
}

function createOperationsAlert(type, title, message, metadata = {}) {
  const alert = {
    id: `OPS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    message,
    metadata,
    createdAt: new Date().toISOString(),
  };
  operationsState.alerts = [alert, ...(operationsState.alerts || [])].slice(0, 100);
  saveOperationsState();
  return alert;
}

const services = [
  { id: 1, name: "Pickup & Delivery", price: 10, category: "Main Services" },
  { id: 2, name: "Shop & Deliver", price: 15, category: "Main Services" },
  { id: 3, name: "Custom Errand", price: 20, category: "Main Services" },
  { id: 4, name: "Rush Service Add-On", price: 5, category: "Add-ons" },
  { id: 5, name: "Additional Stop Add-On", price: 3, category: "Add-ons" },
  { id: 6, name: "Service Area Tier 1", price: 10, category: "Service Areas" },
  { id: 7, name: "Service Area Tier 2", price: 15, category: "Service Areas" },
  { id: 8, name: "Service Area Tier 3", price: 20, category: "Service Areas" },
  { id: 10, name: "After Hours Add-On", price: 15, category: "Add-ons" },
  { id: 11, name: "Holiday Add-On", price: 20, category: "Add-ons" },
  { id: 12, name: "Heavy Item Handling Add-On", price: 5, category: "Add-ons" },
];

const discounts = [
  { code: "NIGHT50", type: "percent", amount: 50 },
  { code: "NEW10", type: "fixed", amount: 10 },
  { code: "BUSYDAY", type: "percent", amount: 10 },
  { code: "CARE5", type: "fixed", amount: 5 },
];

const taxRate = Number(process.env.TAX_RATE || 0.07);
const MAX_SERVICE_QUANTITY = 20;
const MAX_TIP_AMOUNT = 1000;
const MAX_SHOPPING_HOLD = 10000;

const membershipPlans = [
  { id: "community-heroes", name: "Community Heroes Membership", monthlyPrice: 9.99 },
  { id: "hopes-go-plus", name: "Hope's & Go Plus", monthlyPrice: 14.99 },
  { id: "senior-go-plus", name: "Senior Go Plus", monthlyPrice: 29.99 },
];

const starterProductCatalog = [
  { id: "starter-gv-whole-milk-1gal", name: "Whole Milk", brand: "Great Value", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "whole milk", "gallon milk"] },
  { id: "starter-gv-2pct-milk-1gal", name: "2% Reduced Fat Milk", brand: "Great Value", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "2 percent milk", "reduced fat milk"] },
  { id: "starter-gv-eggs-12", name: "Large White Eggs", brand: "Great Value", size: "12 ct", price: 4.5, category: "Dairy", keywords: ["eggs", "dozen eggs", "large eggs"] },
  { id: "starter-gv-butter-4", name: "Salted Butter Sticks", brand: "Great Value", size: "4 ct / 16 oz", price: 5, category: "Dairy", keywords: ["butter", "salted butter"] },
  { id: "starter-gv-cheddar-8oz", name: "Shredded Sharp Cheddar Cheese", brand: "Great Value", size: "8 oz", price: 4.75, category: "Dairy", keywords: ["cheese", "cheddar", "shredded cheese"] },
  { id: "starter-gv-bread-white-20oz", name: "White Sandwich Bread", brand: "Great Value", size: "20 oz", price: 3.25, category: "Bakery", keywords: ["bread", "white bread", "sandwich bread"] },
  { id: "starter-gv-bread-wheat-20oz", name: "100% Whole Wheat Bread", brand: "Great Value", size: "20 oz", price: 3.5, category: "Bakery", keywords: ["bread", "wheat bread", "whole wheat"] },
  { id: "starter-bananas-bunch", name: "Fresh Bananas", brand: "Fresh Produce", size: "1 bunch", price: 2, category: "Produce", keywords: ["bananas", "banana", "fruit"] },
  { id: "starter-apples-gala-3lb", name: "Gala Apples", brand: "Fresh Produce", size: "3 lb bag", price: 5, category: "Produce", keywords: ["apples", "gala apples", "fruit"] },
  { id: "starter-strawberries-1lb", name: "Fresh Strawberries", brand: "Fresh Produce", size: "1 lb", price: 4.5, category: "Produce", keywords: ["strawberries", "berries", "fruit"] },
  { id: "starter-gv-chicken-breast", name: "Boneless Skinless Chicken Breasts", brand: "Freshness Guaranteed", size: "approx. 3 lb", price: 9, category: "Meat", keywords: ["chicken", "chicken breast", "boneless chicken"] },
  { id: "starter-gv-ground-beef", name: "Ground Beef 80/20", brand: "All Natural", size: "2.25 lb", price: 11, category: "Meat", keywords: ["beef", "ground beef", "hamburger"] },
  { id: "starter-gv-cereal-oats", name: "Toasted Oats Cereal", brand: "Great Value", size: "18 oz", price: 5, category: "Pantry", keywords: ["cereal", "oat cereal", "breakfast"] },
  { id: "starter-gv-rice-5lb", name: "Long Grain Enriched Rice", brand: "Great Value", size: "5 lb", price: 4.5, category: "Pantry", keywords: ["rice", "white rice", "long grain rice"] },
  { id: "starter-gv-spaghetti-16oz", name: "Spaghetti Pasta", brand: "Great Value", size: "16 oz", price: 2.25, category: "Pantry", keywords: ["pasta", "spaghetti", "noodles"] },
  { id: "starter-gv-pasta-sauce-24oz", name: "Traditional Pasta Sauce", brand: "Great Value", size: "24 oz", price: 3.5, category: "Pantry", keywords: ["pasta sauce", "spaghetti sauce", "tomato sauce"] },
  { id: "starter-gv-peanut-butter-18oz", name: "Creamy Peanut Butter", brand: "Great Value", size: "18 oz", price: 4, category: "Pantry", keywords: ["peanut butter", "creamy peanut butter"] },
  { id: "starter-gv-water-24", name: "Purified Drinking Water", brand: "Great Value", size: "24 bottles", price: 5.5, category: "Beverages", keywords: ["water", "bottled water", "water case"] },
  { id: "starter-gv-orange-juice-52oz", name: "100% Orange Juice", brand: "Great Value", size: "52 fl oz", price: 4.5, category: "Beverages", keywords: ["juice", "orange juice"] },
  { id: "starter-gv-paper-towels-6", name: "Everyday Strong Paper Towels", brand: "Great Value", size: "6 double rolls", price: 8, category: "Household", keywords: ["paper towels", "paper towel", "kitchen paper", "ultra paper towels", "strong absorbent paper towels", "strong & absorbent paper towels", "strong and absorbent paper towels"] },
  { id: "starter-gv-toilet-paper-12", name: "Ultra Strong Toilet Paper", brand: "Great Value", size: "12 mega rolls", price: 9, category: "Household", keywords: ["toilet paper", "bath tissue"] },
  { id: "starter-tide-detergent-84oz", name: "Original Liquid Laundry Detergent", brand: "Tide", size: "84 fl oz", price: 13, category: "Household", keywords: ["detergent", "laundry soap", "tide"] },
  { id: "starter-dawn-dish-soap-38oz", name: "Ultra Dishwashing Liquid", brand: "Dawn", size: "38 fl oz", price: 7, category: "Household", keywords: ["dish soap", "dishwashing liquid", "dawn"] },
  { id: "starter-gv-trash-bags-40", name: "Tall Kitchen Trash Bags", brand: "Great Value", size: "40 ct / 13 gal", price: 9, category: "Household", keywords: ["trash bags", "garbage bags", "kitchen bags"] },
  { id: "starter-colgate-toothpaste", name: "Cavity Protection Toothpaste", brand: "Colgate", size: "6 oz", price: 4.5, category: "Personal Care", keywords: ["toothpaste", "colgate"] },
  { id: "starter-dove-shampoo", name: "Daily Moisture Shampoo", brand: "Dove", size: "28 fl oz", price: 7, category: "Personal Care", keywords: ["shampoo", "dove shampoo"] },
  { id: "starter-huggies-wipes", name: "Sensitive Baby Wipes", brand: "Huggies", size: "56 ct", price: 4, category: "Baby", keywords: ["baby wipes", "wipes", "huggies"] },
];

starterProductCatalog.push(
  { id: "starter-hyvee-milk-1gal", name: "2% Reduced Fat Milk", brand: "Hy-Vee", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "2 percent milk"], retailers: ["hyvee"] },
  { id: "starter-hyvee-eggs-12", name: "Large Grade A Eggs", brand: "Hy-Vee", size: "12 ct", price: 4.5, category: "Dairy", keywords: ["eggs", "dozen eggs"], retailers: ["hyvee"] },
  { id: "starter-hyvee-bread-20oz", name: "White Sandwich Bread", brand: "Hy-Vee", size: "20 oz", price: 3.25, category: "Bakery", keywords: ["bread", "white bread"], retailers: ["hyvee"] },
  { id: "starter-hyvee-paper-towels", name: "Ultra Strong Paper Towels", brand: "Hy-Vee", size: "6 rolls", price: 8, category: "Household", keywords: ["paper towels", "paper towel"], retailers: ["hyvee"] },
  { id: "starter-aldi-milk-1gal", name: "2% Reduced Fat Milk", brand: "Friendly Farms", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "2 percent milk"], retailers: ["aldi"] },
  { id: "starter-aldi-eggs-12", name: "Grade A Large Eggs", brand: "Goldhen", size: "12 ct", price: 4.5, category: "Dairy", keywords: ["eggs", "dozen eggs"], retailers: ["aldi"] },
  { id: "starter-aldi-cheddar-8oz", name: "Shredded Sharp Cheddar Cheese", brand: "Happy Farms", size: "8 oz", price: 4.75, category: "Dairy", keywords: ["cheese", "cheddar", "shredded cheese"], retailers: ["aldi"] },
  { id: "starter-aldi-bread-20oz", name: "Classic White Bread", brand: "L'oven Fresh", size: "20 oz", price: 3.25, category: "Bakery", keywords: ["bread", "white bread"], retailers: ["aldi"] },
  { id: "starter-dg-milk-1gal", name: "2% Reduced Fat Milk", brand: "Clover Valley", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "2 percent milk"], retailers: ["dollar-general"] },
  { id: "starter-dg-eggs-12", name: "Large White Eggs", brand: "Clover Valley", size: "12 ct", price: 4.5, category: "Dairy", keywords: ["eggs", "dozen eggs"], retailers: ["dollar-general"] },
  { id: "starter-dg-bread-20oz", name: "White Sandwich Bread", brand: "Clover Valley", size: "20 oz", price: 3.25, category: "Bakery", keywords: ["bread", "white bread"], retailers: ["dollar-general"] },
  { id: "starter-dg-paper-towels", name: "Strong & Absorbent Paper Towels", brand: "DG Home", size: "6 rolls", price: 8, category: "Household", keywords: ["paper towels", "paper towel"], retailers: ["dollar-general"] },
  { id: "starter-other-milk-1gal", name: "2% Reduced Fat Milk", brand: "Store brand", size: "1 gal", price: 4.25, category: "Dairy", keywords: ["milk", "2 percent milk"], retailers: ["other"] },
  { id: "starter-other-eggs-12", name: "Large Grade A Eggs", brand: "Store brand", size: "12 ct", price: 4.5, category: "Dairy", keywords: ["eggs", "dozen eggs"], retailers: ["other"] },
  { id: "starter-other-bread-20oz", name: "White Sandwich Bread", brand: "Store brand", size: "20 oz", price: 3.25, category: "Bakery", keywords: ["bread", "white bread"], retailers: ["other"] },
  { id: "starter-other-paper-towels", name: "Strong Paper Towels", brand: "Store brand", size: "6 rolls", price: 8, category: "Household", keywords: ["paper towels", "paper towel"], retailers: ["other"] }
);

const retailerLabels = {
  walmart: "Walmart",
  hyvee: "Hy-Vee",
  aldi: "ALDI",
  "dollar-general": "Dollar General",
  other: "selected store",
};

const monthlyCatalogPath = path.join(__dirname, "catalog-products.json");
const catalogLearningPath = path.join(__dirname, ".data", "catalog-learning.json");

function loadMonthlyProductCatalog() {
  try {
    const catalog = JSON.parse(fs.readFileSync(monthlyCatalogPath, "utf8"));
    return {
      lastUpdated: String(catalog.lastUpdated || ""),
      updateCadence: String(catalog.updateCadence || "monthly"),
      products: Array.isArray(catalog.products) ? catalog.products : [],
    };
  } catch (error) {
    console.error("Monthly product catalog could not be loaded:", error.message);
    return { lastUpdated: "", updateCadence: "monthly", products: [] };
  }
}

const monthlyProductCatalog = loadMonthlyProductCatalog();

function loadCatalogLearningState() {
  try {
    const saved = JSON.parse(fs.readFileSync(catalogLearningPath, "utf8"));
    return {
      lastReviewedAt: String(saved.lastReviewedAt || ""),
      entries: Array.isArray(saved.entries) ? saved.entries : [],
    };
  } catch {
    return { lastReviewedAt: "", entries: [] };
  }
}

let catalogLearningState = loadCatalogLearningState();

function saveCatalogLearningState() {
  fs.mkdirSync(path.dirname(catalogLearningPath), { recursive: true });
  fs.writeFileSync(catalogLearningPath, JSON.stringify(catalogLearningState, null, 2));
}

function saveMonthlyProductCatalog() {
  monthlyProductCatalog.lastUpdated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(monthlyCatalogPath, JSON.stringify(monthlyProductCatalog, null, 2));
}

function normalizeLearnedItem(value) {
  return String(value || "")
    .trim()
    .replace(/^(?:qty\s*)?\d{1,2}\s*[x×]\s*/i, "")
    .replace(/^\d{1,2}\s+(?!pack\b|ct\b|count\b|lb\b|lbs\b|oz\b)/i, "")
    .replace(/\s*[x×]\s*\d{1,2}\s*$/i, "")
    .replace(/\$\d+(?:\.\d{1,2})?\s*(?:total|each|ea\.?|per item)?/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function learnedItemKey(value) {
  return normalizeLearnedItem(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function catalogStoreKey(storeName) {
  const key = normalizeRetailerKey(storeName);
  return key === "hyvee" ? "hy-vee" : key === "other" ? "all" : key;
}

function addLearnedProductToCatalog(entry, candidate = null) {
  const name = String(candidate?.name || entry.item || "").trim();
  const brand = String(candidate?.brand || "Customer requested").trim();
  const size = String(candidate?.size || "").trim();
  if (!name) return null;
  const duplicate = monthlyProductCatalog.products.find(
    (product) => [product.brand, product.name, product.size].join("|").toLowerCase() === [brand, name, size].join("|").toLowerCase()
  );
  if (duplicate) return duplicate;
  const idBase = [brand, name, size].join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  const product = {
    id: `learned-${idBase || crypto.randomUUID().slice(0, 8)}`,
    name,
    brand,
    size,
    price: Number(candidate?.price) > 0 ? Number(candidate.price) : null,
    category: String(candidate?.category || "Customer Requested Products"),
    keywords: [...new Set([entry.item, ...(candidate?.keywords || [])].map((value) => String(value || "").trim()).filter(Boolean))],
    stores: [...new Set((entry.storeNames || [entry.storeName]).map(catalogStoreKey))],
    learnedFromCompletedOrders: true,
    addedAt: new Date().toISOString(),
  };
  monthlyProductCatalog.products.push(product);
  saveMonthlyProductCatalog();
  return product;
}

function normalizeRetailerKey(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
  if (normalized.includes("walmart") || normalized.includes("wal mart")) return "walmart";
  if (normalized.includes("hy vee") || normalized.includes("hyvee")) return "hyvee";
  if (normalized.includes("aldi")) return "aldi";
  if (normalized.includes("dollar general") || normalized === "dg") return "dollar-general";
  return "other";
}

function searchMonthlyProducts(query, limit, retailerKey, storeName) {
  const catalogRetailerKey = retailerKey === "hyvee" ? "hy-vee" : retailerKey;
  return monthlyProductCatalog.products
    .filter((product) => retailerKey === "other" || (product.stores || []).includes("all") || (product.stores || []).includes(catalogRetailerKey))
    .map((product) => ({ product, score: scoreStarterProduct(product, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map(({ product }) => ({
      ...product,
      source: "Hope's & Go monthly product catalog",
      priceType: "estimate",
      lastVerified: monthlyProductCatalog.lastUpdated,
      availability: `${storeName} listing is reviewed monthly; current stock must be confirmed`,
    }));
}

function expandProductOptions(items, query, limit, storeName) {
  const targetCount = Math.min(5, limit);
  if (!items.length || items.length >= targetCount) return items.slice(0, limit);
  const base = items.find((item) => Number(item.price) > 0);
  if (!base) return items.slice(0, limit);
  const profiles = [
    { id: "budget", label: "Budget Option", brand: "Value alternative", size: "Comparable value size", factor: 0.75 },
    { id: "small", label: "Smaller Size", brand: base.brand, size: "Smaller package", factor: 0.65 },
    { id: "family", label: "Family Size", brand: base.brand, size: "Family-size package", factor: 1.45 },
    { id: "premium", label: "Premium Option", brand: "Premium alternative", size: "Premium selection", factor: 1.35 },
  ];
  const expanded = [...items];
  for (const profile of profiles) {
    if (expanded.length >= targetCount) break;
    expanded.push({
      ...base,
      id: `comparison-${base.id}-${profile.id}-${crypto.createHash("sha1").update(query).digest("hex").slice(0, 6)}`,
      name: `${base.name} - ${profile.label}`,
      brand: profile.brand,
      size: profile.size,
      price: Math.round(Number(base.price) * profile.factor * 100) / 100,
      source: "Hope's & Go comparison estimate",
      priceType: "estimate",
      generatedVariant: true,
      availability: `${storeName} size, brand, price, and stock are confirmed during shopping`,
    });
  }
  return expanded.slice(0, limit);
}

const publicFoodSearchCache = new Map();

function mapPublicFoodProduct(product, storeName) {
  const name = String(product.product_name_en || product.product_name || "").trim();
  const brand = String(product.brands || "").split(",")[0].trim();
  if (!name || !brand) return null;
  return {
    id: `off-${String(product.code || crypto.createHash("sha1").update(`${brand}|${name}`).digest("hex").slice(0, 16))}`,
    name,
    brand,
    size: String(product.quantity || "").trim(),
    price: null,
    category: String(product.categories || "Food product").split(",")[0].trim() || "Food product",
    keywords: [],
    image: String(product.image_front_small_url || ""),
    source: "Open Food Facts public product catalog",
    priceType: "unavailable",
    availability: `${storeName} price and local stock must be confirmed`,
    isUnitedStates: Array.isArray(product.countries_tags) && product.countries_tags.includes("en:united-states"),
  };
}

async function searchPublicFoodProducts(query, limit, storeName) {
  const cacheKey = query.toLowerCase().trim();
  const cached = publicFoodSearchCache.get(cacheKey);
  const cacheTtl = cached?.failed ? 10 * 60 * 1000 : 12 * 60 * 60 * 1000;
  if (cached && Date.now() - cached.savedAt < cacheTtl) return cached.items.slice(0, limit);

  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "24");
  url.searchParams.set("fields", "code,product_name,product_name_en,brands,quantity,categories,countries_tags,image_front_small_url");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "HopeAndGoCatalog/1.0" },
    });
    if (!response.ok) throw new Error(`Public food search failed (${response.status}).`);
    const data = await response.json();
    const items = (Array.isArray(data.products) ? data.products : [])
      .map((product) => mapPublicFoodProduct(product, storeName))
      .filter(Boolean)
      .map((product) => ({ product, score: scoreStarterProduct(product, query) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => Number(b.product.isUnitedStates) - Number(a.product.isUnitedStates) || b.score - a.score)
      .map(({ product }) => {
        const { isUnitedStates, ...result } = product;
        return result;
      });
    publicFoodSearchCache.set(cacheKey, { savedAt: Date.now(), items });
    return items.slice(0, limit);
  } catch (error) {
    publicFoodSearchCache.set(cacheKey, { savedAt: Date.now(), items: [], failed: true });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

let walmartAccessToken = { value: "", expiresAt: 0 };
const walmartSearchCache = new Map();

function normalizeProductSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function scoreStarterProduct(product, query) {
  const normalizedQuery = normalizeProductSearchText(query);
  const words = normalizedQuery.split(/\s+/).filter(Boolean);
  const searchable = normalizeProductSearchText(
    [product.name, product.brand, product.size, product.category, ...(product.keywords || [])].join(" ")
  );
  if (!words.every((word) => searchable.includes(word))) return -1;
  const name = normalizeProductSearchText(product.name);
  if (name.startsWith(normalizedQuery)) return 100;
  if ((product.keywords || []).some((keyword) => normalizeProductSearchText(keyword).startsWith(normalizedQuery))) return 80;
  if (name.includes(normalizedQuery)) return 60;
  return 30;
}

function getStarterProductRetailers(product) {
  if (Array.isArray(product.retailers)) return product.retailers;
  if (["Great Value", "Freshness Guaranteed"].includes(product.brand)) return ["walmart"];
  return ["walmart", "hyvee", "aldi", "dollar-general", "other"];
}

function searchStarterProducts(query, limit = 8, retailer = "other") {
  return starterProductCatalog
    .filter((product) => getStarterProductRetailers(product).includes(retailer))
    .map((product) => ({ product, score: scoreStarterProduct(product, query) }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit)
    .map(({ product }) => ({
      ...product,
      source: `Hope's & Go ${retailerLabels[retailer] || "store"} starter catalog`,
      priceType: "estimate",
      availability: `Exact product selection; ${retailerLabels[retailer] || "store"} stock must be verified`,
    }));
}

function catalogAlreadyContains(item) {
  return searchMonthlyProducts(item, 1, "other", "Store").length > 0;
}

function captureCatalogLearningItems({ requestId, storeName, items }) {
  const now = new Date().toISOString();
  const captured = [];
  for (const rawItem of Array.isArray(items) ? items : []) {
    const item = normalizeLearnedItem(rawItem);
    const key = learnedItemKey(item);
    if (key.length < 2 || catalogAlreadyContains(item)) continue;
    let entry = catalogLearningState.entries.find((candidate) => candidate.key === key && candidate.status === "pending");
    if (entry) {
      const alreadyCaptured = Boolean(requestId && (entry.requestIds || []).includes(requestId));
      if (!alreadyCaptured) entry.occurrences = Number(entry.occurrences || 1) + 1;
      entry.lastSeenAt = now;
      entry.requestIds = [...new Set([...(entry.requestIds || []), requestId].filter(Boolean))];
      entry.storeNames = [...new Set([...(entry.storeNames || []), storeName].filter(Boolean))];
      entry.rawExamples = [...new Set([...(entry.rawExamples || []), String(rawItem || "").trim()].filter(Boolean))].slice(-5);
    } else {
      entry = {
        id: `learn-${crypto.randomUUID()}`,
        key,
        item,
        rawExamples: [String(rawItem || "").trim()].filter(Boolean),
        requestIds: [requestId].filter(Boolean),
        storeNames: [storeName].filter(Boolean),
        occurrences: 1,
        status: "pending",
        firstSeenAt: now,
        lastSeenAt: now,
      };
      catalogLearningState.entries.unshift(entry);
    }
    captured.push(entry);
  }
  saveCatalogLearningState();
  return captured;
}

async function getWalmartAccessToken() {
  if (walmartAccessToken.value && Date.now() < walmartAccessToken.expiresAt - 60_000) {
    return walmartAccessToken.value;
  }
  const clientId = process.env.WALMART_CLIENT_ID || "";
  const clientSecret = process.env.WALMART_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("Walmart Marketplace credentials are not configured.");
  const response = await fetch("https://marketplace.walmartapis.com/v3/token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "WM_MARKET": "us",
      "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
      "WM_SVC.NAME": "Walmart Marketplace",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!response.ok) throw new Error(`Walmart token request failed (${response.status}).`);
  const data = await response.json();
  if (!data.access_token) throw new Error("Walmart token response did not include an access token.");
  walmartAccessToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in || 900)) * 1000,
  };
  return walmartAccessToken.value;
}

function readWalmartPrice(item) {
  const candidates = [item.price, item.currentPrice, item.offerPrice, item.price?.amount, item.priceInfo?.currentPrice];
  const match = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0);
  return match || null;
}

async function searchWalmartProducts(query, limit = 8) {
  const cacheKey = query.toLowerCase().trim();
  const cached = walmartSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < 5 * 60 * 1000) return cached.items;
  const token = await getWalmartAccessToken();
  const url = new URL("https://marketplace.walmartapis.com/v3/items/walmart/search");
  url.searchParams.set("query", query);
  url.searchParams.set("responseFormat", "DEFAULT");
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "WM_GLOBAL_VERSION": "3.1",
      "WM_MARKET": "US",
      "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
      "WM_SEC.ACCESS_TOKEN": token,
      "WM_SVC.NAME": "Walmart Marketplace",
      ...(process.env.WALMART_CONSUMER_CHANNEL_TYPE
        ? { "WM_CONSUMER.CHANNEL.TYPE": process.env.WALMART_CONSUMER_CHANNEL_TYPE }
        : {}),
    },
  });
  if (!response.ok) throw new Error(`Walmart catalog search failed (${response.status}).`);
  const data = await response.json();
  const items = (Array.isArray(data.items) ? data.items : [])
    .slice(0, limit)
    .map((item) => ({
      id: String(item.itemId || item.wpid || item.gtin || item.upc || crypto.randomUUID()),
      name: String(item.title || item.productName || item.name || "Walmart catalog item"),
      brand: String(item.brand || item.brandName || ""),
      size: String(item.size || item.variantGroupInfo?.primaryVariant || ""),
      price: readWalmartPrice(item),
      category: String(item.productType || item.category || "Walmart catalog"),
      image: String(item.imageUrl || item.primaryImageUrl || item.images?.[0]?.url || ""),
      source: "Walmart Marketplace catalog",
      priceType: readWalmartPrice(item) ? "catalog" : "unavailable",
      availability: "Published in Walmart's online catalog; local stock is not confirmed",
    }));
  walmartSearchCache.set(cacheKey, { savedAt: Date.now(), items });
  return items;
}

function getMembershipLineTotal(item, membershipCode, membershipUsage = {}) {
  const code = String(membershipCode || "").toUpperCase();
  const usage = membershipUsage || {};
  const freePickup =
    code === "SENIORPLUS_AUTO" ? 5 : code === "HEROES_AUTO" || code === "HGPLUS_AUTO" ? 2 : 0;
  const freeShop = code === "SENIORPLUS_AUTO" ? 5 : 0;
  const freeRush = code === "HEROES_AUTO" || code === "HGPLUS_AUTO" ? 1 : 0;
  const remainingPickup = Math.max(freePickup - Number(usage.pickup || 0), 0);
  const remainingShop = Math.max(freeShop - Number(usage.shop || 0), 0);
  const remainingRush = Math.max(freeRush - Number(usage.rush || 0), 0);
  if (code === "HEROES_AUTO") {
    if (item.id === 1) return Math.max(0, item.quantity - remainingPickup) * (item.price * 0.9);
    if (item.id === 2) return item.price * item.quantity * 0.8;
    if (item.id === 3) return item.price * item.quantity * 0.85;
    if (item.id === 4) return Math.max(0, item.quantity - remainingRush) * item.price;
  }

  if (code === "HGPLUS_AUTO") {
    if (item.id === 1) return Math.max(0, item.quantity - remainingPickup) * 8;
    if (item.id === 2) return item.quantity * 13.5;
    if (item.id === 3) return item.quantity * 18;
    if (item.id === 4) return Math.max(0, item.quantity - remainingRush) * item.price;
    if ([10, 11, 12].includes(item.id)) return item.price * item.quantity * 0.9;
  }

  if (code === "SENIORPLUS_AUTO") {
    if (item.id === 1) return Math.max(0, item.quantity - remainingPickup) * 7;
    if (item.id === 2) return Math.max(0, item.quantity - remainingShop) * 10;
    if (item.id === 3) return item.quantity * 15;
    if (item.id === 4) return 0;
    if (item.id === 5) return item.quantity * 3;
    if (item.id === 12) return item.price * item.quantity * 0.9;
  }

  return item.price * item.quantity;
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.json({ limit: "8mb" }));

function toCents(amount) {
  return Math.max(0, Math.round(amount * 100));
}

const restaurantStatePath = path.join(__dirname, ".data", "restaurant-state.json");
const restaurantOrdersPath = path.join(__dirname, ".data", "restaurant-orders.json");
const restaurantSessions = new Map();
const adminRestaurantSessions = new Map();
const driverSessions = new Map();

function hashRestaurantPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

function safeRestaurant(record) {
  const { passwordHash, passwordSalt, ...publicRecord } = record || {};
  return publicRecord;
}

function defaultRestaurantState() {
  const username = String(process.env.PILOT_RESTAURANT_USERNAME || "pilotrestaurant").trim().toLowerCase();
  const { salt, hash } = hashRestaurantPassword(process.env.PILOT_RESTAURANT_PASSWORD || "Pilot123!");
  return {
    restaurants: [{
      id: "pilot-restaurant",
      username,
      passwordSalt: salt,
      passwordHash: hash,
      storeName: "Jerry's Main Lunch",
      description: "Fresh, filling lunch favorites prepared for easy pickup and delivery.",
      address: "Downtown Burlington, IA",
      phone: "(319) 555-0142",
      logo: "",
      coverImage: "",
      stripeAccountId: String(process.env.PILOT_RESTAURANT_STRIPE_ACCOUNT_ID || ""),
      stripeReady: Boolean(process.env.PILOT_RESTAURANT_STRIPE_ACCOUNT_ID),
      active: true,
      foodTaxRate: Number(process.env.PILOT_RESTAURANT_FOOD_TAX_RATE || 0.07),
      hours: {
        Monday: "11:00 AM - 2:00 PM",
        Tuesday: "11:00 AM - 2:00 PM",
        Wednesday: "11:00 AM - 2:00 PM",
        Thursday: "11:00 AM - 2:00 PM",
        Friday: "11:00 AM - 2:00 PM",
        Saturday: "Closed",
        Sunday: "Closed",
      },
      weeklyDeals: [
        { id: "demo-deal-1", title: "Lunch Combo Wednesday", description: "Any sandwich, side, and drink for $12.99.", active: true },
        { id: "demo-deal-2", title: "Friday Soup Special", description: "Add a cup of soup to any lunch for $2.50.", active: true },
      ],
      menu: [
        { id: "demo-turkey-club", name: "Turkey Club Sandwich", description: "Roasted turkey, bacon, lettuce, tomato, and mayo on toasted wheat.", category: "Sandwiches", price: 10.99, active: true, image: "" },
        { id: "demo-chicken-wrap", name: "Grilled Chicken Wrap", description: "Grilled chicken, cheddar, lettuce, tomato, and ranch in a flour wrap.", category: "Sandwiches", price: 9.99, active: true, image: "" },
        { id: "demo-tomato-soup", name: "Homestyle Tomato Soup", description: "Creamy tomato soup topped with herbs and cracked pepper.", category: "Soups & Salads", price: 5.49, active: true, image: "" },
        { id: "demo-house-salad", name: "Main Street House Salad", description: "Crisp greens, cucumber, tomato, shredded cheese, and choice of dressing.", category: "Soups & Salads", price: 7.99, active: true, image: "" },
        { id: "demo-chips", name: "Kettle Chips", description: "A crunchy side of lightly salted kettle chips.", category: "Sides", price: 2.49, active: true, image: "" },
        { id: "demo-cookie", name: "Fresh-Baked Cookie", description: "Soft chocolate chip cookie baked fresh for lunch.", category: "Desserts", price: 2.25, active: true, image: "" },
        { id: "demo-iced-tea", name: "Iced Tea", description: "Fresh-brewed sweet or unsweet tea.", category: "Drinks", price: 2.49, active: true, image: "" },
      ],
      updatedAt: new Date().toISOString(),
    }],
  };
}

function loadRestaurantState() {
  try {
    const saved = JSON.parse(fs.readFileSync(restaurantStatePath, "utf8"));
    if (Array.isArray(saved.restaurants)) {
      const pilot = saved.restaurants.find((restaurant) => restaurant.id === "pilot-restaurant");
      if (pilot && pilot.storeName === "Restaurant" && !(pilot.menu || []).length) {
        const demo = defaultRestaurantState().restaurants[0];
        Object.assign(pilot, demo, {
          username: pilot.username || demo.username,
          passwordSalt: pilot.passwordSalt || demo.passwordSalt,
          passwordHash: pilot.passwordHash || demo.passwordHash,
          stripeAccountId: pilot.stripeAccountId || demo.stripeAccountId,
          stripeReady: Boolean(pilot.stripeReady || demo.stripeReady),
        });
        saveRestaurantStateFile(saved);
      }
      return saved;
    }
  } catch {}
  const initial = defaultRestaurantState();
  fs.mkdirSync(path.dirname(restaurantStatePath), { recursive: true });
  saveRestaurantStateFile(initial);
  return initial;
}

function saveRestaurantStateFile(state) {
  fs.mkdirSync(path.dirname(restaurantStatePath), { recursive: true });
  fs.writeFileSync(restaurantStatePath, JSON.stringify(state, null, 2));
}

let restaurantState = loadRestaurantState();
function loadRestaurantOrders() {
  try {
    const saved = JSON.parse(fs.readFileSync(restaurantOrdersPath, "utf8"));
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}
let restaurantOrders = loadRestaurantOrders();
function saveRestaurantOrders() {
  fs.mkdirSync(path.dirname(restaurantOrdersPath), { recursive: true });
  fs.writeFileSync(restaurantOrdersPath, JSON.stringify(restaurantOrders, null, 2));
}

function saveRestaurantState() {
  saveRestaurantStateFile(restaurantState);
}

function issueRestaurantSession(restaurantId) {
  const token = crypto.randomBytes(32).toString("hex");
  restaurantSessions.set(token, { restaurantId, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  return token;
}

function requireRestaurant(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = restaurantSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) restaurantSessions.delete(token);
    return res.status(401).json({ error: "Restaurant login expired. Please log in again." });
  }
  const restaurant = restaurantState.restaurants.find((item) => item.id === session.restaurantId);
  if (!restaurant) return res.status(401).json({ error: "Restaurant account was not found." });
  req.restaurant = restaurant;
  req.restaurantToken = token;
  return next();
}

function requireRestaurantAdmin(req, res, next) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const session = adminRestaurantSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) adminRestaurantSessions.delete(token);
    return res.status(401).json({ error: "Admin access expired. Please log in again." });
  }
  req.restaurantAdminToken = token;
  return next();
}

function cleanImage(value) {
  const image = String(value || "");
  if (!image) return "";
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(image) && image.length <= 2_500_000) return image;
  if (/^https:\/\//i.test(image) && image.length <= 1000) return image;
  return "";
}

function publicRestaurant(record, includeMenu = true) {
  const publicRecord = safeRestaurant(record);
  delete publicRecord.username;
  delete publicRecord.stripeAccountId;
  return {
    ...publicRecord,
    stripeReady: Boolean(record.stripeReady && record.stripeAccountId),
    menu: includeMenu ? (record.menu || []).filter((item) => item.active !== false) : undefined,
    weeklyDeals: (record.weeklyDeals || []).filter((deal) => deal.active !== false),
  };
}

function publicRestaurantOrder(order) {
  const safe = { ...order };
  delete safe.customerEmail;
  return safe;
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

function calculateExtendedServiceAreaFee(miles) {
  const distance = Number(miles || 0);
  if (!distance || distance <= 35) return 0;
  return 20 + Math.ceil(distance - 35);
}

function normalizePhoneNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return String(phone || "").trim();
}

async function sendTextMessage(to, message) {
  if (!twilioClient || (!twilioMessagingServiceSid && !process.env.TWILIO_FROM_NUMBER) || !to) {
    console.log(`SMS not sent. Configure Twilio to text ${to || "recipient"}: ${message}`);
    return false;
  }

  const payload = {
    to: normalizePhoneNumber(to),
    body: message,
  };
  if (twilioMessagingServiceSid) payload.messagingServiceSid = twilioMessagingServiceSid;
  else payload.from = process.env.TWILIO_FROM_NUMBER;
  await twilioClient.messages.create(payload);
  return true;
}

async function sendOwnerText(message) {
  return sendTextMessage(ownerPhoneNumber, message);
}

function getOperationsSnapshot(date = new Date()) {
  const context = getOperatingContext(date);
  const drivers = getEffectiveDriverStatuses(date);
  const availableDrivers = drivers.filter((driver) => driver.clockedIn && driver.available);
  return {
    timeZone: operationsTimeZone,
    operatingHours: "8:00 AM-12:00 AM",
    currentDay: context.weekday,
    currentBlock: context.currentBlock?.label || "Closed",
    isOperatingHours: context.isOperatingHours,
    ownerAutomaticStatus: getOwnerAutomaticStatus(date),
    ownerSchedule: getOwnerScheduleSnapshot(),
    driverSchedules: operationsState.driverSchedules || {},
    ownerOverride: operationsState.ownerOverride || "Auto",
    ownerEffectiveStatus: getOwnerEffectiveStatus(date),
    drivers,
    availableDriverCount: availableDrivers.length,
    bookingAvailable: availableDrivers.length > 0,
    alerts: (operationsState.alerts || []).slice(0, 50),
    smsConfigured: Boolean(twilioClient && (twilioMessagingServiceSid || process.env.TWILIO_FROM_NUMBER)),
    checkedAt: date.toISOString(),
  };
}

async function notifyOwnerNewOrder({ serviceName, customerName, requestId = "" }) {
  const message = [
    "Hope's & Go",
    "",
    "New Order Received.",
    "",
    `Service: ${serviceName || "Not provided"}`,
    `Customer: ${customerName || "Customer"}`,
    "",
    "Please review in Dispatch.",
  ].join("\n");
  const alert = createOperationsAlert("new-order", "New Order Received", message, {
    serviceName,
    customerName,
    requestId,
  });
  let smsSent = false;
  try {
    smsSent = await sendOwnerText(message);
  } catch (error) {
    console.error("Owner SMS failed:", error.message);
  }
  return { alert, smsSent };
}

async function notifyOwnerManualReview({ requestId, customerName, total, reasons = [] }) {
  const reasonText = Array.isArray(reasons) && reasons.length ? reasons.join("; ") : "A safety check requires review";
  const message = [
    "Hope's & Go Alert",
    "",
    `Manual review needed for ${requestId || "a new order"}.`,
    `Customer: ${customerName || "Customer"}`,
    `Total: $${Number(total || 0).toFixed(2)}`,
    `Reason: ${reasonText}`,
  ].join("\n");
  const alert = createOperationsAlert("manual-review", "Order Needs Manual Review", message, { requestId, customerName, total, reasons });
  let smsSent = false;
  try { smsSent = await sendOwnerText(message); } catch (error) { console.error("Manual-review SMS failed:", error.message); }
  return { alert, smsSent };
}

async function checkClockInMonitoring(date = new Date()) {
  const context = getOperatingContext(date);
  if (!context.isOperatingHours || !context.currentBlock) return;
  if (context.minuteOfDay < context.currentBlock.start + 20) return;
  const alertKey = `${context.dateKey}:${context.currentBlock.id}`;
  if ((operationsState.clockInAlertKeys || []).includes(alertKey)) return;
  const snapshot = getOperationsSnapshot(date);
  if (snapshot.drivers.some((driver) => driver.clockedIn)) return;

  operationsState.clockInAlertKeys = [alertKey, ...(operationsState.clockInAlertKeys || [])].slice(0, 120);
  const message = [
    "Hope's & Go Alert",
    "",
    "No drivers have clocked in for the current operating block.",
    "",
    "Please review driver availability.",
  ].join("\n");
  createOperationsAlert("clock-in", "No Drivers Clocked In", message, {
    block: context.currentBlock.label,
    date: context.dateKey,
  });
  try {
    await sendOwnerText(message);
  } catch (error) {
    console.error("Clock-in alert SMS failed:", error.message);
  }
}

app.get("/operations-status", async (_req, res) => {
  await checkClockInMonitoring();
  res.json(getOperationsSnapshot());
});

app.post("/operations-status/owner", (req, res) => {
  const status = String(req.body.status || "");
  const allowed = ["Auto", "Online", "Busy", "Offline", "Vacation Mode"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid owner status." });
  operationsState.ownerOverride = status;
  operationsState.ownerOverrideUpdatedAt = new Date().toISOString();
  saveOperationsState();
  res.json(getOperationsSnapshot());
});

app.post("/operations-status/driver", (req, res) => {
  const name = String(req.body.name || "").trim();
  const status = String(req.body.status || "");
  if (!name) return res.status(400).json({ error: "Driver name is required." });
  if (!["Online", "Busy", "Offline"].includes(status)) {
    return res.status(400).json({ error: "Invalid driver status." });
  }
  const schedule = normalizeWeeklySchedule(operationsState.driverSchedules?.[name]?.days || {});
  if (["Online", "Busy"].includes(status) && Object.keys(schedule).length) {
    const context = getOperatingContext();
    if (!isWithinWeeklySchedule(schedule, context)) {
      return res.status(409).json({ error: "You can only clock in during your approved coverage times." });
    }
  }
  operationsState.drivers[name] = { status, updatedAt: new Date().toISOString() };
  saveOperationsState();
  res.json(getOperationsSnapshot());
});

app.post("/operations-schedule", (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: "Driver name is required." });
  const days = normalizeWeeklySchedule(req.body.days || {});
  if (!Object.keys(days).length) {
    return res.status(400).json({ error: "Add at least one valid time between 8:00 AM and midnight." });
  }

  operationsState.driverSchedules[name] = { days, updatedAt: new Date().toISOString() };
  saveOperationsState();
  res.json(getOperationsSnapshot());
});

app.post("/notify-owner-new-order", async (req, res) => {
  const result = await notifyOwnerNewOrder({
    serviceName: String(req.body.serviceName || ""),
    customerName: String(req.body.customerName || "Customer"),
    requestId: String(req.body.requestId || ""),
  });
  res.json({ ok: true, alertId: result.alert.id, smsSent: result.smsSent });
});

app.post("/notify-owner-manual-review", async (req, res) => {
  const result = await notifyOwnerManualReview({
    requestId: String(req.body.requestId || ""),
    customerName: String(req.body.customerName || "Customer"),
    total: Number(req.body.total || 0),
    reasons: Array.isArray(req.body.reasons) ? req.body.reasons.map((reason) => String(reason).slice(0, 160)).slice(0, 10) : [],
  });
  res.json({ ok: true, alertId: result.alert.id, smsSent: result.smsSent });
});

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

app.get("/product-suggestions", async (req, res) => {
  const query = String(req.query.q || "").trim().slice(0, 80);
  const limit = Math.max(1, Math.min(10, Number(req.query.limit || 8)));
  const storeName = String(req.query.store || req.query.retailer || "Other store").trim().slice(0, 80) || "Other store";
  const retailer = normalizeRetailerKey(storeName);
  if (query.length < 2) {
    return res.json({ source: "monthly", retailer, storeName, live: false, items: [], note: "Type at least 2 letters." });
  }

  const liveWalmartEnabled = retailer === "walmart" && process.env.WALMART_CATALOG_ENABLED === "true";
  if (liveWalmartEnabled) {
    try {
      const items = await searchWalmartProducts(query, limit);
      return res.json({
        source: "walmart",
        retailer,
        live: true,
        items,
        note: "Walmart online catalog matches. Local Burlington-area stock must still be verified.",
      });
    } catch (error) {
      console.error("Walmart product search failed; using starter catalog:", error.message);
    }
  }

  const monthlyItems = searchMonthlyProducts(query, limit, retailer, storeName);
  const starterItems = searchStarterProducts(query, limit, retailer);
  let publicFoodItems = [];
  if (monthlyItems.length + starterItems.length === 0 && query.length >= 3) {
    try {
      publicFoodItems = await searchPublicFoodProducts(query, limit, storeName);
    } catch (error) {
      console.error("Public food product search failed; using the monthly catalog:", error.message);
    }
  }
  const seen = new Set();
  const matchedItems = [...monthlyItems, ...starterItems, ...publicFoodItems]
    .filter((product) => {
      const key = [product.brand, product.name, product.size].join("|").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
  const items = expandProductOptions(matchedItems, query, limit, storeName);
  const includesComparisonEstimates = items.some((item) => item.generatedVariant);

  return res.json({
    source: publicFoodItems.length ? "monthly-and-public-food" : "monthly",
    retailer,
    storeName,
    live: false,
    catalogUpdatedAt: monthlyProductCatalog.lastUpdated,
    items,
    note: includesComparisonEstimates
      ? `Showing catalog matches plus clearly labeled budget, size, and premium comparison estimates for ${storeName}. Exact products, prices, and stock are confirmed during shopping.`
      : publicFoodItems.length
      ? `Food-product matches found for ${storeName}. Current price and local stock are confirmed during shopping.`
      : `Hope's & Go monthly catalog for ${storeName}. Last updated ${monthlyProductCatalog.lastUpdated || "not yet"}; current price and stock are confirmed during shopping.`,
  });
});

app.get("/catalog-learning", (_req, res) => {
  const entries = [...catalogLearningState.entries].sort(
    (a, b) => (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) || Number(b.occurrences || 0) - Number(a.occurrences || 0)
  );
  res.json({
    lastReviewedAt: catalogLearningState.lastReviewedAt,
    catalogUpdatedAt: monthlyProductCatalog.lastUpdated,
    catalogProductCount: monthlyProductCatalog.products.length,
    pendingCount: entries.filter((entry) => entry.status === "pending").length,
    entries: entries.slice(0, 250),
  });
});

app.post("/catalog-learning/capture", (req, res) => {
  const requestId = String(req.body.requestId || "").trim().slice(0, 80);
  const storeName = String(req.body.storeName || "Other store").trim().slice(0, 80) || "Other store";
  const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
  const captured = captureCatalogLearningItems({ requestId, storeName, items });
  res.json({ ok: true, captured: captured.length, pendingCount: catalogLearningState.entries.filter((entry) => entry.status === "pending").length });
});

app.post("/catalog-learning/monthly-review", (_req, res) => {
  catalogLearningState.lastReviewedAt = new Date().toISOString();
  saveCatalogLearningState();
  res.json({
    ok: true,
    lastReviewedAt: catalogLearningState.lastReviewedAt,
    pendingCount: catalogLearningState.entries.filter((entry) => entry.status === "pending").length,
  });
});

app.post("/catalog-learning/:id/action", (req, res) => {
  const entry = catalogLearningState.entries.find((candidate) => candidate.id === req.params.id);
  const action = String(req.body.action || "");
  if (!entry) return res.status(404).json({ error: "Catalog-learning item was not found." });
  if (entry.status !== "pending") return res.status(409).json({ error: "This item has already been reviewed." });
  if (action === "add") {
    const product = addLearnedProductToCatalog(entry);
    entry.status = "added-manually";
    entry.addedProductId = product?.id || "";
    entry.resolvedAt = new Date().toISOString();
  } else if (action === "dismiss") {
    entry.status = "dismissed";
    entry.resolvedAt = new Date().toISOString();
  } else {
    return res.status(400).json({ error: "Choose add or dismiss." });
  }
  saveCatalogLearningState();
  return res.json({ ok: true, entry, catalogUpdatedAt: monthlyProductCatalog.lastUpdated, catalogProductCount: monthlyProductCatalog.products.length });
});

app.get("/client-config.js", (_req, res) => {
  res.type("application/javascript");
  res.send(`
window.HOPES_GO_MAPBOX_TOKEN=${JSON.stringify(process.env.MAPBOX_PUBLIC_TOKEN || "")};
window.HOPES_GO_STRIPE_PUBLISHABLE_KEY=${JSON.stringify(
    process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || ""
  )};
window.HOPES_GO_CUSTOMER_TEST_MODE=false;
window.HOPES_GO_NON_PARTNER_PAYMENTS=${JSON.stringify({
    cashApp: process.env.NON_PARTNER_CASHAPP_URL || "https://cash.app/$hopesgo",
    paypal: process.env.NON_PARTNER_PAYPAL_URL || "https://paypal.biz/HopesandGo",
    venmo: process.env.NON_PARTNER_VENMO_URL || "https://venmo.com/u/hopes_go",
  })};
`);
});

app.get("/api/restaurants", (_req, res) => {
  res.json({ restaurants: restaurantState.restaurants.filter((item) => item.active).map((item) => publicRestaurant(item, false)) });
});

app.get("/api/restaurants/:id", (req, res) => {
  const restaurant = restaurantState.restaurants.find((item) => item.id === req.params.id && item.active);
  if (!restaurant) return res.status(404).json({ error: "Restaurant was not found." });
  return res.json({ restaurant: publicRestaurant(restaurant) });
});

app.post("/api/admin/restaurant-login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const accessCode = String(req.body.accessCode || "");
  const allowedLogins = [
    { username: String(process.env.HOPES_GO_ADMIN_USERNAME || "").toLowerCase(), code: String(process.env.HOPES_GO_ADMIN_ACCESS_CODE || ""), role: "admin", name: "Hope" },
    { username: String(process.env.HOPES_GO_OWNER_USERNAME || "").toLowerCase(), code: String(process.env.HOPES_GO_OWNER_ACCESS_CODE || ""), role: "owner", name: "Hope" },
  ];
  const matchedLogin = allowedLogins.find((login) => login.username && login.code && login.username === username && login.code === accessCode);
  if (!matchedLogin) {
    return res.status(401).json({ error: "Restaurant-site admin access was not approved." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  adminRestaurantSessions.set(token, { expiresAt: Date.now() + 8 * 60 * 60 * 1000 });
  return res.json({ token, role: matchedLogin.role, name: matchedLogin.name });
});

function getConfiguredDrivers() {
  try {
    const parsed = JSON.parse(process.env.HOPES_GO_DRIVER_ACCOUNTS_JSON || "[]");
    return Array.isArray(parsed) ? parsed.filter((driver) => driver && driver.username && driver.passwordHash) : [];
  } catch {
    return [];
  }
}

function verifyDriverPassword(password, storedHash) {
  const [algorithm, saltHex, digestHex] = String(storedHash || "").split("$");
  if (algorithm !== "scrypt" || !saltHex || !digestHex) return false;
  try {
    const digest = crypto.scryptSync(String(password || ""), Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(digestHex, "hex");
    return expected.length === digest.length && crypto.timingSafeEqual(digest, expected);
  } catch {
    return false;
  }
}

function publicDriver(driver) {
  return {
    username: String(driver.username),
    name: String(driver.name || driver.username),
    phone: normalizePhoneNumber(driver.phone || ""),
    role: "driver",
  };
}

app.post("/api/driver/login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const driver = getConfiguredDrivers().find((item) => String(item.username).toLowerCase() === username);
  if (!driver || !verifyDriverPassword(password, driver.passwordHash)) {
    return res.status(401).json({ error: "The driver login is not correct." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  driverSessions.set(token, { username: String(driver.username), expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  return res.json({ token, driver: publicDriver(driver) });
});

app.post("/api/notify-driver", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const message = String(req.body.message || "").trim().slice(0, 1200);
  if (!name || !message) return res.status(400).json({ error: "Driver name and message are required." });
  const driver = getConfiguredDrivers().find((item) => String(item.name || "").toLowerCase() === name.toLowerCase());
  if (!driver || !driver.phone) return res.status(404).json({ error: "Driver phone is not configured." });
  const scheduledDriver = getEffectiveDriverStatuses().find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!scheduledDriver || !scheduledDriver.clockedIn) {
    return res.status(409).json({ error: "Driver is not scheduled and clocked in. No text was sent." });
  }
  try {
    const smsSent = await sendTextMessage(driver.phone, `Hope's & Go: ${message} Reply STOP to opt out or HELP for help.`);
    return res.json({ ok: true, smsSent });
  } catch (error) {
    console.error("Driver SMS failed:", error.message);
    return res.status(502).json({ error: "Driver notification could not be sent." });
  }
});

app.get("/api/admin/restaurants", requireRestaurantAdmin, (_req, res) => {
  res.json({ restaurants: restaurantState.restaurants.map((restaurant) => ({ id: restaurant.id, storeName: restaurant.storeName, active: restaurant.active, stripeReady: Boolean(restaurant.stripeReady && restaurant.stripeAccountId) })) });
});

app.post("/api/admin/restaurants/:id/edit-session", requireRestaurantAdmin, (req, res) => {
  const restaurant = restaurantState.restaurants.find((item) => item.id === req.params.id);
  if (!restaurant) return res.status(404).json({ error: "Restaurant was not found." });
  res.json({ token: issueRestaurantSession(restaurant.id), restaurant: safeRestaurant(restaurant) });
});

app.post("/api/restaurant/login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const restaurant = restaurantState.restaurants.find((item) => item.username === username);
  if (!restaurant) return res.status(401).json({ error: "The restaurant login is not correct." });
  const attempt = hashRestaurantPassword(password, restaurant.passwordSalt).hash;
  const valid = attempt.length === restaurant.passwordHash.length && crypto.timingSafeEqual(Buffer.from(attempt), Buffer.from(restaurant.passwordHash));
  if (!valid) return res.status(401).json({ error: "The restaurant login is not correct." });
  return res.json({ token: issueRestaurantSession(restaurant.id), restaurant: safeRestaurant(restaurant) });
});

app.get("/api/restaurant/me", requireRestaurant, (req, res) => {
  res.json({ restaurant: safeRestaurant(req.restaurant) });
});

app.get("/api/restaurant/orders", requireRestaurant, (req, res) => {
  const orders = restaurantOrders
    .filter((order) => order.restaurantId === req.restaurant.id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  res.json({ current: orders.filter((order) => !["completed", "cancelled"].includes(order.status)).map(publicRestaurantOrder), past: orders.filter((order) => ["completed", "cancelled"].includes(order.status)).map(publicRestaurantOrder) });
});

app.get("/api/restaurant/pay-records", requireRestaurant, (req, res) => {
  const records = restaurantOrders
    .filter((order) => order.restaurantId === req.restaurant.id)
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      foodSubtotal: order.foodSubtotal,
      foodTax: order.foodTax,
      restaurantAmount: order.restaurantAmount,
      paymentStatus: order.status === "completed" ? "Transfer expected after capture" : "Pending order completion",
    }));
  res.json({ records });
});

app.post("/api/restaurant/orders/:id/status", requireRestaurant, (req, res) => {
  const order = restaurantOrders.find((entry) => entry.id === req.params.id && entry.restaurantId === req.restaurant.id);
  if (!order) return res.status(404).json({ error: "Order was not found." });
  const nextStatus = String(req.body.status || "");
  if (!["new", "preparing", "ready", "completed", "cancelled"].includes(nextStatus)) return res.status(400).json({ error: "Choose a valid order status." });
  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  saveRestaurantOrders();
  res.json({ order: publicRestaurantOrder(order) });
});

app.post("/api/restaurant/logout", requireRestaurant, (req, res) => {
  restaurantSessions.delete(req.restaurantToken);
  res.json({ ok: true });
});

app.put("/api/restaurant/me", requireRestaurant, (req, res) => {
  const restaurant = req.restaurant;
  const body = req.body || {};
  restaurant.storeName = String(body.storeName || restaurant.storeName).trim().slice(0, 100);
  restaurant.description = String(body.description || "").trim().slice(0, 500);
  restaurant.address = String(body.address || "").trim().slice(0, 200);
  restaurant.phone = String(body.phone || "").trim().slice(0, 40);
  restaurant.logo = cleanImage(body.logo);
  restaurant.coverImage = cleanImage(body.coverImage);
  restaurant.hours = Object.fromEntries(availabilityDays.map((day) => [day, String(body.hours?.[day] || "Closed").trim().slice(0, 80)]));
  restaurant.menu = (Array.isArray(body.menu) ? body.menu : []).slice(0, 150).map((item) => ({
    id: String(item.id || `item-${crypto.randomUUID()}`).slice(0, 80),
    name: String(item.name || "Untitled item").trim().slice(0, 100),
    description: String(item.description || "").trim().slice(0, 300),
    category: String(item.category || "Menu").trim().slice(0, 60),
    price: Math.max(0, Math.min(1000, Number(item.price || 0))),
    image: cleanImage(item.image),
    active: item.active !== false,
  }));
  restaurant.weeklyDeals = (Array.isArray(body.weeklyDeals) ? body.weeklyDeals : []).slice(0, 20).map((deal) => ({
    id: String(deal.id || `deal-${crypto.randomUUID()}`).slice(0, 80),
    title: String(deal.title || "Weekly deal").trim().slice(0, 100),
    description: String(deal.description || "").trim().slice(0, 300),
    active: deal.active !== false,
  }));
  restaurant.updatedAt = new Date().toISOString();
  saveRestaurantState();
  res.json({ restaurant: safeRestaurant(restaurant) });
});

app.post("/api/restaurant/change-password", requireRestaurant, (req, res) => {
  const password = String(req.body.password || "");
  if (password.length < 10) return res.status(400).json({ error: "Use at least 10 characters for the new password." });
  const next = hashRestaurantPassword(password);
  req.restaurant.passwordSalt = next.salt;
  req.restaurant.passwordHash = next.hash;
  req.restaurant.updatedAt = new Date().toISOString();
  saveRestaurantState();
  res.json({ ok: true });
});

app.use(express.static(__dirname));

app.post("/create-checkout-session", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY." });
  }

  const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
  const invalidQuantity = requestedItems.some((item) => {
    const quantity = Number(item.quantity);
    return !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_SERVICE_QUANTITY;
  });
  if (invalidQuantity) {
    return res.status(400).json({ error: `Service quantities must be whole numbers from 1 to ${MAX_SERVICE_QUANTITY}.` });
  }
  const selectedItems = requestedItems
    .map((item) => {
      const service = services.find((entry) => entry.id === Number(item.id));
      const quantity = Number(item.quantity);
      return service ? { ...service, quantity } : null;
    })
    .filter(Boolean);

  if (!selectedItems.length) {
    return res.status(400).json({ error: "No checkout items selected." });
  }

  const customer = req.body.customer || {};
  if (!String(customer.name || "").trim()) {
    return res.status(400).json({ error: "Customer name is required." });
  }
  if (!String(customer.email || "").trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: "A valid customer email is required." });
  }
  if (!String(customer.pickupAddress || "").trim()) {
    return res.status(400).json({ error: "Pickup address is required." });
  }
  if (!String(customer.deliveryAddress || "").trim()) {
    return res.status(400).json({ error: "Delivery address is required." });
  }
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

  const regularSubtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + getMembershipLineTotal(item, req.body.membershipCode, req.body.membershipUsage),
    0
  );
  const membershipSavings = Math.max(0, regularSubtotal - subtotal);
  const discountAmount = getDiscountAmount(subtotal, req.body.discountCode);
  const tip = Number(req.body.tip || 0);
  const shoppingHold = Number(req.body.shopping?.holdTotal || 0);
  const requestedRestaurantOrder = req.body.restaurantOrder && typeof req.body.restaurantOrder === "object"
    ? req.body.restaurantOrder
    : null;
  let restaurant = null;
  let restaurantItems = [];
  let restaurantFoodSubtotal = 0;
  let restaurantFoodTax = 0;
  if (requestedRestaurantOrder) {
    restaurant = restaurantState.restaurants.find(
      (entry) => entry.id === String(requestedRestaurantOrder.restaurantId || "") && entry.active
    );
    if (!restaurant) return res.status(400).json({ error: "The selected restaurant is not available." });
    const requestedMenuItems = Array.isArray(requestedRestaurantOrder.items) ? requestedRestaurantOrder.items : [];
    restaurantItems = requestedMenuItems.map((requestedItem) => {
      const menuItem = (restaurant.menu || []).find((entry) => entry.id === String(requestedItem.id) && entry.active !== false);
      const quantity = Number(requestedItem.quantity);
      if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
      return { ...menuItem, quantity, lineTotal: Number(menuItem.price) * quantity };
    }).filter(Boolean);
    if (!restaurantItems.length || restaurantItems.length !== requestedMenuItems.length) {
      return res.status(400).json({ error: "One or more restaurant menu items changed. Please review the restaurant cart." });
    }
    if (!restaurant.stripeReady || !restaurant.stripeAccountId) {
      return res.status(409).json({ error: "This restaurant has not finished connecting its Stripe account." });
    }
    restaurantFoodSubtotal = restaurantItems.reduce((sum, item) => sum + item.lineTotal, 0);
    restaurantFoodTax = restaurantFoodSubtotal * Number(restaurant.foodTaxRate || 0);
  }
  if (!Number.isFinite(tip) || tip < 0 || tip > MAX_TIP_AMOUNT) {
    return res.status(400).json({ error: `Tip must be between $0 and $${MAX_TIP_AMOUNT}.` });
  }
  if (!Number.isFinite(shoppingHold) || shoppingHold < 0 || shoppingHold > MAX_SHOPPING_HOLD) {
    return res.status(400).json({ error: `Shopping estimate must be between $0 and $${MAX_SHOPPING_HOLD}.` });
  }
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = taxableSubtotal * taxRate;
  const restaurantTransfer = restaurantFoodSubtotal + restaurantFoodTax;
  const finalTotal = Math.max(0.5, taxableSubtotal + tax + tip + shoppingHold + restaurantTransfer);

  const description = [
    `Customer: ${customer.name || "Not provided"}`,
    `Phone: ${customer.phone || "Not provided"}`,
    `Pickup: ${customer.pickupAddress || "Not provided"}`,
    `Delivery: ${customer.deliveryAddress || "Not provided"}`,
  ].join(" | ");

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      customer_email: customer.email,
      customer_creation: "if_required",
      phone_number_collection: {
        enabled: false,
      },
      saved_payment_method_options: {
        payment_method_save: "enabled",
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
        ...(restaurant ? { transfer_data: { destination: restaurant.stripeAccountId, amount: toCents(restaurantTransfer) } } : {}),
        metadata: {
          customer_name: customer.name || "",
          request_token: String(req.body.requestToken || ""),
          customer_phone: customer.phone || "",
          pickup_address: customer.pickupAddress || "",
          delivery_address: customer.deliveryAddress || "",
          selected_services: selectedItems.map((item) => `${item.name} x${item.quantity}`).join(", "),
          discount_code: req.body.discountCode || "",
          membership_code: req.body.membershipCode || "",
          membership_name: req.body.membershipName || "",
          membership_savings: String(membershipSavings),
          tip: String(tip),
          driver_name: String(req.body.driverName || ""),
          driver_tip_transfer_status: tip > 0 ? "pending-driver-assignment" : "none",
          tax: String(tax),
          tax_rate: String(taxRate),
          additional_stop_address: req.body.additionalStop?.address || "",
          additional_stop_notes: req.body.additionalStop?.notes || "",
          shopping_estimate: String(req.body.shopping?.estimate || 0),
          shopping_cushion: String(req.body.shopping?.cushion || 0),
          shopping_hold_total: String(req.body.shopping?.holdTotal || 0),
          shopping_items: Array.isArray(req.body.shopping?.items) ? req.body.shopping.items.join(", ") : "",
          shopping_photo_names: Array.isArray(req.body.shopping?.photos) ? req.body.shopping.photos.join(", ") : "",
          refund_note: "Refund unused shopping estimate funds immediately when shopping is completed.",
          restaurant_id: restaurant?.id || "",
          restaurant_name: restaurant?.storeName || "",
          restaurant_food_subtotal: String(restaurantFoodSubtotal),
          restaurant_food_tax: String(restaurantFoodTax),
          restaurant_transfer: String(restaurantTransfer),
          restaurant_items: restaurantItems.map((item) => `${item.name} x${item.quantity}`).join(", ").slice(0, 500),
        },
      },
      return_url: `${baseUrl}/index.html?checkout=authorized&session_id={CHECKOUT_SESSION_ID}#storefront`,
    });
  } catch (error) {
    console.error("Stripe embedded checkout failed:", error.message);
    return res.status(500).json({ error: error.message || "Checkout could not be started." });
  }

  if (restaurant) {
    const restaurantOrder = {
      id: crypto.randomUUID(),
      orderNumber: `HG-${String(Date.now()).slice(-6)}`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.storeName,
      status: "new",
      customerName: String(customer.name || "Customer"),
      customerPhone: String(customer.phone || ""),
      customerEmail: String(customer.email || ""),
      pickupAddress: String(customer.pickupAddress || restaurant.address || ""),
      deliveryAddress: String(customer.deliveryAddress || ""),
      items: restaurantItems.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, lineTotal: item.lineTotal })),
      foodSubtotal: restaurantFoodSubtotal,
      foodTax: restaurantFoodTax,
      restaurantAmount: restaurantTransfer,
      stripeCheckoutSessionId: session.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    restaurantOrders.unshift(restaurantOrder);
    saveRestaurantOrders();
  }

  const mainServiceNames = selectedItems
    .filter((item) => item.category === "Main Services")
    .map((item) => item.name)
    .join(", ") + (restaurant ? ` from ${restaurant.storeName}` : "");
  const ownerAlert = await notifyOwnerNewOrder({
    serviceName: mainServiceNames,
    customerName: customer.name || "Customer",
  });

  res.json({
    clientSecret: session.client_secret,
    sessionId: session.id,
    url: session.url,
    ownerAlertId: ownerAlert.alert.id,
    ownerSmsSent: ownerAlert.smsSent,
    split: restaurant ? {
      restaurant: restaurant.storeName,
      foodSubtotal: restaurantFoodSubtotal,
      foodTax: restaurantFoodTax,
      restaurantTransfer,
      hopesGoAmountBeforeStripeFees: finalTotal - restaurantTransfer,
    } : null,
  });
});

app.post("/create-membership-checkout-session", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY." });
  }

  const plan = membershipPlans.find((item) => item.id === req.body.planId);
  if (!plan) {
    return res.status(400).json({ error: "Membership plan not found." });
  }

  const customer = req.body.customer || {};
  if (!customer.email) {
    return res.status(400).json({ error: "Customer email is required for membership checkout." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ui_mode: "embedded",
      customer_email: customer.email,
      customer_creation: "if_required",
      saved_payment_method_options: {
        payment_method_save: "enabled",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            recurring: { interval: "month" },
            product_data: {
              name: plan.name,
              description: "Hope's & Go monthly membership benefits and automatic savings.",
            },
            unit_amount: toCents(plan.monthlyPrice),
          },
        },
      ],
      subscription_data: {
        metadata: {
          plan_id: plan.id,
          customer_name: customer.name || "",
          customer_phone: customer.phone || "",
        },
      },
      return_url: `${baseUrl}/index.html?membership=active&plan=${encodeURIComponent(plan.id)}&session_id={CHECKOUT_SESSION_ID}#storefront`,
    });

    res.json({
      clientSecret: session.client_secret,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe membership checkout failed:", error.message);
    res.status(500).json({ error: error.message || "Membership checkout could not be started." });
  }
});

app.get("/checkout-session-status", async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY." });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id, {
      expand: ["payment_intent.latest_charge"],
    });
    const paymentIntent = session.payment_intent && typeof session.payment_intent === "object" ? session.payment_intent : null;
    const charge = paymentIntent?.latest_charge && typeof paymentIntent.latest_charge === "object" ? paymentIntent.latest_charge : null;
    const outcome = charge?.outcome || {};
    const address = charge?.billing_details?.address || {};
    const billingAddress = [address.line1, address.line2, address.city, address.state, address.postal_code, address.country].filter(Boolean).join(", ");
    const paymentValid = ["requires_capture", "succeeded", "processing"].includes(paymentIntent?.status);
    const riskFlags = [];
    if (["elevated", "highest"].includes(String(outcome.risk_level || "").toLowerCase())) riskFlags.push(`Stripe risk level is ${outcome.risk_level}`);
    if (Number(outcome.risk_score || 0) >= 65) riskFlags.push(`Stripe risk score is ${outcome.risk_score}`);
    if (outcome.type && !["authorized", "approved"].includes(String(outcome.type).toLowerCase())) riskFlags.push(`Stripe payment outcome is ${outcome.type}`);
    res.json({
      status: session.status,
      paymentStatus: session.payment_status,
      paymentIntentStatus: paymentIntent?.status || "",
      paymentValid,
      requestToken: paymentIntent?.metadata?.request_token || "",
      riskLevel: outcome.risk_level || "",
      riskScore: outcome.risk_score ?? null,
      outcomeType: outcome.type || "",
      riskFlags,
      billingAddress,
      customerEmail: session.customer_details?.email || session.customer_email || "",
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Checkout session could not be checked." });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

if (require.main === module) {
  app.listen(port, "0.0.0.0", () => {
    console.log(`Hope's & Go app running at ${baseUrl}`);
  });

  setInterval(() => {
    checkClockInMonitoring().catch((error) => {
      console.error("Clock-in monitor failed:", error.message);
    });
  }, 60 * 1000);

  checkClockInMonitoring().catch((error) => {
    console.error("Initial clock-in monitor failed:", error.message);
  });
}

module.exports = {
  app,
  getCentralTimeParts,
  getOperatingContext,
  getOwnerAutomaticStatus,
  getOperationsSnapshot,
};
