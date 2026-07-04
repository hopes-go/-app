const services = [
  {
    id: 1,
    name: "Pickup & Delivery",
    category: "Main Services",
    price: 10,
    image: "assets/pickup-delivery.png",
    description: "I pick up an order, item, or package and deliver it with care.",
    paymentRule: "Charge after accepted",
  },
  {
    id: 2,
    name: "Shop & Deliver",
    category: "Main Services",
    price: 15,
    image: "assets/shop-deliver.png",
    description: "I shop from your list, handle pickup, and deliver it to you.",
    paymentRule: "Charge after accepted",
  },
  {
    id: 3,
    name: "Custom Request",
    category: "Main Services",
    price: 20,
    image: "assets/custom-request.png",
    description: "Tell me what you need handled and I will review the request.",
    paymentRule: "Charge after accepted",
  },
  {
    id: 4,
    name: "Holiday & After-Hours Service",
    category: "Add-ons",
    price: 10,
    image: "assets/after-hours.png",
    description: "For evenings, weekends, holidays, or flexible scheduling needs.",
    paymentRule: "Added after approval",
  },
  {
    id: 5,
    name: "Additional Stop",
    category: "Add-ons",
    price: 5,
    image: "assets/additional-stop.png",
    description: "Add one extra stop between pickup and final delivery.",
    paymentRule: "Added after approval",
  },
  {
    id: 6,
    name: "Service Area Tier 1",
    category: "Service Areas",
    price: 10,
    image: "assets/tier-1.png",
    description: "1-15 miles from Burlington.",
    paymentRule: "Based on route",
  },
  {
    id: 7,
    name: "Service Area Tier 2",
    category: "Service Areas",
    price: 15,
    image: "assets/tier-2.png",
    description: "16-25 miles from Burlington.",
    paymentRule: "Based on route",
  },
  {
    id: 8,
    name: "Service Area Tier 3",
    category: "Service Areas",
    price: 20,
    image: "assets/tier-3.png",
    description: "26-35 miles from Burlington.",
    paymentRule: "Based on route",
  },
  {
    id: 9,
    name: "Service Area Tier 4",
    category: "Service Areas",
    price: 30,
    image: "assets/tier-4.png",
    description: "36-45 miles from Burlington.",
    paymentRule: "Based on route",
  },
];

const requests = [
  {
    id: "HG-1042",
    customer: "Alicia M.",
    phone: "(319) 555-0142",
    items: "Shop & Deliver, Tier 1, optional tip pending",
    pickup: "Hy-Vee, 3140 Agency St, Burlington, IA",
    dropoff: "West Burlington, IA",
    distance: "Admin review pending",
    notes: "Text when shopping starts. Substitute similar brands if needed.",
    shoppingList: ["Milk", "Bread", "Strawberries", "Paper towels"],
    shoppingEstimate: 22.5,
    shoppingPhotos: ["customer-list-photo.jpg"],
    status: "Admin reviewing",
    assignedDriver: "",
    total: 25,
  },
  {
    id: "HG-1043",
    customer: "Devon P.",
    phone: "(319) 555-0198",
    items: "Pickup & Delivery, Additional Stop",
    pickup: "Walmart Supercenter, 324 W Agency Rd, West Burlington, IA",
    dropoff: "Burlington, IA",
    distance: "6 miles estimated",
    notes: "Order is prepaid and should be ready at customer service.",
    status: "Sent to drivers",
    assignedDriver: "Jordan",
    total: 15,
  },
  {
    id: "HG-1044",
    customer: "Marissa J.",
    phone: "(319) 555-0167",
    items: "Custom Request, After-Hours Service, Tier 2",
    pickup: "Downtown Burlington, IA",
    dropoff: "Mediapolis, IA",
    distance: "22 miles estimated",
    notes: "Call customer before leaving pickup location.",
    status: "Available",
    assignedDriver: "",
    total: 45,
  },
];

const dispatchRows = [
  ["Admin approval", "Review request, route, discounts, and service tier."],
  ["Auto-fill job", "Customer request info becomes the driver job card after acceptance."],
  ["Send offer", "After admin accepts the request, scheduled drivers receive the available job through Microsoft Teams."],
  ["First accept wins", "The first scheduled driver to accept is assigned automatically and triggers the customer charge."],
];

const defaultDiscounts = [
  { code: "NIGHT50", label: "Tonight-only flash sale", type: "percent", amount: 50, status: "Active" },
  { code: "NEW10", label: "New customer", type: "fixed", amount: 10, status: "Active" },
  { code: "BUSYDAY", label: "Busy day promo", type: "percent", amount: 10, status: "Draft" },
  { code: "CARE5", label: "Care credit", type: "fixed", amount: 5, status: "Active" },
];

const driverTracking = [
  {
    driver: "Jordan",
    job: "HG-1043",
    status: "On route",
    lastLocation: "Agency Rd, West Burlington, IA",
    routeMiles: 6,
    note: "Tracked for tax records",
  },
  {
    driver: "Taylor",
    job: "HG-1044",
    status: "Available after 5:30 PM",
    lastLocation: "Burlington, IA",
    routeMiles: 22,
    note: "Mileage built into pay",
  },
  {
    driver: "Morgan",
    job: "No active job",
    status: "Scheduled",
    lastLocation: "Location permission pending",
    routeMiles: 0,
    note: "No miles logged",
  },
];

const driverPayRecords = [
  { driver: "Jordan", job: "HG-1043", serviceFee: 15, driverShare: 6, tips: 5, status: "Payroll pending" },
  { driver: "Taylor", job: "HG-1044", serviceFee: 45, driverShare: 18, tips: 8, status: "Payroll pending" },
  { driver: "Jordan", job: "HG-1038", serviceFee: 25, driverShare: 10, tips: 3, status: "Recorded" },
];

const pastJobs = [
  { driver: "Jordan", job: "HG-1038", service: "Shop & Deliver", mileage: "8 miles", completed: "Yesterday", proof: "Receipt and drop-off photo saved" },
  { driver: "Jordan", job: "HG-1032", service: "Pickup & Delivery", mileage: "4 miles", completed: "Monday", proof: "Handed to customer with code" },
  { driver: "Taylor", job: "HG-1034", service: "Custom Request", mileage: "18 miles", completed: "Tuesday", proof: "Drop-off photo saved" },
];

const tipRequests = [
  { driver: "Jordan", date: "Today", amount: 8, status: "Requested for review" },
  { driver: "Taylor", date: "Today", amount: 8, status: "Not requested" },
];

