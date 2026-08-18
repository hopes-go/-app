const TAX_RATE = 0.07;
const restaurantTerminals = {
  "demo-jerrys": { pin: "2468", name: "Jerry's Main Lunch" },
  "demo-cafe": { pin: "1357", name: "Main Street Cafe" },
};

const initialOrders = [
  {
    id: "HG-1042",
    customer: "Jamie R.",
    receivedAt: new Date().toISOString(),
    status: "incoming",
    items: [
      { quantity: 2, name: "Cheeseburger baskets" },
      { quantity: 1, name: "Large onion rings" },
      { quantity: 2, name: "Chocolate shakes" },
    ],
    subtotal: null,
    pickupTime: "",
    paid: false,
    declineReason: "",
  },
];

function copyOrders(source) {
  return JSON.parse(JSON.stringify(source));
}

if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
  Element.prototype.closest = function closest(selector) {
    var element = this;
    while (element && element.nodeType === 1) {
      if (element.matches(selector)) return element;
      element = element.parentElement;
    }
    return null;
  };
}

let orders = copyOrders(initialOrders);
const orderList = document.querySelector("#orderList");
const dialog = document.querySelector("#orderDialog");
const dialogEyebrow = document.querySelector("#dialogEyebrow");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogBody = document.querySelector("#dialogBody");
const toast = document.querySelector("#toast");
const terminalLogin = document.querySelector("#terminalLogin");
const terminalApp = document.querySelector("#terminalApp");

document.querySelector("#terminalLoginForm").addEventListener("submit", function (event) {
  event.preventDefault();
  var username = document.querySelector("#terminalUsername").value.toLowerCase().replace(/^\s+|\s+$/g, "");
  var pin = document.querySelector("#terminalPin").value;
  var terminal = restaurantTerminals[username];
  if (!terminal || terminal.pin !== pin) {
    document.querySelector("#terminalLoginStatus").textContent = "The restaurant username or tablet PIN is incorrect.";
    return;
  }
  document.querySelector("#restaurantName").textContent = terminal.name;
  document.querySelector("#terminalLoginStatus").textContent = "";
  document.querySelector("#terminalLoginForm").reset();
  terminalLogin.hidden = true;
  terminalApp.hidden = false;
  orders = copyOrders(initialOrders);
  render();
});

document.querySelector("#terminalLogout").addEventListener("click", function () {
  terminalApp.hidden = true;
  terminalLogin.hidden = false;
  orders = copyOrders(initialOrders);
  document.querySelector("#terminalUsername").focus();
});

function openDialog() {
  dialog.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDialog() {
  dialog.hidden = true;
  document.body.style.overflow = "";
}

document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#orderForm").addEventListener("submit", function (event) { event.preventDefault(); });
document.querySelector("#orderForm").addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (button && button.value === "cancel") closeDialog();
});
dialog.addEventListener("click", function (event) {
  if (event.target === dialog) closeDialog();
});

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

function paymentTotals(order) {
  const subtotal = Number(order.subtotal || 0);
  const tax = subtotal * TAX_RATE;
  return { subtotal, tax, total: subtotal + tax };
}

