var TAX_RATE = 0.07;
var orders = [];
var terminalToken = sessionStorage.getItem("hopesGoRestaurantTabletToken") || "";
var terminalRestaurantName = sessionStorage.getItem("hopesGoRestaurantTabletName") || "Partner Restaurant";
var refreshTimer = null;

if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
if (!Element.prototype.closest) {
  Element.prototype.closest = function (selector) {
    var element = this;
    while (element && element.nodeType === 1) {
      if (element.matches(selector)) return element;
      element = element.parentElement;
    }
    return null;
  };
}

var orderList = document.querySelector("#orderList");
var dialog = document.querySelector("#orderDialog");
var dialogEyebrow = document.querySelector("#dialogEyebrow");
var dialogTitle = document.querySelector("#dialogTitle");
var dialogBody = document.querySelector("#dialogBody");
var toast = document.querySelector("#toast");
var terminalLogin = document.querySelector("#terminalLogin");
var terminalApp = document.querySelector("#terminalApp");
var loginStatus = document.querySelector("#terminalLoginStatus");

function apiRequest(method, url, body, callback) {
  var request = new XMLHttpRequest();
  request.open(method, url, true);
  request.setRequestHeader("Content-Type", "application/json");
  if (terminalToken) request.setRequestHeader("Authorization", "Bearer " + terminalToken);
  request.onreadystatechange = function () {
    if (request.readyState !== 4) return;
    var data = {};
    try { data = JSON.parse(request.responseText || "{}"); } catch (error) {}
    if (request.status >= 200 && request.status < 300) return callback(null, data, request.status);
    callback(data.error || "The restaurant tablet could not reach Hope's & Go.", data, request.status);
  };
  request.onerror = function () { callback("The restaurant tablet could not connect to the server."); };
  request.send(body ? JSON.stringify(body) : null);
}

function money(value) { return "$" + Number(value || 0).toFixed(2); }
function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character];
  });
}
function paymentTotals(order) {
  var subtotal = Number(order.subtotal || 0);
  var tax = Number(order.tax || subtotal * TAX_RATE);
  return { subtotal: subtotal, tax: tax, total: Number(order.total || subtotal + tax) };
}
function statusLabel(status) {
  return ({ incoming: "Incoming order", preparing: "Preparing", ready: "Ready for pickup", declined: "Declined", completed: "Completed" })[status] || status;
}
function mapOrder(order) {
  var status = ({ new: "incoming", preparing: "preparing", ready: "ready", cancelled: "declined", completed: "completed" })[order.status] || order.status;
  return {
    id: order.orderNumber || order.id,
    apiId: order.id,
    customer: order.customerName || "Customer",
    receivedAt: order.createdAt || new Date().toISOString(),
    status: status,
    items: order.items || [],
    subtotal: Number(order.foodSubtotal || 0) || null,
    tax: Number(order.foodTax || 0),
    total: Number(order.restaurantAmount || 0),
    pickupTime: order.pickupTime || "",
    paid: order.paid === true,
    declineReason: order.declineReason || ""
  };
}

function showToast(message) {
  toast.textContent = message;
  toast.className = "show";
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { toast.className = ""; }, 2600);
}
function showLogin(message) {
  terminalToken = "";
  sessionStorage.removeItem("hopesGoRestaurantTabletToken");
  sessionStorage.removeItem("hopesGoRestaurantTabletName");
  terminalApp.hidden = true;
  terminalLogin.hidden = false;
  loginStatus.textContent = message || "";
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
}
function openTerminal() {
  document.querySelector("#restaurantName").textContent = terminalRestaurantName;
  terminalLogin.hidden = true;
  terminalApp.hidden = false;
  loadOrders();
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(loadOrders, 15000);
}
function loadOrders() {
  if (!terminalToken) return;
  apiRequest("GET", "/api/restaurant/tablet/orders", null, function (error, data, status) {
    if (status === 401) return showLogin(error);
    if (error) return showToast(error);
    orders = (data.orders || []).map(mapOrder);
    render();
  });
}

document.querySelector("#terminalLoginForm").addEventListener("submit", function (event) {
  event.preventDefault();
  var username = document.querySelector("#terminalUsername").value.replace(/^\s+|\s+$/g, "");
  var pin = document.querySelector("#terminalPin").value.replace(/\D/g, "");
  if (pin.length !== 6) {
    loginStatus.textContent = "Enter the six-digit tablet PIN.";
    return;
  }
  loginStatus.textContent = "Opening restaurant orders...";
  apiRequest("POST", "/api/restaurant/tablet-login", { username: username, pin: pin }, function (error, data) {
    if (error) {
      loginStatus.textContent = error;
      return;
    }
    terminalToken = data.token;
    terminalRestaurantName = data.restaurant.storeName || "Partner Restaurant";
    sessionStorage.setItem("hopesGoRestaurantTabletToken", terminalToken);
    sessionStorage.setItem("hopesGoRestaurantTabletName", terminalRestaurantName);
    loginStatus.textContent = "";
    document.querySelector("#terminalLoginForm").reset();
    openTerminal();
  });
});