const payrollNotes = [
  ["ADP replaces Gusto", "Use ADP for payroll, timekeeping, employee records, tax filings, and W-2 payroll support."],
  ["Xero stays", "Xero is the accounting hub. ADP should connect to Xero, not replace it."],
  ["Recommended worker setup", "Use W-2 employees when you train, schedule, manage standards, and have people represent the brand."],
  ["Compensation draft", "Employees earn 40% of the service fee for completed work and keep 100% of customer tips."],
  ["Mileage", "Mileage is built into the compensation structure unless you later choose a separate reimbursement policy."],
  ["Payroll mapping", "Map regular wages, overtime, and daily pay to Wages & Salaries or Payroll Expenses in Xero."],
];

const communicationOptions = [
  ["Microsoft Teams", "Team communication, dispatch messages, driver updates, announcements, and training channels."],
  ["Outlook Calendar", "Driver availability, scheduled shifts, time-off blocks, and request windows."],
  ["Microsoft Forms", "Internal checklists, onboarding, incident reports, and customer follow-up forms."],
  ["OneDrive / SharePoint", "Employee handbook, policies, training files, and business documents."],
];

const policyNotes = [
  ["Payment timing", "Customers submit a request first. Payment is authorized through Stripe and charged only after a dispatched driver accepts the job."],
  ["Order assignment", "Admin reviews and accepts the request, then it is sent to scheduled drivers. The first scheduled driver who accepts gets the job."],
  ["Driver details", "Customer request info auto-fills into the driver job card after admin approval."],
  ["Shopping refunds", "If the shopper has not left, service fee and shopping estimate can be refunded. Once the shopper arrives, the service fee is non-refundable."],
  ["Unused shopping estimate", "Any unspent shopping estimate is refunded to the original payment method after the order is finalized."],
  ["Custom requests", "Custom request service fees are non-refundable once accepted, unless otherwise required by law."],
  ["Tips", "Tips are voluntary and 100% paid to the employee who completes the service."],
];

const cart = new Map();
let acceptedDriverJob = null;
const productGrid = document.querySelector("#productGrid");
const productCount = document.querySelector("#productCount");
const categoryFilter = document.querySelector("#categoryFilter");
const searchInput = document.querySelector("#searchInput");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartCount = document.querySelector("#cartCount");
const enableNotifications = document.querySelector("#enableNotifications");
const roleNavItems = document.querySelectorAll("[data-role-nav]");
const staffLoginToggle = document.querySelector("#staffLoginToggle");
const staffLoginPanel = document.querySelector("#staffLoginPanel");
const customerLoginForm = document.querySelector("#customerLoginForm");
const customerLoginHeading = document.querySelector("#customerLoginHeading");
const customerLoginSubheading = document.querySelector("#customerLoginSubheading");
const customerLoginModeToggle = document.querySelector("#customerLoginModeToggle");
const customerLoginSubmit = document.querySelector("#customerLoginSubmit");
const customerLoginName = document.querySelector("#customerLoginName");
const customerLoginPhone = document.querySelector("#customerLoginPhone");
const customerLoginEmail = document.querySelector("#customerLoginEmail");
const customerLoginLookup = document.querySelector("#customerLoginLookup");
const customerLoginContact = document.querySelector("#customerLoginContact");
const customerContactLabel = document.querySelector("#customerContactLabel");
const customerLoginPasswordConfirm = document.querySelector("#customerLoginPasswordConfirm");
const customerVerificationPanel = document.querySelector("#customerVerificationPanel");
const customerVerificationMessage = document.querySelector("#customerVerificationMessage");
const customerVerificationCode = document.querySelector("#customerVerificationCode");
const customerLoginStatus = document.querySelector("#customerLoginStatus");
const driverRoleLoginForm = document.querySelector("#driverRoleLoginForm");
const driverRoleLoginName = document.querySelector("#driverRoleLoginName");
const driverRoleAccessCode = document.querySelector("#driverRoleAccessCode");
const driverRoleLoginStatus = document.querySelector("#driverRoleLoginStatus");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminLoginName = document.querySelector("#adminLoginName");
const adminAccessCode = document.querySelector("#adminAccessCode");
const adminLoginStatus = document.querySelector("#adminLoginStatus");
const shoppingHoldTotal = document.querySelector("#shoppingHoldTotal");
const tipInput = document.querySelector("#tipInput");
const discountInput = document.querySelector("#discountInput");
const discountTotal = document.querySelector("#discountTotal");
const discountForm = document.querySelector("#discountForm");
const discountCode = document.querySelector("#discountCode");
const discountLabel = document.querySelector("#discountLabel");
const discountType = document.querySelector("#discountType");
const discountAmount = document.querySelector("#discountAmount");
const checkoutButton = document.querySelector("#checkoutButton");
const checkoutStatus = document.querySelector("#checkoutStatus");
const requestValidation = document.querySelector("#requestValidation");
const shopDetailsPanel = document.querySelector("#shopDetailsPanel");
const shoppingListInput = document.querySelector("#shoppingListInput");
const shoppingPhotoInput = document.querySelector("#shoppingPhotoInput");
const estimateShoppingButton = document.querySelector("#estimateShoppingButton");
const shoppingEstimate = document.querySelector("#shoppingEstimate");
const termsAccepted = document.querySelector("#termsAccepted");
const profileForm = document.querySelector("#profileForm");
const profileStatus = document.querySelector("#profileStatus");
const requestProfile = document.querySelector("#requestProfile");
const checkoutCarryover = document.querySelector("#checkoutCarryover");
const profileFields = {
  name: document.querySelector("#customerName"),
  phone: document.querySelector("#customerPhone"),
  email: document.querySelector("#customerEmail"),
  pickupAddress: document.querySelector("#pickupAddress"),
  deliveryAddress: document.querySelector("#deliveryAddress"),
  notes: document.querySelector("#customerNotes"),
};
const availabilityForm = document.querySelector("#availabilityForm");
const employeeLogin = document.querySelector("#employeeLogin");
const employeePrivate = document.querySelector("#employeePrivate");
const employeeLoginForm = document.querySelector("#employeeLoginForm");
const employeeLoginName = document.querySelector("#employeeLoginName");
const employeeAccessCode = document.querySelector("#employeeAccessCode");
const employeeLoginStatus = document.querySelector("#employeeLoginStatus");
const employeeLogout = document.querySelector("#employeeLogout");
const availabilityFields = {
  name: document.querySelector("#availabilityName"),
  days: document.querySelector("#availabilityDays"),
  start: document.querySelector("#availabilityStart"),
  end: document.querySelector("#availabilityEnd"),
  notes: document.querySelector("#availabilityNotes"),
};
const completionForm = document.querySelector("#completionForm");
const handedToCustomer = document.querySelector("#handedToCustomer");
const dropoffPhoto = document.querySelector("#dropoffPhoto");
const receiptPhoto = document.querySelector("#receiptPhoto");
const receiptPhotoField = document.querySelector("#receiptPhotoField");
const completionStatus = document.querySelector("#completionStatus");

