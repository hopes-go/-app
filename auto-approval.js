(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.HopesGoAutoApproval = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DEFAULT_SETTINGS = {
    enabled: false,
    maxAmount: 75,
    requireValidPayment: true,
    prioritizeTrustedCustomers: true,
    schedule: DAYS.map((day) => ({ day, enabled: false, start: "09:00", end: "17:00" })),
    away: null,
  };

  function normalizeSettings(value = {}) {
    const scheduleByDay = new Map((value.schedule || []).map((entry) => [entry.day, entry]));
    return {
      ...DEFAULT_SETTINGS,
      ...value,
      maxAmount: Math.max(0, Number(value.maxAmount ?? DEFAULT_SETTINGS.maxAmount) || DEFAULT_SETTINGS.maxAmount),
      schedule: DAYS.map((day) => ({
        day,
        enabled: Boolean(scheduleByDay.get(day)?.enabled),
        start: scheduleByDay.get(day)?.start || "09:00",
        end: scheduleByDay.get(day)?.end || "17:00",
      })),
      away: value.away && Number(value.away.endMs) > Date.now() ? value.away : null,
    };
  }

  function minutes(time) {
    const [hour, minute] = String(time || "").split(":").map(Number);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : -1;
  }

  function isTimeInRange(current, start, end) {
    const currentMinutes = minutes(current);
    const startMinutes = minutes(start);
    const endMinutes = minutes(end);
    if ([currentMinutes, startMinutes, endMinutes].some((value) => value < 0)) return false;
    if (startMinutes === endMinutes) return true;
    return endMinutes > startMinutes
      ? currentMinutes >= startMinutes && currentMinutes < endMinutes
      : currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  function getActivation(settingsValue, date = new Date()) {
    const settings = normalizeSettings(settingsValue);
    if (!settings.enabled) return { active: false, source: "off", label: "Auto-approval is off" };
    if (settings.away && date.getTime() < Number(settings.away.endMs) && date.getTime() >= Number(settings.away.startMs || 0)) {
      return { active: true, source: "away", label: `I'm Away until ${new Date(settings.away.endMs).toLocaleString()}` };
    }
    const entry = settings.schedule.find((item) => item.day === DAYS[date.getDay()]);
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    if (entry?.enabled && isTimeInRange(time, entry.start, entry.end)) {
      return { active: true, source: "schedule", label: `${entry.day}, ${entry.start}-${entry.end}` };
    }
    return { active: false, source: "schedule", label: "Outside configured auto-approval hours" };
  }

  function normalizedAddress(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function evaluate(request, settingsValue, payment = {}, context = {}, date = new Date()) {
    const settings = normalizeSettings(settingsValue);
    const activation = getActivation(settings, date);
    const flags = [];
    if (!activation.active) flags.push(activation.label);
    if (Number(request.total || 0) > settings.maxAmount) flags.push(`Order exceeds the ${settings.maxAmount.toFixed(2)} limit`);
    if (settings.requireValidPayment && !payment.valid) flags.push("Payment is not validated");
    if (payment.riskLevel && ["elevated", "highest"].includes(String(payment.riskLevel).toLowerCase())) flags.push(`Stripe risk level is ${payment.riskLevel}`);
    if (Number(payment.riskScore || 0) >= 65) flags.push(`Stripe risk score is ${payment.riskScore}`);
    if (payment.outcomeType && !["authorized", "approved", "normal"].includes(String(payment.outcomeType).toLowerCase())) flags.push(`Payment outcome is ${payment.outcomeType}`);
    if (Number(context.failedPaymentAttempts || 0) >= 2) flags.push("Repeated failed payment attempts");
    if (context.suspiciousCustomerData) flags.push("Suspicious customer information");
    const billing = normalizedAddress(payment.billingAddress);
    const delivery = normalizedAddress(request.dropoff);
    if (billing && delivery && billing !== delivery && !context.addressMismatchReviewed) flags.push("Billing and delivery addresses do not match");
    (context.additionalFlags || []).filter(Boolean).forEach((flag) => flags.push(String(flag)));
    const trusted = Boolean(context.trustedCustomer || context.existingCustomer);
    const approved = flags.length === 0;
    const priority = approved && settings.prioritizeTrustedCustomers && trusted;
    return {
      approved,
      priority,
      flags,
      activation,
      reason: approved
        ? `Within $${settings.maxAmount.toFixed(2)} limit; payment validated; no risk flags${priority ? "; trusted customer prioritized" : ""}`
        : flags.join("; "),
    };
  }

  return { DAYS, DEFAULT_SETTINGS, normalizeSettings, isTimeInRange, getActivation, evaluate };
});