document.querySelector("#terminalLogout").addEventListener("click", function () {
  apiRequest("POST", "/api/restaurant/tablet/logout", {}, function () { showLogin(""); });
});
document.querySelector("#refreshOrders").addEventListener("click", loadOrders);

function openDialog() { dialog.hidden = false; document.body.style.overflow = "hidden"; }
function closeDialog() { dialog.hidden = true; document.body.style.overflow = ""; }
document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#orderForm").addEventListener("submit", function (event) { event.preventDefault(); });
document.querySelector("#orderForm").addEventListener("click", function (event) {
  var button = event.target.closest("button");
  if (button && button.value === "cancel") closeDialog();
});
dialog.addEventListener("click", function (event) { if (event.target === dialog) closeDialog(); });

function render() {
  document.querySelector("#incomingCount").textContent = orders.filter(function (order) { return order.status === "incoming"; }).length;
  document.querySelector("#preparingCount").textContent = orders.filter(function (order) { return order.status === "preparing"; }).length;
  document.querySelector("#readyCount").textContent = orders.filter(function (order) { return order.status === "ready"; }).length;
  orderList.innerHTML = orders.length ? orders.map(function (order) {
    var totals = paymentTotals(order);
    var actions = order.status === "incoming"
      ? '<button class="primary" data-action="accept" data-id="' + escapeHtml(order.apiId) + '">Accept order</button><button class="danger" data-action="decline" data-id="' + escapeHtml(order.apiId) + '">Decline order</button>'
      : order.status === "preparing" ? '<button class="primary wide" data-action="manage" data-id="' + escapeHtml(order.apiId) + '">Manage order</button>' : "";
    var itemRows = order.items.map(function (item) {
      return '<div class="order-row"><span>' + Number(item.quantity || 0) + ' x ' + escapeHtml(item.name) + '</span></div>';
    }).join("");
    return '<article class="order-card"><div class="order-top"><h2>' + escapeHtml(order.id) + '</h2><time>' + new Date(order.receivedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '</time></div>' +
      '<span class="status ' + escapeHtml(order.status) + '">' + escapeHtml(statusLabel(order.status)) + '</span><p class="customer">Customer: ' + escapeHtml(order.customer) + '</p><div class="items">' + itemRows + '</div>' +
      (order.subtotal !== null ? '<div class="order-row"><span>Store subtotal (before tax)</span><strong>' + money(totals.subtotal) + '</strong></div><div class="order-row"><span>Tax added by Hope\'s &amp; Go</span><strong>' + money(totals.tax) + '</strong></div><div class="order-row"><span>Customer food total</span><strong>' + money(totals.total) + '</strong></div>' : '<p class="notice">Accept this order, enter the subtotal without tax, and choose a pickup time.</p>') +
      (order.pickupTime ? '<p><strong>Pickup time:</strong> ' + escapeHtml(order.pickupTime) + '</p>' : '') + (order.declineReason ? '<p><strong>Reason:</strong> ' + escapeHtml(order.declineReason) + '</p>' : '') +
      '<div class="paid-row"><span>Order paid for?</span><span class="payment-check ' + (order.paid ? 'paid' : '') + '" aria-label="' + (order.paid ? 'Paid' : 'Not paid') + '">' + (order.paid ? '&#10003;' : '') + '</span></div>' + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</article>';
  }).join("") : '<div class="empty"><h2>No orders</h2><p>New orders will appear here automatically.</p></div>';
}

function sendOrderUpdate(order, body, successMessage) {
  apiRequest("POST", "/api/restaurant/tablet/orders/" + encodeURIComponent(order.apiId) + "/status", body, function (error) {
    if (error) return showToast(error);
    closeDialog();
    loadOrders();
    showToast(successMessage);
  });
}
function formatTime(value) {
  var parts = value.split(":");
  return new Date(2000, 0, 1, Number(parts[0]), Number(parts[1])).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function addMinutesToTime(value, minutes) {
  var match = String(value).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return value;
  var hour = Number(match[1]) % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return new Date(2000, 0, 1, hour, Number(match[2]) + Number(minutes)).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function openAccept(order) {
  dialogEyebrow.textContent = "Accept incoming order";
  dialogTitle.textContent = order.id;
  var future = new Date(Date.now() + 25 * 60000);
  var defaultTime = (future.getHours() < 10 ? "0" : "") + future.getHours() + ":" + (future.getMinutes() < 10 ? "0" : "") + future.getMinutes();
  dialogBody.innerHTML = '<div class="field-grid"><label>Order subtotal - no taxes<input id="subtotalInput" type="number" min="0.01" max="5000" step="0.01" inputmode="decimal" placeholder="0.00" required /></label><label>Pickup time<input id="pickupTimeInput" type="time" value="' + defaultTime + '" required /></label></div><div class="calculation"><div><span>Store subtotal</span><strong id="calcSubtotal">$0.00</strong></div><div><span>Tax (' + (TAX_RATE * 100).toFixed(0) + '%)</span><strong id="calcTax">$0.00</strong></div><div class="total"><span>Customer food total</span><strong id="calcTotal">$0.00</strong></div></div><p class="notice">Enter only the food subtotal. Hope\'s &amp; Go calculates tax and prepares the customer\'s final charge.</p><div class="dialog-actions"><button class="secondary" value="cancel">Cancel</button><button class="primary" id="confirmAccept" type="button">Accept order</button></div>';
  var input = document.querySelector("#subtotalInput");
  input.addEventListener("input", function () {
    var totals = paymentTotals({ subtotal: input.value });
    document.querySelector("#calcSubtotal").textContent = money(totals.subtotal);
    document.querySelector("#calcTax").textContent = money(totals.tax);
    document.querySelector("#calcTotal").textContent = money(totals.total);
  });
  document.querySelector("#confirmAccept").addEventListener("click", function () {
    var subtotal = Number(input.value);
    var pickupTime = document.querySelector("#pickupTimeInput").value;
    if (!(subtotal > 0) || !pickupTime) return showToast("Enter the subtotal and pickup time.");
    sendOrderUpdate(order, { status: "preparing", foodSubtotal: subtotal, pickupTime: formatTime(pickupTime) }, "Order accepted. Customer total calculated.");
  });
  openDialog();
  setTimeout(function () { input.focus(); }, 50);
}

function openManage(order) {
  var totals = paymentTotals(order);
  dialogEyebrow.textContent = "Order in progress";
  dialogTitle.textContent = order.id;
  dialogBody.innerHTML = '<div class="calculation"><div><span>Store subtotal</span><strong>' + money(totals.subtotal) + '</strong></div><div><span>Tax</span><strong>' + money(totals.tax) + '</strong></div><div class="total"><span>Customer food total</span><strong>' + money(totals.total) + '</strong></div></div><p><strong>Current pickup time:</strong> <span id="currentPickupTime">' + escapeHtml(order.pickupTime) + '</span></p><p>Add preparation time if the kitchen needs longer:</p><div class="time-buttons"><button type="button" data-add-minutes="5">+5 min</button><button type="button" data-add-minutes="10">+10 min</button><button type="button" data-add-minutes="15">+15 min</button></div><div class="dialog-actions"><button class="secondary" value="cancel">Close</button><button class="primary" id="finishOrder" type="button">Finish order</button></div>';
  var buttons = dialogBody.querySelectorAll("[data-add-minutes]");
  for (var index = 0; index < buttons.length; index += 1) {
    buttons[index].addEventListener("click", function () {
      var added = Number(this.getAttribute("data-add-minutes"));
      var nextTime = addMinutesToTime(order.pickupTime, added);
      sendOrderUpdate(order, { status: "preparing", foodSubtotal: order.subtotal, pickupTime: nextTime }, added + " minutes added.");
    });
  }
  document.querySelector("#finishOrder").addEventListener("click", function () {
    sendOrderUpdate(order, { status: "ready", pickupTime: order.pickupTime }, "Order marked ready for pickup.");
  });
  openDialog();
}

function openDecline(order) {
  dialogEyebrow.textContent = "Decline order";
  dialogTitle.textContent = order.id;
  dialogBody.innerHTML = '<label>Reason for declining<select id="declineReason"><option value="">Choose a reason</option><option>Kitchen is too busy</option><option>Item is unavailable</option><option>Restaurant is closing</option><option>Order information is incomplete</option><option value="Other">Other</option></select></label><label class="full" id="otherReasonLabel" hidden>Explain why<textarea id="otherReason"></textarea></label><div class="dialog-actions"><button class="secondary" value="cancel">Keep order</button><button class="danger" id="confirmDecline" type="button">Decline order</button></div>';
  var select = document.querySelector("#declineReason");
  select.addEventListener("change", function () { document.querySelector("#otherReasonLabel").hidden = select.value !== "Other"; });
  document.querySelector("#confirmDecline").addEventListener("click", function () {
    var reason = select.value === "Other" ? document.querySelector("#otherReason").value.replace(/^\s+|\s+$/g, "") : select.value;
    if (!reason) return showToast("Choose or enter a decline reason.");
    sendOrderUpdate(order, { status: "cancelled", declineReason: reason }, "Order declined and reason saved.");
  });
  openDialog();
}

orderList.addEventListener("click", function (event) {
  var button = event.target.closest("[data-action]");
  if (!button) return;
  var id = button.getAttribute("data-id");
  var order = null;
  for (var index = 0; index < orders.length; index += 1) if (orders[index].apiId === id) order = orders[index];
  if (!order) return;
  if (button.getAttribute("data-action") === "accept") openAccept(order);
  if (button.getAttribute("data-action") === "decline") openDecline(order);
  if (button.getAttribute("data-action") === "manage") openManage(order);
});

if (terminalToken) openTerminal();
else render();