let discounts = loadDiscounts();
let customerProfile = loadProfile();
let customerAccounts = loadCustomerAccounts();
let employeeAvailability = loadAvailability();
let currentEmployee = localStorage.getItem("hopesGoCurrentEmployee") || "";
let currentRole = localStorage.getItem("hopesGoCurrentRole") || "";
let shoppingEstimateTotal = 0;
let tipStepSeen = false;
let customerLoginMode = "signup";
let pendingCustomerVerification = null;

const averageItemPrices = {
  milk: 4.25,
  bread: 3.25,
  eggs: 4.5,
  cheese: 4.75,
  strawberries: 4.5,
  bananas: 2,
  apples: 5,
  chicken: 9,
  beef: 11,
  cereal: 5,
  water: 5.5,
  "paper towels": 8,
  detergent: 13,
  default: 4,
};

const approvedDriverLogins = [
  { username: "hope_go", name: "Hope Driver", code: "Driver18909!" },
];

const approvedAdminLogins = [
  { username: "hope_go", name: "Hope", code: "Admin18909!" },
];

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function renderCategories() {
  const categories = [...new Set(services.map((service) => service.category))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });
}

function renderServices() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const filtered = services.filter((service) => {
    const searchable = [service.name, service.category, service.description].join(" ").toLowerCase();
    const matchesSearch = searchable.includes(search);
    const matchesCategory = category === "all" || service.category === category;
    return matchesSearch && matchesCategory;
  });

  productCount.textContent = `${filtered.length} services`;
  productGrid.innerHTML = filtered
    .map(
      (service) => {
        const needsMainService = service.category !== "Main Services" && !hasMainService();
        return `
        <article class="product-card ${needsMainService ? "locked-card" : ""}">
          <img class="product-art" src="${service.image}" alt="${service.name}" />
          <div class="product-body">
            <div class="product-meta">
              <span>${service.category}</span>
              <span>${service.paymentRule}</span>
            </div>
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="product-footer">
              <strong>${service.price ? money(service.price) : "Customer chooses"}</strong>
              <button type="button" data-add="${service.id}" ${needsMainService ? "disabled" : ""}>
                ${needsMainService ? "Choose main first" : "Add"}
              </button>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");
}

function hasMainService() {
  return [...cart.values()].some((item) => item.service.category === "Main Services");
}

function renderCart() {
  const entries = [...cart.values()];
  const totals = getCartTotals();

  if (cartCount) {
    cartCount.textContent = totals.totalItems;
  }
  discountTotal.textContent = `-${money(totals.discount)}`;
  shoppingHoldTotal.textContent = money(totals.shoppingHold);
  cartTotal.textContent = money(totals.total);
  renderRequestValidation();
  renderShopDetailsVisibility();
  renderCheckoutCarryover();

  if (!entries.length) {
    cartItems.className = "empty-state";
    cartItems.textContent = "No services selected yet.";
    return;
  }

  cartItems.className = "";
  cartItems.innerHTML = entries
    .map(
      ({ service, quantity }) => `
        <div class="cart-line">
          <span>${service.name} x${quantity}</span>
          <div class="cart-line-actions">
            <strong>${money(service.price * quantity)}</strong>
            <button type="button" data-remove-one="${service.id}" aria-label="Remove one ${service.name}">-</button>
            <button type="button" data-remove-all="${service.id}" aria-label="Remove ${service.name}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");
}

function getCartTotals() {
  const entries = [...cart.values()];
  const tip = Number(tipInput.value || 0);
  const totalItems = entries.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = entries.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const discount = getDiscount(subtotal);
  const shoppingHold = selectedShopAndDeliver() ? getShoppingHoldTotal() : 0;
  return {
    totalItems,
    subtotal,
    discount,
    tip,
    shoppingHold,
    total: Math.max(subtotal - discount, 0) + tip + shoppingHold,
  };
}

function selectedShopAndDeliver() {
  return [...cart.values()].some((item) => item.service.name === "Shop & Deliver");
}