function statusLabel(status) {
  return ({ incoming: "Incoming order", preparing: "Preparing", ready: "Ready for pickup", declined: "Declined" })[status] || status;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function render() {
  document.querySelector("#incomingCount").textContent = orders.filter((order) => order.status === "incoming").length;
  document.querySelector("#preparingCount").textContent = orders.filter((order) => order.status === "preparing").length;
  document.querySelector("#readyCount").textContent = orders.filter((order) => order.status === "ready").length;

  orderList.innerHTML = orders.length ? orders.map((order) => {
    const totals = paymentTotals(order);
    const actions = order.status === "incoming"
      ? `<button class="primary" data-action="accept" data-id="${order.id}">Accept order</button><button class="danger" data-action="decline" data-id="${order.id}">Decline order</button>`
      : order.status === "preparing"
        ? `<button class="primary wide" data-action="manage" data-id="${order.id}">Manage order</button>`
        : order.status === "ready" && !order.paid
          ? `<button class="primary wide" data-action="simulate-payment" data-id="${order.id}">Demo: mark customer payment processed</button>`
          : "";
    return `<article class="order-card">
      <div class="order-top"><h2>${escapeHtml(order.id)}</h2><time>${new Date(order.receivedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div>
      <span class="status ${escapeHtml(order.status)}">${escapeHtml(statusLabel(order.status))}</span>
      <p class="customer">Customer: ${escapeHtml(order.customer)}</p>
      <div class="items">${order.items.map((item) => `<div class="order-row"><span>${item.quantity} × ${escapeHtml(item.name)}</span></div>`).join("")}</div>
      ${order.subtotal !== null ? `<div class="order-row"><span>Store subtotal (before tax)</span><strong>${money(totals.subtotal)}</strong></div><div class="order-row"><span>Tax added by Hope's &amp; Go</span><strong>${money(totals.tax)}</strong></div><div class="order-row"><span>Customer food total</span><strong>${money(totals.total)}</strong></div>` : `<p class="notice">Accept this order, enter the subtotal without tax, and choose a pickup time.</p>`}
      ${order.pickupTime ? `<p><strong>Pickup time:</strong> ${escapeHtml(order.pickupTime)}</p>` : ""}
      ${order.declineReason ? `<p><strong>Reason:</strong> ${escapeHtml(order.declineReason)}</p>` : ""}
      <div class="paid-row"><span>Order paid for?</span><span class="payment-check ${order.paid ? "paid" : ""}" aria-label="${order.paid ? "Paid" : "Not paid"}">${order.paid ? "✓" : ""}</span></div>
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </article>`;
  }).join("") : `<div class="empty"><h2>No orders</h2><p>New orders will appear here automatically.</p></div>`;
}

function openAccept(order) {
  dialogEyebrow.textContent = "Accept incoming order";
  dialogTitle.textContent = order.id;
  const defaultTime = new Date(Date.now() + 25 * 60000).toTimeString().slice(0, 5);
  dialogBody.innerHTML = `<div class="field-grid">
    <label>Order subtotal — no taxes<input id="subtotalInput" type="number" min="0.01" max="5000" step="0.01" inputmode="decimal" placeholder="0.00" required /></label>
    <label>Pickup time<input id="pickupTimeInput" type="time" value="${defaultTime}" required /></label>
  </div>
  <div class="calculation"><div><span>Store subtotal</span><strong id="calcSubtotal">$0.00</strong></div><div><span>Tax (${(TAX_RATE * 100).toFixed(0)}%)</span><strong id="calcTax">$0.00</strong></div><div class="total"><span>Customer food total</span><strong id="calcTotal">$0.00</strong></div></div>
  <p class="notice">Enter only the food subtotal. Hope's &amp; Go calculates tax and prepares the customer's final charge.</p>
  <div class="dialog-actions"><button class="secondary" value="cancel">Cancel</button><button class="primary" id="confirmAccept" type="button">Accept order</button></div>`;
  const input = document.querySelector("#subtotalInput");
  const update = () => {
    const totals = paymentTotals({ subtotal: input.value });
    document.querySelector("#calcSubtotal").textContent = money(totals.subtotal);
    document.querySelector("#calcTax").textContent = money(totals.tax);
    document.querySelector("#calcTotal").textContent = money(totals.total);
  };
  input.addEventListener("input", update);
  document.querySelector("#confirmAccept").addEventListener("click", () => {
    const subtotal = Number(input.value);
    const pickupTime = document.querySelector("#pickupTimeInput").value;
    if (!(subtotal > 0) || !pickupTime) return showToast("Enter the subtotal and pickup time.");
    order.subtotal = subtotal;
    order.pickupTime = formatTime(pickupTime);
    order.status = "preparing";
    closeDialog();
    render();
    showToast("Order accepted. Customer total calculated.");
  });
  openDialog();
  setTimeout(() => input.focus(), 50);
}

function formatTime(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function openManage(order) {
  const totals = paymentTotals(order);
  dialogEyebrow.textContent = "Order in progress";
  dialogTitle.textContent = order.id;
  dialogBody.innerHTML = `<div class="calculation"><div><span>Store subtotal</span><strong>${money(totals.subtotal)}</strong></div><div><span>Tax</span><strong>${money(totals.tax)}</strong></div><div class="total"><span>Customer food total</span><strong>${money(totals.total)}</strong></div></div>
  <p><strong>Current pickup time:</strong> <span id="currentPickupTime">${escapeHtml(order.pickupTime)}</span></p>
  <p>Add preparation time if the kitchen needs longer:</p>
  <div class="time-buttons"><button type="button" data-add-minutes="5">+5 min</button><button type="button" data-add-minutes="10">+10 min</button><button type="button" data-add-minutes="15">+15 min</button></div>
  <div class="dialog-actions"><button class="secondary" value="cancel">Close</button><button class="primary" id="finishOrder" type="button">Finish order</button></div>`;
  dialogBody.querySelectorAll("[data-add-minutes]").forEach((button) => button.addEventListener("click", () => {
    const match = order.pickupTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return;
    let hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    const date = new Date(2000, 0, 1, hour, Number(match[2]) + Number(button.dataset.addMinutes));
    order.pickupTime = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    document.querySelector("#currentPickupTime").textContent = order.pickupTime;
    render();
    showToast(`${button.dataset.addMinutes} minutes added.`);
  }));
  document.querySelector("#finishOrder").addEventListener("click", () => {
    order.status = "ready";
    closeDialog();
    render();
    showToast("Order marked ready for pickup.");
  });
  openDialog();
}

function openDecline(order) {
  dialogEyebrow.textContent = "Decline order";
  dialogTitle.textContent = order.id;
  dialogBody.innerHTML = `<label>Reason for declining<select id="declineReason"><option value="">Choose a reason</option><option>Kitchen is too busy</option><option>Item is unavailable</option><option>Restaurant is closing</option><option>Order information is incomplete</option><option value="Other">Other</option></select></label><label class="full" id="otherReasonLabel" hidden>Explain why<textarea id="otherReason"></textarea></label><div class="dialog-actions"><button class="secondary" value="cancel">Keep order</button><button class="danger" id="confirmDecline" type="button">Decline order</button></div>`;
  const select = document.querySelector("#declineReason");
  select.addEventListener("change", () => document.querySelector("#otherReasonLabel").hidden = select.value !== "Other");
  document.querySelector("#confirmDecline").addEventListener("click", () => {
    const reason = select.value === "Other" ? document.querySelector("#otherReason").value.trim() : select.value;
    if (!reason) return showToast("Choose or enter a decline reason.");
    order.status = "declined";
    order.declineReason = reason;
    closeDialog();
    render();
    showToast("Order declined and reason saved.");
  });
  openDialog();
}

orderList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const order = orders.find((entry) => entry.id === button.dataset.id);
  if (!order) return;
  if (button.dataset.action === "accept") openAccept(order);
  if (button.dataset.action === "decline") openDecline(order);
  if (button.dataset.action === "manage") openManage(order);
  if (button.dataset.action === "simulate-payment") {
    order.paid = true;
    render();
    showToast("Demo payment processed. Paid checkmark added.");
  }
});

document.querySelector("#resetDemo").addEventListener("click", () => {
  orders = copyOrders(initialOrders);
  render();
  showToast("Demo reset.");
});

render();
