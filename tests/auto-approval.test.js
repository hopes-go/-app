const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../auto-approval.js");

function activeSettings(overrides = {}) {
  const now = Date.now();
  return engine.normalizeSettings({ enabled: true, maxAmount: 75, away: { startMs: now - 60000, endMs: now + 3600000 }, ...overrides });
}

const request = { total: 42, dropoff: "100 Main St, Burlington, IA 52601" };
const validPayment = { valid: true, riskLevel: "normal", riskScore: 10, outcomeType: "authorized" };

test("defaults to off with a $75 maximum", () => {
  const settings = engine.normalizeSettings();
  assert.equal(settings.enabled, false);
  assert.equal(settings.maxAmount, 75);
  assert.equal(settings.requireValidPayment, true);
});

test("approves a safe validated order during Away mode", () => {
  const decision = engine.evaluate(request, activeSettings(), validPayment);
  assert.equal(decision.approved, true);
  assert.match(decision.reason, /payment validated/);
});

test("sends orders over the configured threshold to manual review", () => {
  const decision = engine.evaluate({ ...request, total: 75.01 }, activeSettings(), validPayment);
  assert.equal(decision.approved, false);
  assert.match(decision.reason, /exceeds/);
});

test("requires validated payment and blocks repeated failures", () => {
  assert.equal(engine.evaluate(request, activeSettings(), { valid: false }).approved, false);
  const decision = engine.evaluate(request, activeSettings(), validPayment, { failedPaymentAttempts: 2 });
  assert.match(decision.reason, /Repeated failed/);
});

test("blocks elevated Stripe risk and mismatched addresses", () => {
  assert.equal(engine.evaluate(request, activeSettings(), { ...validPayment, riskLevel: "elevated" }).approved, false);
  assert.match(engine.evaluate(request, activeSettings(), { ...validPayment, billingAddress: "999 Other Ave" }).reason, /do not match/);
});

test("prioritizes an existing customer only after every check passes", () => {
  const decision = engine.evaluate(request, activeSettings(), validPayment, { existingCustomer: true });
  assert.equal(decision.approved, true);
  assert.equal(decision.priority, true);
});

test("supports overnight weekly timeframes", () => {
  assert.equal(engine.isTimeInRange("23:30", "22:00", "02:00"), true);
  assert.equal(engine.isTimeInRange("12:00", "22:00", "02:00"), false);
});

test("expired Away mode is inactive without a matching schedule", () => {
  const settings = activeSettings({ away: { startMs: Date.now() - 7200000, endMs: Date.now() - 3600000 } });
  assert.equal(engine.getActivation(settings).active, false);
});