function parseShoppingItems() {
  return shoppingListInput.value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function estimateItemPrice(item) {
  const normalized = item.toLowerCase();
  const match = Object.keys(averageItemPrices).find((key) => normalized.includes(key));
  return averageItemPrices[match] || averageItemPrices.default;
}

function renderShopDetailsVisibility() {
  shopDetailsPanel.classList.toggle("active", selectedShopAndDeliver());
}

function renderShoppingEstimate() {
  const items = parseShoppingItems();
  const photos = [...shoppingPhotoInput.files].map((file) => file.name);
  shoppingEstimateTotal = items.reduce((sum, item) => sum + estimateItemPrice(item), 0);

  if (!items.length && !photos.length) {
    shoppingEstimate.innerHTML = `
      <strong>Shopping estimate</strong>
      <span>Add a list or photo to estimate average item prices.</span>
    `;
    return;
  }

  shoppingEstimate.innerHTML = `
    <strong>${money(getShoppingHoldTotal())} shopping estimate hold</strong>
    <span>${money(shoppingEstimateTotal)} estimated items + ${money(getShoppingCushion())} extra cushion</span>
    <span>${items.length} list items${photos.length ? `, ${photos.length} photo upload(s)` : ""}</span>
    <span>Unused shopping funds are refunded immediately when shopping is completed.</span>
  `;
  renderCart();
}

function getShoppingCushion() {
  if (!shoppingEstimateTotal) return 0;
  return Math.max(5, shoppingEstimateTotal * 0.1);
}

function getShoppingHoldTotal() {
  return shoppingEstimateTotal + getShoppingCushion();
}

function hasServiceArea() {
  return [...cart.values()].some((item) => item.service.category === "Service Areas");
}

function getRequestValidationMessage() {
  if (!cart.size) return "Choose a main service to start.";
  if (!hasMainService()) return "Choose a main service before add-ons or service areas.";

  const deliveryAddress = customerProfile?.deliveryAddress || profileFields.deliveryAddress.value.trim();
  const looksOutsideBaseArea = /west burlington|mediapolis|fort madison|mount pleasant|danville|new london/i.test(
    deliveryAddress
  );

  if (looksOutsideBaseArea && !hasServiceArea()) {
    return "This delivery looks outside the base area. Add the correct service area tier before checkout.";
  }

  return "";
}

function renderRequestValidation() {
  requestValidation.textContent = getRequestValidationMessage();
}

function getCartPayload() {
  const customer = getCurrentCustomer();
  const totals = getCartTotals();
  return {
    items: [...cart.values()].map(({ service, quantity }) => ({
      id: service.id,
      quantity,
    })),
    tip: Number(tipInput.value || 0),
    discountCode: discountInput.value.trim().toUpperCase(),
    customer,
    total: totals.total,
    shopping: {
      items: parseShoppingItems(),
      estimate: shoppingEstimateTotal,
      cushion: getShoppingCushion(),
      holdTotal: selectedShopAndDeliver() ? getShoppingHoldTotal() : 0,
      photos: [...shoppingPhotoInput.files].map((file) => file.name),
    },
  };
}

function getCurrentCustomer() {
  return {
    ...(customerProfile || {}),
    name: profileFields.name.value.trim() || customerProfile?.name || "",
    phone: profileFields.phone.value.trim() || customerProfile?.phone || "",
    email: profileFields.email.value.trim() || customerProfile?.email || "",
    pickupAddress: profileFields.pickupAddress.value.trim() || customerProfile?.pickupAddress || "",
    deliveryAddress: profileFields.deliveryAddress.value.trim() || customerProfile?.deliveryAddress || "",
    notes: profileFields.notes.value.trim() || customerProfile?.notes || "",
  };
}

function renderCheckoutCarryover() {
  const customer = getCurrentCustomer();
  const totals = getCartTotals();
  checkoutCarryover.innerHTML = `
    <strong>${money(totals.total)} will carry to checkout</strong>
    <span>${customer.name || "Customer name needed"} - ${customer.email || "Add email before checkout"}</span>
    <span>${customer.pickupAddress || "Pickup needed"} to ${customer.deliveryAddress || "delivery needed"}</span>
  `;
}

async function enableAppNotifications() {
  if (!("Notification" in window)) {
    return "Alerts are not supported here.";
  }

  if (Notification.permission === "granted") {
    return "Alerts enabled";
  }

  const permission = await Notification.requestPermission();
  return permission === "granted" ? "Alerts enabled" : "Alerts blocked";
}

function sendAppNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) =>
        registration.showNotification(title, {
          body,
          icon: "assets/logo.png",
          badge: "assets/logo.png",
        })
      )
      .catch(() => new Notification(title, { body, icon: "assets/logo.png" }));
    return;
  }

  new Notification(title, { body, icon: "assets/logo.png" });
}

async function textCustomerVerificationCode(phone, code) {
  const response = await fetch("/send-verification-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });

  if (!response.ok) {
    throw new Error("Verification text could not be sent.");
  }
}

async function startStripeCheckout() {
  const payload = getCartPayload();
  if (!payload.items.length) {
    checkoutStatus.textContent = "Choose a main service before checkout.";
    return;
  }

  if (!payload.customer.email) {
    setCustomerPage("customerDetails");
    checkoutStatus.textContent = "Add the customer's email here first so checkout can stay payment-only.";
    return;
  }

  saveProfile(payload.customer);

  if (!tipStepSeen) {
    setCustomerPage("customerTip");
    checkoutStatus.textContent = "Please review the optional tip before checkout.";
    tipStepSeen = true;
    return;
  }

  const validationMessage = getRequestValidationMessage();
  if (validationMessage) {
    checkoutStatus.textContent = validationMessage;
    return;
  }

  if (!termsAccepted.checked) {
    checkoutStatus.textContent = "Please accept the Terms of Service and refund policies before checkout.";
    return;
  }

  checkoutButton.disabled = true;
  checkoutStatus.textContent = "Opening secure Stripe checkout...";
  sendAppNotification("Hope's & Go request", "Your request is opening secure checkout.");

  try {
    const response = await fetch("/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Checkout could not be started.");
    }

    const data = await response.json();
    window.location.href = data.url;
  } catch (error) {
    checkoutStatus.textContent =
      "Stripe checkout needs the app server running. Start it with npm start, then try again.";
    checkoutButton.disabled = false;
  }
}

function loadProfile() {
  const saved = localStorage.getItem("hopesGoCustomerProfile");
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function loadCustomerAccounts() {
  const saved = localStorage.getItem("hopesGoCustomerAccounts");
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveCustomerAccounts() {
  localStorage.setItem("hopesGoCustomerAccounts", JSON.stringify(customerAccounts));
}

function saveProfile(profile) {
  localStorage.setItem("hopesGoCustomerProfile", JSON.stringify(profile));
  customerProfile = profile;
  renderProfile();
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function loadAvailability() {
  const saved = localStorage.getItem("hopesGoEmployeeAvailability");
  if (!saved) {
    return [
      {
        name: "Jordan",
        days: "Monday, Wednesday, Friday",
        start: "09:00",
        end: "17:00",
        notes: "Pickup and delivery, Burlington area",
      },
      {
        name: "Taylor",
        days: "Saturday, Sunday",
        start: "12:00",
        end: "22:00",
        notes: "After-hours and Tier 2 requests",
      },
    ];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveAvailabilityList() {
  localStorage.setItem("hopesGoEmployeeAvailability", JSON.stringify(employeeAvailability));
}

function formatTime(value) {
  if (!value) return "Anytime";
  const [hour, minute] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function renderAvailability() {
  const employeeList = document.querySelector("#employeeAvailabilityList");
  const adminList = document.querySelector("#adminAvailabilityBoard");
  const markup = employeeAvailability
    .map(
      (entry) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${entry.name}</strong>
            <span class="pill">Available</span>
          </div>
          <p>${entry.days}</p>
          <p>${formatTime(entry.start)} - ${formatTime(entry.end)}</p>
          <p>${entry.notes || "No notes added."}</p>
        </div>
      `
    )
    .join("");

  employeeList.innerHTML = markup || `<div class="empty-state">No availability saved yet.</div>`;
  adminList.innerHTML = markup || `<div class="empty-state">No driver availability submitted yet.</div>`;
}

function upsertAvailability(entry) {
  const index = employeeAvailability.findIndex((item) => item.name.toLowerCase() === entry.name.toLowerCase());
  if (index >= 0) {
    employeeAvailability[index] = entry;
  } else {
    employeeAvailability.unshift(entry);
  }
  saveAvailabilityList();
  renderAvailability();
}

function renderProfile() {
  if (!customerProfile) {
    profileStatus.textContent = "Not saved";
    requestProfile.innerHTML = `
      <strong>Profile details</strong>
      <span>Save a customer profile to prefill each order.</span>
    `;
    return;
  }

  Object.entries(profileFields).forEach(([key, field]) => {
    field.value = customerProfile[key] || "";
  });
  profileStatus.textContent = "Saved";
  requestProfile.innerHTML = `
    <strong>${customerProfile.name || "Saved customer"}</strong>
    <span>${customerProfile.phone || "No phone"} - ${customerProfile.email || "No email"}</span>
    <span>Pickup: ${customerProfile.pickupAddress || "Add pickup when ordering"}</span>
    <span>Delivery: ${customerProfile.deliveryAddress || "Add delivery when ordering"}</span>
  `;
}

function getDiscount(subtotal) {
  const code = discountInput.value.trim().toUpperCase();
  const discount = discounts.find((item) => item.status === "Active" && item.code === code);
  if (!discount) return 0;
  if (discount.type === "percent") return subtotal * (discount.amount / 100);
  return Math.min(discount.amount, subtotal);
}

function formatDiscountValue(discount) {
  return discount.type === "percent" ? `${discount.amount}% off` : `${money(discount.amount)} off`;
}

function loadDiscounts() {
  const saved = localStorage.getItem("hopesGoDiscounts");
  if (!saved) return defaultDiscounts;

  try {
    return JSON.parse(saved);
  } catch {
    return defaultDiscounts;
  }
}

function saveDiscounts() {
  localStorage.setItem("hopesGoDiscounts", JSON.stringify(discounts));
}

function upsertDiscount(discount) {
  const index = discounts.findIndex((item) => item.code === discount.code);
  if (index >= 0) {
    discounts[index] = discount;
  } else {
    discounts.unshift(discount);
  }
  saveDiscounts();
  renderAdminBoards();
  renderCart();
}

function addToCart(id) {
  const service = services.find((item) => item.id === Number(id));
  if (service.category !== "Main Services" && !hasMainService()) {
    return;
  }
  const current = cart.get(service.id) || { service, quantity: 0 };
  current.quantity += 1;
  cart.set(service.id, current);
  renderCart();
  renderServices();
}

function removeFromCart(id, removeAll = false) {
  const serviceId = Number(id);
  const current = cart.get(serviceId);
  if (!current) return;

  if (removeAll || current.quantity <= 1) {
    cart.delete(serviceId);
  } else {
    current.quantity -= 1;
    cart.set(serviceId, current);
  }

  renderCart();
  renderServices();
}

function mapLink(destination) {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`;
}

function fullRouteLink(job) {
  return `https://maps.apple.com/?saddr=${encodeURIComponent(job.pickup)}&daddr=${encodeURIComponent(
    job.dropoff
  )}`;
}

function renderEmployeeViews() {
  renderEmployeeAccess();
  if (!currentEmployee) return;

  const approvedRequests = requests.filter(
    (request) =>
      request.status !== "Admin reviewing" &&
      (!request.assignedDriver || request.assignedDriver.toLowerCase() === currentEmployee.toLowerCase())
  );

  document.querySelector("#orderQueue").innerHTML = approvedRequests
    .map(
      (request) => `
        <div class="order-card">
          <div class="order-top">
            <strong>${request.id}</strong>
            <span class="pill">${request.status}</span>
          </div>
          <p>${request.items}</p>
          <div class="route-preview">
            <span><strong>Mileage:</strong> ${request.distance}</span>
            <span><strong>Details:</strong> Customer and route info unlock after you accept.</span>
          </div>
          <p class="order-price">${money(request.total)} estimated driver-visible job value</p>
          <button type="button" data-accept-job="${request.id}" ${acceptedDriverJob ? "disabled" : ""}>
            ${acceptedDriverJob ? "Finish current job first" : "Accept driver job"}
          </button>
        </div>
      `
    )
    .join("");

  document.querySelector("#inventoryAlerts").innerHTML = [
    ["Approved jobs only", "Drivers only see requests after admin validation and dispatch."],
    ["Start after assigned", "Do not begin driving until the accepted job appears in Current Job."],
    ["Customer details", "Pickup, delivery, and customer notes appear after the job is assigned."],
  ]
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">Note</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");

  renderDriverDashboard();
  renderDriverPay();
  renderPastJobs();
}

function renderEmployeeAccess() {
  const isLoggedIn = Boolean(currentEmployee);
  employeeLogin.classList.toggle("hidden", isLoggedIn);
  employeePrivate.classList.toggle("active", isLoggedIn);
  if (isLoggedIn) {
    availabilityFields.name.value = currentEmployee;
  }
}

function renderDriverDashboard() {
  const container = document.querySelector("#driverJobDetails");
  completionForm.classList.toggle("active", Boolean(acceptedDriverJob));

  if (!acceptedDriverJob) {
    container.innerHTML = `
      <div class="empty-state">Accept an available job to see the driver dashboard.</div>
    `;
    return;
  }

  const isShoppingJob = acceptedDriverJob.items.toLowerCase().includes("shop");
  receiptPhotoField.classList.toggle("active", isShoppingJob);

  container.innerHTML = `
    <article class="driver-job-card">
      <div class="driver-job-main">
        <div>
          <span class="pill">Assigned</span>
          <h3>${acceptedDriverJob.id} - ${acceptedDriverJob.customer}</h3>
          <p>${acceptedDriverJob.items}</p>
        </div>
        <strong>${money(acceptedDriverJob.total)}</strong>
      </div>
      <div class="driver-info-grid">
        <div>
          <span>Customer phone</span>
          <strong>${acceptedDriverJob.phone}</strong>
        </div>
        <div>
          <span>Pickup</span>
          <strong>${acceptedDriverJob.pickup}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>${acceptedDriverJob.dropoff}</strong>
        </div>
        <div>
          <span>Estimated drive</span>
          <strong>${acceptedDriverJob.distance}</strong>
        </div>
        <div>
          <span>Notes</span>
          <strong>${acceptedDriverJob.notes}</strong>
        </div>
      </div>
      ${renderDriverShoppingInfo(acceptedDriverJob)}
      <div class="map-actions">
        <a class="primary-action" href="${mapLink(acceptedDriverJob.pickup)}" target="_blank" rel="noreferrer">Open pickup map</a>
        <a class="primary-action" href="${mapLink(acceptedDriverJob.dropoff)}" target="_blank" rel="noreferrer">Open delivery map</a>
        <a class="secondary-map-action" href="${fullRouteLink(acceptedDriverJob)}" target="_blank" rel="noreferrer">Open full route</a>
      </div>
      <p class="payment-note">When the driver accepts this dispatched job, the customer charge can be captured through Stripe.</p>
    </article>
  `;
}

function validateCompletion() {
  if (!acceptedDriverJob) return "No active job to complete.";

  const isShoppingJob = acceptedDriverJob.items.toLowerCase().includes("shop");
  if (isShoppingJob && !receiptPhoto.files.length) {
    return "Shopping orders require a receipt photo.";
  }

  if (!handedToCustomer.checked && !dropoffPhoto.files.length) {
    return "Add a drop-off photo unless the order was handed directly to the customer.";
  }

  return "";
}

function renderDriverShoppingInfo(job) {
  if (!job.shoppingList?.length && !job.shoppingPhotos?.length) return "";

  return `
    <div class="shopping-driver-panel">
      <h3>Shopping request</h3>
      <div class="route-preview">
        <span><strong>Estimated item total:</strong> ${money(job.shoppingEstimate || 0)}</span>
        <span><strong>Text list:</strong> ${(job.shoppingList || []).join(", ") || "No text list"}</span>
        <span><strong>Photo uploads:</strong> ${(job.shoppingPhotos || []).join(", ") || "No photos"}</span>
      </div>
    </div>
  `;
}

function renderDriverPay() {
  const records = driverPayRecords.filter((record) => record.driver.toLowerCase() === currentEmployee.toLowerCase());
  const servicePay = records.reduce((sum, record) => sum + record.driverShare, 0);
  const tips = records.reduce((sum, record) => sum + record.tips, 0);
  const container = document.querySelector("#driverPayDetails");

  container.innerHTML = `
    <div class="pay-summary">
      <article><span>Payroll earnings</span><strong>${money(servicePay)}</strong></article>
      <article><span>Tips recorded</span><strong>${money(tips)}</strong></article>
      <article><span>Total recorded</span><strong>${money(servicePay + tips)}</strong></article>
    </div>
    <p class="payment-note">This page is for tracking only. Employees are paid through payroll; there is no cashout button.</p>
    ${records
      .map(
        (record) => `
          <div class="alert-card">
            <div class="alert-top">
              <strong>${record.job}</strong>
              <span class="pill">${record.status}</span>
            </div>
            <p>Service pay: ${money(record.driverShare)} from ${money(record.serviceFee)} service fee</p>
            <p>Tips: ${money(record.tips)}</p>
          </div>
        `
      )
      .join("")}
    <button class="checkout-button" type="button">Request today's tips</button>
  `;
}

function renderPastJobs() {
  const jobs = pastJobs.filter((job) => job.driver.toLowerCase() === currentEmployee.toLowerCase());
  document.querySelector("#driverPastJobsList").innerHTML =
    jobs
      .map(
        (job) => `
          <div class="alert-card">
            <div class="alert-top">
              <strong>${job.job} - ${job.service}</strong>
              <span class="pill">${job.completed}</span>
            </div>
            <p>Mileage: ${job.mileage}</p>
            <p>${job.proof}</p>
          </div>
        `
      )
      .join("") || `<div class="empty-state">No past jobs yet.</div>`;
}

function renderAdminProducts() {
  document.querySelector("#adminProducts").innerHTML = services
    .map(
      (service) => `
        <tr>
          <td>${service.name}</td>
          <td>${service.category}</td>
          <td>${service.price ? money(service.price) : "Customer chooses"}</td>
          <td>${service.paymentRule}</td>
          <td><span class="pill">Active</span></td>
        </tr>
      `
    )
    .join("");
}

function renderAdminBoards() {
  document.querySelector("#dispatchBoard").innerHTML = dispatchRows
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">Dispatch</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");

  document.querySelector("#discountBoard").innerHTML = discounts
    .map(
      (discount) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${discount.code}</strong>
            <span class="pill">${discount.status}</span>
          </div>
          <p>${discount.label} - ${formatDiscountValue(discount)}</p>
          <button type="button" data-toggle-discount="${discount.code}">
            ${discount.status === "Active" ? "Pause discount" : "Activate discount"}
          </button>
        </div>
      `
    )
    .join("");

  document.querySelector("#driverTrackingBoard").innerHTML = driverTracking
    .map(
      (driver) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${driver.driver} - ${driver.job}</strong>
            <span class="pill">${driver.status}</span>
          </div>
          <p>Last location: ${driver.lastLocation}</p>
          <p>Miles: ${driver.routeMiles} - ${driver.note}</p>
        </div>
      `
    )
    .join("");

  const totalMiles = driverTracking.reduce((sum, driver) => sum + driver.routeMiles, 0);
  document.querySelector("#mileageSummary").innerHTML = `
    <div class="integration-list">
      <div><strong>${totalMiles} miles logged</strong><span>Admin-visible total for current driver jobs.</span></div>
      <div><strong>Tax records</strong><span>Track driver, job ID, date, pickup, delivery, mileage, and pay details for Xero/accountant review.</span></div>
      <div><strong>Location consent</strong><span>Real phone GPS tracking should require driver permission and clear employee policy language.</span></div>
    </div>
  `;

  const payrollByDriver = driverPayRecords.reduce((totals, record) => {
    totals[record.driver] ||= { servicePay: 0, tips: 0 };
    totals[record.driver].servicePay += record.driverShare;
    totals[record.driver].tips += record.tips;
    return totals;
  }, {});

  document.querySelector("#adminPayBoard").innerHTML = Object.entries(payrollByDriver)
    .map(
      ([driver, totals]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${driver}</strong>
            <span class="pill">Payroll</span>
          </div>
          <p>Send to payroll: ${money(totals.servicePay)}</p>
          <p>Tips owed: ${money(totals.tips)}</p>
          <p>Total driver record: ${money(totals.servicePay + totals.tips)}</p>
        </div>
      `
    )
    .join("");

  document.querySelector("#adminTipRequests").innerHTML = tipRequests
    .map(
      (request) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${request.driver} - ${money(request.amount)}</strong>
            <span class="pill">${request.status}</span>
          </div>
          <p>${request.date}</p>
        </div>
      `
    )
    .join("");

  document.querySelector("#payrollBoard").innerHTML = payrollNotes
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">HR</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");

  document.querySelector("#communicationBoard").innerHTML = communicationOptions
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">Team</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");

  document.querySelector("#policyBoard").innerHTML = policyNotes
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">Policy</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");
}

function setActiveView(viewId) {
  if (viewId !== "login" && !canAccessView(viewId)) {
    viewId = "login";
  }

  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document
    .querySelectorAll("[data-view-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.viewLink === viewId));
  window.location.hash = viewId;
  renderRoleNavigation();
}

function canAccessView(viewId) {
  if (viewId === "storefront") return currentRole === "customer";
  if (viewId === "employee") return currentRole === "driver";
  if (viewId === "admin") return currentRole === "admin";
  return true;
}

function setRole(role) {
  currentRole = role;
  localStorage.setItem("hopesGoCurrentRole", role);
  renderRoleNavigation();
}

function renderRoleNavigation() {
  roleNavItems.forEach((item) => {
    item.classList.toggle("visible", item.dataset.roleNav === currentRole);
  });
}

function setCustomerLoginMode(mode) {
  customerLoginMode = mode;
  pendingCustomerVerification = null;
  customerVerificationPanel.classList.remove("active");
  customerVerificationPanel.setAttribute("aria-hidden", "true");
  customerVerificationCode.required = false;
  customerVerificationCode.value = "";
  customerLoginStatus.textContent = "";
  customerLoginForm.classList.toggle("login-mode", mode === "login");

  if (mode === "login") {
    customerLoginHeading.textContent = "Log in";
    customerLoginSubheading.textContent = "or";
    customerLoginModeToggle.textContent = "Create account";
    customerLoginSubmit.textContent = "Log in";
    customerContactLabel.textContent = "Password";
    customerLoginContact.placeholder = "Password";
    customerLoginName.required = false;
    customerLoginPhone.required = false;
    customerLoginEmail.required = false;
    customerLoginLookup.required = true;
    customerLoginPasswordConfirm.required = false;
  } else {
    customerLoginHeading.textContent = "Create an account";
    customerLoginSubheading.textContent = "or";
    customerLoginModeToggle.textContent = "Log in";
    customerLoginSubmit.textContent = "Create account";
    customerContactLabel.textContent = "Password";
    customerLoginContact.placeholder = "Create password";
    customerLoginName.required = true;
    customerLoginPhone.required = true;
    customerLoginEmail.required = true;
    customerLoginLookup.required = false;
    customerLoginLookup.value = "";
    customerLoginPasswordConfirm.required = true;
  }
}

function setDriverPage(pageId) {
  document.querySelectorAll(".driver-page").forEach((page) => page.classList.toggle("active", page.id === pageId));
  document
    .querySelectorAll("[data-driver-page-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.driverPageLink === pageId));
}

function setCustomerPage(pageId) {
  document
    .querySelectorAll("[data-customer-page-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.customerPageLink === pageId));
}

function setAdminPage(pageId) {
  document.querySelectorAll(".admin-page").forEach((page) => page.classList.toggle("active", page.id === pageId));
  document
    .querySelectorAll("[data-admin-page-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.adminPageLink === pageId));
}

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    addToCart(addButton.dataset.add);
  }

  const removeOneButton = event.target.closest("[data-remove-one]");
  if (removeOneButton) {
    removeFromCart(removeOneButton.dataset.removeOne);
  }

  const removeAllButton = event.target.closest("[data-remove-all]");
  if (removeAllButton) {
    removeFromCart(removeAllButton.dataset.removeAll, true);
  }

  const viewLink = event.target.closest("[data-view-link]");
  if (viewLink) {
    setActiveView(viewLink.dataset.viewLink);
  }

  const driverPageLink = event.target.closest("[data-driver-page-link]");
  if (driverPageLink) {
    setDriverPage(driverPageLink.dataset.driverPageLink);
  }

  const customerPageLink = event.target.closest("[data-customer-page-link]");
  if (customerPageLink) {
    setCustomerPage(customerPageLink.dataset.customerPageLink);
    if (customerPageLink.dataset.customerPageLink === "customerTip") {
      tipStepSeen = true;
    }
  }

  const adminPageLink = event.target.closest("[data-admin-page-link]");
  if (adminPageLink) {
    setAdminPage(adminPageLink.dataset.adminPageLink);
  }

  const toggleButton = event.target.closest("[data-toggle-discount]");
  if (toggleButton) {
    const code = toggleButton.dataset.toggleDiscount;
    discounts = discounts.map((discount) =>
      discount.code === code
        ? { ...discount, status: discount.status === "Active" ? "Paused" : "Active" }
        : discount
    );
    saveDiscounts();
    renderAdminBoards();
    renderCart();
  }

  const acceptButton = event.target.closest("[data-accept-job]");
  if (acceptButton) {
    if (acceptedDriverJob) {
      setDriverPage("driverCurrentJob");
      return;
    }
    acceptedDriverJob = requests.find((request) => request.id === acceptButton.dataset.acceptJob);
    acceptedDriverJob.assignedDriver = currentEmployee;
    renderDriverDashboard();
    renderEmployeeViews();
    setDriverPage("driverCurrentJob");
    document.querySelector("#driverDashboard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

});

completionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = validateCompletion();
  if (error) {
    completionStatus.textContent = error;
    return;
  }

  completionStatus.textContent = "Completion proof saved for admin review.";
  acceptedDriverJob = null;
  completionForm.reset();
  renderDriverDashboard();
  renderEmployeeViews();
  setDriverPage("driverHome");
});

employeeLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const driverLogin = approvedDriverLogins.find(
    (login) =>
      login.username.toLowerCase() === employeeLoginName.value.trim().toLowerCase() &&
      login.code === employeeAccessCode.value.trim()
  );
  if (!driverLogin) {
    employeeLoginStatus.textContent = "Driver account not approved.";
    return;
  }
  currentEmployee = driverLogin.name;
  setRole("driver");
  localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
  employeeLoginStatus.textContent = "";
  renderEmployeeViews();
  renderAvailability();
});

employeeLogout.addEventListener("click", () => {
  currentEmployee = "";
  currentRole = "";
  localStorage.removeItem("hopesGoCurrentEmployee");
  localStorage.removeItem("hopesGoCurrentRole");
  renderEmployeeViews();
  setActiveView("login");
});

staffLoginToggle.addEventListener("click", () => {
  const isOpen = staffLoginPanel.classList.toggle("active");
  staffLoginPanel.setAttribute("aria-hidden", String(!isOpen));
  staffLoginToggle.textContent = isOpen ? "Hide Driver/Admin Login" : "Driver/Admin Login";
});

customerLoginModeToggle.addEventListener("click", () => {
  setCustomerLoginMode(customerLoginMode === "signup" ? "login" : "signup");
});

customerLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  customerLoginStatus.textContent = "";

  if (customerLoginMode === "login") {
    const lookup = customerLoginLookup.value.trim().toLowerCase();
    const password = customerLoginContact.value;
    const account = customerAccounts.find(
      (item) => [item.phone.toLowerCase(), item.email.toLowerCase()].includes(lookup) && item.password === password
    );

    if (!account) {
      customerLoginStatus.textContent = "We could not find that customer login.";
      return;
    }

    saveProfile({
      name: account.name,
      phone: account.phone,
      email: account.email,
      pickupAddress: account.pickupAddress || "",
      deliveryAddress: account.deliveryAddress || "",
      notes: account.notes || "",
    });
    setRole("customer");
    setActiveView("storefront");
    return;
  }

  if (pendingCustomerVerification) {
    if (customerVerificationCode.value.trim() !== pendingCustomerVerification.code) {
      customerLoginStatus.textContent = "That verification code does not match.";
      return;
    }

    const account = pendingCustomerVerification.account;
    customerAccounts = customerAccounts.filter(
      (item) => item.email.toLowerCase() !== account.email.toLowerCase() && item.phone !== account.phone
    );
    customerAccounts.push(account);
    saveCustomerAccounts();
    saveProfile({
      name: account.name,
      phone: account.phone,
      email: account.email,
      pickupAddress: "",
      deliveryAddress: "",
      notes: "",
    });
    pendingCustomerVerification = null;
    setRole("customer");
    setActiveView("storefront");
    return;
  }

  const password = customerLoginContact.value;
  const confirmPassword = customerLoginPasswordConfirm.value;
  if (!isStrongPassword(password)) {
    customerLoginStatus.textContent =
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    return;
  }

  if (password !== confirmPassword) {
    customerLoginStatus.textContent = "Passwords must match.";
    return;
  }

  const account = {
    name: customerLoginName.value.trim(),
    phone: customerLoginPhone.value.trim(),
    email: customerLoginEmail.value.trim(),
    password,
  };
  const accountExists = customerAccounts.some(
    (item) => item.email.toLowerCase() === account.email.toLowerCase() || item.phone === account.phone
  );

  if (accountExists) {
    customerLoginStatus.textContent = "That phone or email already has an account. Use Log in instead.";
    return;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  pendingCustomerVerification = { code, account };
  customerVerificationPanel.classList.add("active");
  customerVerificationPanel.setAttribute("aria-hidden", "false");
  customerVerificationCode.required = true;
  customerVerificationCode.focus();
  customerLoginSubmit.textContent = "Verify and create account";
  customerLoginStatus.textContent = "Sending verification code...";

  try {
    await textCustomerVerificationCode(account.phone, code);
    customerVerificationMessage.textContent = `We texted a verification code to ${account.phone}. Enter it here to finish creating your account.`;
    customerLoginStatus.textContent = "Enter the verification code to finish creating your account.";
  } catch {
    customerVerificationMessage.textContent = `Texting is not available yet, so use this test code for now: ${code}.`;
    customerLoginStatus.textContent = "Twilio may still be in review. Use the test code to finish this test account.";
  }
});

driverRoleLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const driverLogin = approvedDriverLogins.find(
    (login) =>
      login.username.toLowerCase() === driverRoleLoginName.value.trim().toLowerCase() &&
      login.code === driverRoleAccessCode.value.trim()
  );
  if (!driverLogin) {
    driverRoleLoginStatus.textContent = "Driver account not approved.";
    return;
  }
  currentEmployee = driverLogin.name;
  localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
  setRole("driver");
  renderEmployeeViews();
  renderAvailability();
  setActiveView("employee");
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const adminLogin = approvedAdminLogins.find(
    (login) =>
      login.username.toLowerCase() === adminLoginName.value.trim().toLowerCase() &&
      login.code === adminAccessCode.value.trim()
  );
  if (!adminLogin) {
    adminLoginStatus.textContent = "Admin account not approved.";
    return;
  }
  localStorage.setItem("hopesGoAdminName", adminLogin.name);
  setRole("admin");
  setActiveView("admin");
});

window.addEventListener("hashchange", () => {
  const id = window.location.hash.replace("#", "");
  if (["login", "storefront", "employee", "admin"].includes(id)) {
    setActiveView(id);
  }
});

searchInput.addEventListener("input", renderServices);
categoryFilter.addEventListener("change", renderServices);
tipInput.addEventListener("input", renderCart);
discountInput.addEventListener("input", renderCart);
checkoutButton.addEventListener("click", startStripeCheckout);
if (enableNotifications) {
  enableNotifications.addEventListener("click", async () => {
    enableNotifications.textContent = await enableAppNotifications();
  });
}
shoppingListInput.addEventListener("input", renderShoppingEstimate);
shoppingPhotoInput.addEventListener("change", renderShoppingEstimate);
estimateShoppingButton.addEventListener("click", renderShoppingEstimate);
discountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertDiscount({
    code: discountCode.value.trim().toUpperCase().replace(/\s+/g, ""),
    label: discountLabel.value.trim(),
    type: discountType.value,
    amount: Number(discountAmount.value),
    status: "Active",
  });
  discountForm.reset();
});
profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveProfile({
    name: profileFields.name.value.trim(),
    phone: profileFields.phone.value.trim(),
    email: profileFields.email.value.trim(),
    pickupAddress: profileFields.pickupAddress.value.trim(),
    deliveryAddress: profileFields.deliveryAddress.value.trim(),
    notes: profileFields.notes.value.trim(),
  });
});
availabilityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertAvailability({
    name: availabilityFields.name.value.trim(),
    days: availabilityFields.days.value.trim(),
    start: availabilityFields.start.value,
    end: availabilityFields.end.value,
    notes: availabilityFields.notes.value.trim(),
  });
  availabilityForm.reset();
});

renderCategories();
renderServices();
renderCart();
renderProfile();
renderEmployeeViews();
renderAdminProducts();
renderAdminBoards();
renderAvailability();
renderRoleNavigation();
setCustomerLoginMode("signup");
setActiveView(window.location.hash.replace("#", "") || "login");
