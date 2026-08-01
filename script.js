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
    name: "Custom Errand",
    category: "Main Services",
    price: 20,
    image: "assets/custom-request.png",
    description: "Tell me what you need handled and I will review the request.",
    paymentRule: "Charge after accepted",
  },
  {
    id: 4,
    name: "Rush Service Add-On",
    category: "Add-ons",
    price: 5,
    image: "assets/rush.png",
    description: "Priority handling for faster pickup and delivery.",
    paymentRule: "Added after approval",
  },
  {
    id: 5,
    name: "Additional Stop Add-On",
    category: "Add-ons",
    price: 3,
    image: "assets/additional-stop.png",
    description: "Added when extra pickup or delivery locations are requested.",
    paymentRule: "Added after approval",
  },
  {
    id: 6,
    name: "Service Area Tier 1",
    category: "Service Areas",
    price: 10,
    image: "assets/tier-1.png",
    description: "6-15 miles from Burlington.",
    paymentRule: "Based on distance from Burlington",
  },
  {
    id: 7,
    name: "Service Area Tier 2",
    category: "Service Areas",
    price: 15,
    image: "assets/tier-2.png",
    description: "16-25 miles from Burlington.",
    paymentRule: "Based on distance from Burlington",
  },
  {
    id: 8,
    name: "Service Area Tier 3",
    category: "Service Areas",
    price: 20,
    image: "assets/tier-3.png",
    description: "26-35 miles from Burlington.",
    paymentRule: "Based on distance from Burlington",
  },
  {
    id: 10,
    name: "After Hours Add-On",
    category: "Add-ons",
    price: 15,
    image: "assets/after-hours.png",
    description: "For service requests outside normal operating hours.",
    paymentRule: "Added after approval",
  },
  {
    id: 11,
    name: "Holiday Add-On",
    category: "Add-ons",
    price: 20,
    image: "assets/holiday.png",
    description: "Starting at $20 when service is requested during Hope's & Go closed holiday hours.",
    paymentRule: "Added after approval",
  },
  {
    id: 12,
    name: "Heavy Item Handling Add-On",
    category: "Add-ons",
    price: 5,
    image: "assets/heavy-item.png",
    description: "Starting at $5 for oversized, bulky, or unusually heavy items. Final pricing may vary.",
    paymentRule: "Final price may vary",
  },
];

const serviceCompletionProfiles = {
  1: {
    typical: "45-75 minutes",
    baselineMinutes: 60,
    historyNames: ["Pickup & Delivery"],
  },
  2: {
    typical: "60-90 minutes",
    baselineMinutes: 75,
    historyNames: ["Shop & Deliver"],
  },
  3: {
    typical: "75-120 minutes",
    baselineMinutes: 90,
    historyNames: ["Custom Errand", "Custom Request"],
  },
};

const customerTestingMode = false;
const adminPreviewFrameMode = new URLSearchParams(window.location.search).has("admin-preview");
if (adminPreviewFrameMode) document.body.classList.add("admin-preview-frame");
const TEST_REQUEST_TTL_MS = 20 * 60 * 1000;
const availabilityDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const availabilityTimeBlocks = [
  { id: "morning", label: "Shift A", time: "8:00 AM - 2:00 PM" },
  { id: "evening", label: "Shift B", time: "2:00 PM - 8:00 PM" },
  { id: "overnight", label: "Shift C", time: "8:00 PM - 12:00 AM" },
];
const availabilityBlockExactTimes = {
  morning: { start: "08:00", end: "14:00" },
  evening: { start: "14:00", end: "20:00" },
  overnight: { start: "20:00", end: "00:00" },
};
const defaultHopeExactTimes = {
  Monday: [{ start: "08:00", end: "17:00" }, { start: "20:30", end: "00:00" }],
  Tuesday: [{ start: "08:00", end: "00:00" }],
  Wednesday: [{ start: "08:00", end: "00:00" }],
  Thursday: [{ start: "08:00", end: "17:00" }, { start: "21:00", end: "00:00" }],
  Friday: [{ start: "08:00", end: "00:00" }],
  Saturday: [{ start: "08:00", end: "00:00" }],
  Sunday: [{ start: "13:00", end: "00:00" }],
};
const quickDriverMessages = [
  "I'm on my way",
  "I've arrived",
  "Running a few minutes behind",
  "Shop completed",
  "Delivery completed",
  "Need additional instructions",
  "Thank you",
];
const POST_DELIVERY_MESSAGE_WINDOW_MS = 60 * 60 * 1000;
const MESSAGE_CHANNEL_CUSTOMER_DRIVER = "customer-driver";
const MESSAGE_CHANNEL_ADMIN_DRIVER = "admin-driver";
const MESSAGE_CHANNEL_ADMIN_CUSTOMER = "admin-customer";
const exportCategories = [
  { id: "drivers", label: "Drivers" },
  { id: "customers", label: "Customers" },
  { id: "requests", label: "Requests" },
  { id: "jobs", label: "Jobs" },
  { id: "mileage", label: "Mileage" },
  { id: "tips", label: "Tips" },
  { id: "payroll", label: "Payroll" },
  { id: "taxRecords", label: "Tax Records" },
  { id: "documents", label: "Documents" },
];
const exportFormats = ["CSV", "XLSX", "PDF"];
const defaultTaxSettings = {
  area: "Burlington, IA / Des Moines County",
  rate: Number(window.HOPES_GO_TAX_RATE ?? 0.07),
};
let requests = loadRequests();
let adminDispatchFilter = "all";
const autoApprovalEngine = window.HopesGoAutoApproval;
let autoApprovalSettings = loadAutoApprovalSettings();
let autoApprovalLog = loadAutoApprovalLog();

const defaultDiscounts = [
  { code: "NIGHT50", label: "Tonight-only flash sale", type: "percent", amount: 50, status: "Active" },
  { code: "NEW10", label: "New customer", type: "fixed", amount: 10, status: "Active" },
  { code: "BUSYDAY", label: "Busy day promo", type: "percent", amount: 10, status: "Draft" },
  { code: "CARE5", label: "Care credit", type: "fixed", amount: 5, status: "Active" },
];

const membershipPlans = [
  {
    id: "community-heroes",
    name: "Community Heroes Membership",
    internalCode: "HEROES_AUTO",
    monthlyPrice: 9.99,
    freePickupMonthly: 2,
    freeShopMonthly: 0,
    freeRushMonthly: 1,
    benefits: [
      "2 free Pickup & Delivery requests every month",
      "10% off additional Pickup & Delivery services",
      "20% off Shop & Deliver services",
      "15% off Custom Request services",
      "Priority scheduling when available",
    ],
  },
  {
    id: "hopes-go-plus",
    name: "Hope's & Go Plus",
    internalCode: "HGPLUS_AUTO",
    monthlyPrice: 14.99,
    freePickupMonthly: 2,
    freeShopMonthly: 0,
    freeRushMonthly: 1,
    benefits: [
      "2 free Pickup & Delivery requests every month",
      "10% off additional Pickup & Delivery services",
      "20% off Shop & Deliver services",
      "15% off Custom Request services",
      "Priority request review",
    ],
  },
  {
    id: "senior-go-plus",
    name: "Senior Go Plus",
    internalCode: "SENIORPLUS_AUTO",
    monthlyPrice: 29.99,
    freePickupMonthly: 5,
    freeShopMonthly: 5,
    freeRushMonthly: 1,
    benefits: [
      "Unlimited prescription pickups",
      "5 free Shop & Deliver requests every month",
      "5 free Pickup & Delivery requests every month",
      "No rush fees",
      "Priority support",
    ],
  },
];

let driverTracking = loadStoredList("hopesGoDriverTracking");
let driverPayRecords = loadStoredList("hopesGoDriverPayRecords");
let pastJobs = loadStoredList("hopesGoPastJobs");
let tipRequests = loadStoredList("hopesGoTipRequests");
let requestMessages = loadStoredList("hopesGoRequestMessages");
let dailyUpdateHistory = loadStoredList("hopesGoDailyUpdateHistory");
let archiveLog = loadStoredList("hopesGoArchiveLog");
let messageCountdownTimer = null;
let driverDemandTimer = null;

const systemLinks = [
  { name: "ADP", use: "Payroll, timekeeping, taxes, and employee records", url: "https://login.adp.com/" },
  { name: "Xero", use: "Accounting, reconciliation, and financial reports", url: "https://login.xero.com/" },
  { name: "Stripe", use: "Checkout, authorizations, and payment capture", url: "https://dashboard.stripe.com/" },
  { name: "Novo", use: "Business banking and cash flow", url: "https://app.novo.co/" },
  { name: "Microsoft Teams", use: "Team communication and driver dispatch messages", url: "https://teams.microsoft.com/" },
  { name: "Outlook Calendar", use: "Driver availability and scheduling", url: "https://outlook.office.com/calendar/" },
  { name: "Mapbox", use: "Address search, location correction, and built-in map previews", url: "https://account.mapbox.com/" },
  { name: "Supabase", use: "Customer, driver, request, and discount database", url: "https://supabase.com/dashboard/" },
  { name: "Twilio", use: "Customer verification texts and request notifications", url: "https://console.twilio.com/" },
];

const integrationSetupItems = [
  ["Mapbox token", "Add MAPBOX_PUBLIC_TOKEN so customer and driver maps can use live address search."],
  ["Supabase keys", "Store customer profiles, discounts, requests, driver logs, and availability in the database."],
  ["Stripe keys", "Use sandbox keys for testing, then live keys for launch."],
  ["Twilio number", "Send verification texts and request alerts after messaging approval is complete."],
  ["Microsoft account", "Use Teams and Outlook Calendar for staff communication and schedule planning."],
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
const storeShell = document.querySelector(".store-shell");
const loginHero = document.querySelector(".login-hero");
const staffLoginToggle = document.querySelector("#staffLoginToggle");
const staffLoginPanel = document.querySelector("#staffLoginPanel");
const globalLogout = document.querySelector("#globalLogout");
const ownerSiteSwitcher = document.querySelector("#ownerSiteSwitcher");
const ownerMenuToggle = document.querySelector("#ownerMenuToggle");
const ownerMenuPanel = document.querySelector("#ownerMenuPanel");
const adminPreviewOpen = document.querySelector("#adminPreviewOpen");
const adminPreviewModal = document.querySelector("#adminPreviewModal");
const adminPreviewClose = document.querySelector("#adminPreviewClose");
const adminPreviewStage = document.querySelector("#adminPreviewStage");
const adminPreviewFrame = document.querySelector("#adminPreviewFrame");
const adminPreviewHelp = document.querySelector("#adminPreviewHelp");
const adminPreviewSizeButtons = document.querySelectorAll("[data-preview-size]");
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
const saveCustomerLogin = document.querySelector("#saveCustomerLogin");
const socialLoginButtons = document.querySelectorAll("[data-social-login]");
const customerLogout = document.querySelector("#customerLogout");
const customerMenuToggle = document.querySelector("#customerMenuToggle");
const customerMenuPanel = document.querySelector("#customerMenuPanel");
const customerMenuMembershipStatus = document.querySelector("#customerMenuMembershipStatus");
const customerCartSummary = document.querySelector("#customerCartSummary");
const customerRunningTotal = document.querySelector("#customerRunningTotal");
const resumeCartTitle = document.querySelector("#resumeCartTitle");
const driverRoleLoginForm = document.querySelector("#driverRoleLoginForm");
const driverRoleLoginName = document.querySelector("#driverRoleLoginName");
const driverRoleAccessCode = document.querySelector("#driverRoleAccessCode");
const driverRoleLoginStatus = document.querySelector("#driverRoleLoginStatus");
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
const customerFlowStatus = document.querySelector("#customerFlowStatus");
const requestValidation = document.querySelector("#requestValidation");
const shopDetailsPanel = document.querySelector("#shopDetailsPanel");
const serviceInfoSummary = document.querySelector("#serviceInfoSummary");
const tipChoiceCard = document.querySelector("#tipChoiceCard");
const tipAmountField = document.querySelector("#tipAmountField");
const applyTipButton = document.querySelector("#applyTipButton");
const shoppingStoreInput = document.querySelector("#shoppingStoreInput");
const shoppingProductSearch = document.querySelector("#shoppingProductSearch");
const shoppingProductSuggestions = document.querySelector("#shoppingProductSuggestions");
const selectedShoppingProductsBoard = document.querySelector("#selectedShoppingProducts");
const shoppingCatalogStatus = document.querySelector("#shoppingCatalogStatus");
const shoppingListInput = document.querySelector("#shoppingListInput");
const shoppingPhotoInput = document.querySelector("#shoppingPhotoInput");
const estimateShoppingButton = document.querySelector("#estimateShoppingButton");
const shoppingEstimate = document.querySelector("#shoppingEstimate");
const shoppingPriceModal = document.querySelector("#shoppingPriceModal");
const shoppingPriceModalBody = document.querySelector("#shoppingPriceModalBody");
const shoppingPriceModalClose = document.querySelector("#shoppingPriceModalClose");
const shoppingPriceModalDone = document.querySelector("#shoppingPriceModalDone");
const customerPageHelpButton = document.querySelector("#customerPageHelpButton");
const customerHelpModal = document.querySelector("#customerHelpModal");
const customerHelpClose = document.querySelector("#customerHelpClose");
const customerHelpDone = document.querySelector("#customerHelpDone");
const customerHelpTitle = document.querySelector("#customerHelpTitle");
const customerHelpBody = document.querySelector("#customerHelpBody");
const termsAccepted = document.querySelector("#termsAccepted");
const profileForm = document.querySelector("#profileForm");
const profileStatus = document.querySelector("#profileStatus");
const customerInfoSavedSummary = document.querySelector("#customerInfoSavedSummary");
const requestProfile = document.querySelector("#requestProfile");
const checkoutOrderCard = document.querySelector("#checkoutOrderCard");
const checkoutCarryover = document.querySelector("#checkoutCarryover");
const checkoutPickupCard = document.querySelector("#checkoutPickupCard");
const checkoutDropoffCard = document.querySelector("#checkoutDropoffCard");
const checkoutPaymentSummary = document.querySelector("#checkoutPaymentSummary");
const checkoutPaymentNotice = document.querySelector("#checkoutPaymentNotice");
const deliveryPinCard = document.querySelector("#deliveryPinCard");
const embeddedCheckoutShell = document.querySelector("#embeddedCheckoutShell");
const embeddedCheckout = document.querySelector("#embeddedCheckout");
const embeddedCheckoutTotal = document.querySelector("#embeddedCheckoutTotal");
const customerStepEyebrow = document.querySelector("#customerStepEyebrow");
const customerStepTitle = document.querySelector("#customerStepTitle");
const customerNextButtons = document.querySelectorAll("[data-customer-next]");
const customerBackButtons = document.querySelectorAll("[data-customer-back]");
const openMembershipsButton = document.querySelector("#openMembershipsButton");
const closeMembershipsButton = document.querySelector("#closeMembershipsButton");
const membershipPage = document.querySelector("#membershipPage");
const membershipDashboard = document.querySelector("#membershipDashboard");
const membershipStatus = document.querySelector("#membershipStatus");
const membershipCheckoutShell = document.querySelector("#membershipCheckoutShell");
const membershipEmbeddedCheckout = document.querySelector("#membershipEmbeddedCheckout");
const membershipCheckoutTitle = document.querySelector("#membershipCheckoutTitle");
const startRequestButton = document.querySelector("#startRequestButton");
const customerServiceAvailability = document.querySelector("#customerServiceAvailability");
const availabilityGateModal = document.querySelector("#availabilityGateModal");
const availabilityGateClose = document.querySelector("#availabilityGateClose");
const resumeCartButton = document.querySelector("#resumeCartButton");
const resumeCartCount = document.querySelector("#resumeCartCount");
const resumeCartStep = document.querySelector("#resumeCartStep");
const runDailyUpdateButton = document.querySelector("#runDailyUpdateButton");
const dailyUpdateBoard = document.querySelector("#dailyUpdateBoard");
const dailyUpdateStamp = document.querySelector("#dailyUpdateStamp");
const dailyUpdateStatus = document.querySelector("#dailyUpdateStatus");
const dailyUpdateToast = document.querySelector("#dailyUpdateToast");
const archiveLogBoard = document.querySelector("#archiveLogBoard");
const locationSuggestionList = document.querySelector("#locationSuggestions");
const pickupAddressSuggestions = document.querySelector("#pickupAddressSuggestions");
const deliveryAddressSuggestions = document.querySelector("#deliveryAddressSuggestions");
const deliveryServiceAreaWarning = document.querySelector("#deliveryServiceAreaWarning");
const customerMapPreview = document.querySelector("#customerMapPreview");
const customerMapStatus = document.querySelector("#customerMapStatus");
const customerMapCanvas = document.querySelector("#customerMapCanvas");
const profileFields = {
  name: document.querySelector("#customerName"),
  phone: document.querySelector("#customerPhone"),
  email: document.querySelector("#customerEmail"),
  pickupAddress: document.querySelector("#pickupAddress"),
  deliveryAddress: document.querySelector("#deliveryAddress"),
  pickupInstructions: document.querySelector("#pickupInstructions"),
  dropoffInstructions: document.querySelector("#dropoffInstructions"),
  notes: document.querySelector("#customerNotes"),
};
const deliveryMethodInputs = document.querySelectorAll("[name='deliveryMethod']");
const additionalStopDetails = document.querySelector("#additionalStopDetails");
const additionalStopAddress = document.querySelector("#additionalStopAddress");
const additionalStopNotes = document.querySelector("#additionalStopNotes");
const additionalStopAddressSuggestions = document.querySelector("#additionalStopAddressSuggestions");
const selectedRequestLocations = {
  pickup: { address: "", coordinates: null, verified: false },
  dropoff: { address: "", coordinates: null, verified: false },
  additionalStop: { address: "", coordinates: null, verified: false },
};
const BURLINGTON_REFERENCE_COORDINATES = [-91.1129, 40.8075];
const INCLUDED_SERVICE_RADIUS_MILES = 5;
const serviceAreaDistanceTiers = [
  { serviceId: 6, tier: 1, minExclusive: 5, maxInclusive: 15 },
  { serviceId: 7, tier: 2, minExclusive: 15, maxInclusive: 25 },
  { serviceId: 8, tier: 3, minExclusive: 25, maxInclusive: 35 },
];
const availabilityForm = document.querySelector("#availabilityForm");
const availabilityBuilder = document.querySelector("#availabilityBuilder");
const updateAvailabilityButton = document.querySelector("#updateAvailabilityButton");
const driverAutomaticSchedule = document.querySelector("#driverAutomaticSchedule");
const driverManualAvailabilityArea = document.querySelector("#driverManualAvailabilityArea");
const availabilityEditorIntro = document.querySelector("#availabilityEditorIntro");
const driverAvailabilitySummary = document.querySelector("#driverAvailabilitySummary");
const driverAvailabilityHistory = document.querySelector("#driverAvailabilityHistory");
const monthlyActivityInsights = document.querySelector("#monthlyActivityInsights");
const driverMessagesPanel = document.querySelector("#driverMessagesPanel");
const driverMessageBadge = document.querySelector("#driverMessageBadge");
const driverActiveMessaging = document.querySelector("#driverActiveMessaging");
const driverDocumentsList = document.querySelector("#driverDocumentsList");
const driverProfileDetails = document.querySelector("#driverProfileDetails");
const employeeLogin = document.querySelector("#employeeLogin");
const employeePrivate = document.querySelector("#employeePrivate");
const employeePublicHeader = document.querySelector(".employee-public-header");
const employeeTitle = document.querySelector("#employee-title");
const driverMenuToggle = document.querySelector("#driverMenuToggle");
const driverMenuPanel = document.querySelector("#driverMenuPanel");
const adminMenuToggle = document.querySelector("#adminMenuToggle");
const adminMenuPanel = document.querySelector("#adminMenuPanel");
const adminLogout = document.querySelector("#adminLogout");
const driverGreeting = document.querySelector("#driverGreeting");
const driverDemandPill = document.querySelector("#driverDemandPill");
const driverStatusSummary = document.querySelector("#driverStatusSummary");
const driverClockPanel = document.querySelector("#driverClockPanel");
const ownerOperationsStatus = document.querySelector("#ownerOperationsStatus");
const driverOperationsBoard = document.querySelector("#driverOperationsBoard");
const operationsAlertsBoard = document.querySelector("#operationsAlertsBoard");
const catalogLearningBoard = document.querySelector("#catalogLearningBoard");
const catalogLearningSummary = document.querySelector("#catalogLearningSummary");
const catalogLearningPendingCount = document.querySelector("#catalogLearningPendingCount");
const catalogLearningStatus = document.querySelector("#catalogLearningStatus");
const runCatalogLearningReview = document.querySelector("#runCatalogLearningReview");
const employeeLoginForm = document.querySelector("#employeeLoginForm");
const employeeLoginName = document.querySelector("#employeeLoginName");
const employeeAccessCode = document.querySelector("#employeeAccessCode");
const employeeLoginStatus = document.querySelector("#employeeLoginStatus");
const employeeLogout = document.querySelector("#employeeLogout");
const availabilityFields = {
  name: document.querySelector("#availabilityName"),
  notes: document.querySelector("#availabilityNotes"),
};
const completionForm = document.querySelector("#completionForm");
const handedToCustomer = document.querySelector("#handedToCustomer");
const handoffPinField = document.querySelector("#handoffPinField");
const handoffPinInput = document.querySelector("#handoffPinInput");
const dropoffPhoto = document.querySelector("#dropoffPhoto");
const receiptPhoto = document.querySelector("#receiptPhoto");
const receiptPhotoField = document.querySelector("#receiptPhotoField");
const completionStatus = document.querySelector("#completionStatus");

let discounts = loadDiscounts();
let customerProfile = loadProfile();
let customerAccounts = loadCustomerAccounts();
let employeeAvailability = loadAvailability();
let currentMembership = loadMembership();
let driverBonusPay = loadStoredList("hopesGoDriverBonusPay");
let currentEmployee = localStorage.getItem("hopesGoCurrentEmployee") || "";
let currentRole = sessionStorage.getItem("hopesGoCurrentRole") || localStorage.getItem("hopesGoCurrentRole") || "";
let shoppingEstimateTotal = 0;
let shoppingEstimateRange = { low: 0, high: 0, unknownCount: 0, explicitCount: 0, catalogCount: 0, unitCount: 0 };
let selectedShoppingProducts = [];
let latestShoppingProductSuggestions = [];
let shoppingProductSearchTimer = null;
let shoppingProductSearchSequence = 0;
let shoppingStoreSelectionKey = "";
let tipStepSeen = false;
let customerLoginMode = "signup";
let pendingCustomerVerification = null;
let latestOperationsStatus = null;
let operationsStatusTimer = null;
let catalogLearningData = null;

const shoppingPriceCatalog = [
  { aliases: ["paper towels", "paper towel"], typical: 7, low: 5, high: 10 },
  { aliases: ["toilet paper", "bath tissue"], typical: 7.5, low: 5, high: 11 },
  { aliases: ["laundry detergent", "detergent"], typical: 10, low: 7, high: 14 },
  { aliases: ["dish soap", "dishwashing liquid"], typical: 3.75, low: 2.5, high: 5.5 },
  { aliases: ["trash bags", "garbage bags"], typical: 7.5, low: 5, high: 11 },
  { aliases: ["baby wipes", "wipes"], typical: 3.25, low: 2, high: 5 },
  { aliases: ["dog food"], typical: 12, low: 7, high: 18 },
  { aliases: ["cat food"], typical: 9, low: 6, high: 14 },
  { aliases: ["bottled water", "water"], typical: 4, low: 2.5, high: 6 },
  { aliases: ["ground beef", "beef"], typical: 9, low: 6, high: 13 },
  { aliases: ["chicken breast", "chicken"], typical: 7, low: 5, high: 10 },
  { aliases: ["strawberries"], typical: 3.5, low: 2.5, high: 5 },
  { aliases: ["bananas"], typical: 1.5, low: 1, high: 2.5 },
  { aliases: ["apples"], typical: 4, low: 2.75, high: 6 },
  { aliases: ["orange juice", "juice"], typical: 3.75, low: 2.5, high: 5.5 },
  { aliases: ["soft drink", "soda", "pop"], typical: 5.5, low: 3, high: 8 },
  { aliases: ["ice cream"], typical: 4.5, low: 3, high: 6.5 },
  { aliases: ["frozen pizza", "pizza"], typical: 5.5, low: 3.5, high: 8 },
  { aliases: ["pasta sauce", "spaghetti sauce"], typical: 2.75, low: 1.75, high: 4.5 },
  { aliases: ["peanut butter"], typical: 3.5, low: 2.25, high: 5 },
  { aliases: ["coffee"], typical: 8, low: 5, high: 12 },
  { aliases: ["cereal"], typical: 4, low: 2.75, high: 6 },
  { aliases: ["cheese"], typical: 4, low: 2.75, high: 6 },
  { aliases: ["yogurt"], typical: 3.5, low: 2.25, high: 5 },
  { aliases: ["butter"], typical: 4.25, low: 3, high: 6 },
  { aliases: ["eggs"], typical: 3.75, low: 2.5, high: 5.5 },
  { aliases: ["milk"], typical: 3.75, low: 2.75, high: 5 },
  { aliases: ["bread"], typical: 2.75, low: 1.75, high: 4 },
  { aliases: ["rice"], typical: 3.5, low: 2.25, high: 5.5 },
  { aliases: ["pasta", "spaghetti", "noodles"], typical: 1.75, low: 1, high: 3 },
  { aliases: ["chips"], typical: 3.75, low: 2.5, high: 5.5 },
  { aliases: ["shampoo"], typical: 5.5, low: 3.5, high: 8 },
  { aliases: ["toothpaste"], typical: 3.5, low: 2, high: 5.5 },
  { aliases: ["deodorant"], typical: 4.75, low: 3, high: 7 },
];

const unknownShoppingItemRange = { typical: 5, low: 2.5, high: 8 };
const MAX_CUSTOM_ITEM_UNIT_ESTIMATE = 1000;

const localLocationSuggestions = [
  {
    label: "McDonald's - Roosevelt Ave, Burlington, IA",
    value: "McDonald's, Roosevelt Ave, Burlington, IA",
    keywords: ["mcdonalds", "mcdonald's", "mc donalds", "mcd", "roosevelt", "burlington", "burger", "fast food"],
    coordinates: [-91.1129, 40.808],
  },
  {
    label: "McDonald's - Agency St, West Burlington, IA",
    value: "McDonald's, Agency St, West Burlington, IA",
    keywords: ["mcdonalds", "mcdonald's", "mc donalds", "mcd", "agency", "west burlington", "burger", "fast food"],
    coordinates: [-91.1694, 40.8136],
  },
  {
    label: "Hy-Vee - Agency St, Burlington, IA",
    value: "Hy-Vee, 3140 Agency St, Burlington, IA",
    keywords: ["hyvee", "hy-vee", "grocery", "agency", "burlington"],
    coordinates: [-91.1396, 40.807],
  },
  {
    label: "Walmart Supercenter - West Burlington, IA",
    value: "Walmart Supercenter, 324 W Agency Rd, West Burlington, IA",
    keywords: ["walmart", "supercenter", "agency", "west burlington"],
    coordinates: [-91.1646, 40.813],
  },
  {
    label: "Target - West Burlington, IA",
    value: "Target, West Burlington, IA",
    keywords: ["target", "west burlington", "store"],
    coordinates: [-91.169, 40.814],
  },
  {
    label: "Great River Health - West Burlington, IA",
    value: "Great River Health, West Burlington, IA",
    keywords: ["hospital", "great river", "health", "clinic", "west burlington"],
    coordinates: [-91.167, 40.818],
  },
  {
    label: "Downtown Burlington, IA",
    value: "Downtown Burlington, IA",
    keywords: ["downtown", "burlington"],
    coordinates: [-91.1004, 40.8075],
  },
  {
    label: "Burlington, IA",
    value: "Burlington, IA",
    keywords: ["burlington"],
    coordinates: [-91.1129, 40.8075],
  },
  {
    label: "West Burlington, IA",
    value: "West Burlington, IA",
    keywords: ["west burlington"],
    coordinates: [-91.1565, 40.825],
  },
  {
    label: "Fort Madison, IA",
    value: "Fort Madison, IA",
    keywords: ["fort madison"],
    coordinates: [-91.3152, 40.6298],
  },
  {
    label: "Mediapolis, IA",
    value: "Mediapolis, IA",
    keywords: ["mediapolis"],
    coordinates: [-91.164, 41.0086],
  },
  {
    label: "Mount Pleasant, IA",
    value: "Mount Pleasant, IA",
    keywords: ["mount pleasant", "mt pleasant"],
    coordinates: [-91.5521, 40.9636],
  },
  {
    label: "Danville, IA",
    value: "Danville, IA",
    keywords: ["danville"],
    coordinates: [-91.3157, 40.8648],
  },
  {
    label: "New London, IA",
    value: "New London, IA",
    keywords: ["new london"],
    coordinates: [-91.3996, 40.9267],
  },
];

const approvedDriverLogins = [
  { username: "hope_driver", name: "Hope", code: "Driver_1890!", role: "driver", phone: "+13195944964" },
];

const approvedAdminLogins = [
  { username: "hope_go", name: "Hope", role: "owner" },
];

const restaurantLoginForm = document.querySelector("#restaurantLoginForm");
const restaurantLoginName = document.querySelector("#restaurantLoginName");
const restaurantLoginPassword = document.querySelector("#restaurantLoginPassword");
const restaurantLoginStatus = document.querySelector("#restaurantLoginStatus");
const restaurantEditorForm = document.querySelector("#restaurantEditorForm");
const restaurantEditorStatus = document.querySelector("#restaurantEditorStatus");
const restaurantHoursEditor = document.querySelector("#restaurantHoursEditor");
const restaurantMenuEditor = document.querySelector("#restaurantMenuEditor");
const restaurantDealsEditor = document.querySelector("#restaurantDealsEditor");
const restaurantCurrentOrdersBoard = document.querySelector("#restaurantCurrentOrdersBoard");
const restaurantPastOrdersBoard = document.querySelector("#restaurantPastOrdersBoard");
const restaurantPayRecordsBoard = document.querySelector("#restaurantPayRecordsBoard");
const restaurantStripeStatus = document.querySelector("#restaurantStripeStatus");
const restaurantMarketplace = document.querySelector("#restaurantMarketplace");
const restaurantStoreGrid = document.querySelector("#restaurantStoreGrid");
const restaurantPublicMenu = document.querySelector("#restaurantPublicMenu");
const restaurantDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
let restaurantAuthToken = sessionStorage.getItem("hopesGoRestaurantToken") || "";
let restaurantAdminToken = sessionStorage.getItem("hopesGoRestaurantAdminToken") || "";
let restaurantEditorData = null;
let selectedRestaurantOrder = null;
let customPickupDetailsCollected = false;

function renderRestaurantOrderCard(order, isPast = false) {
  const orderAction = order.status === "new"
    ? `<button class="checkout-button" type="button" data-order-status="preparing" data-order-id="${escapeHtml(order.id)}">Start Order</button>`
    : `<button class="checkout-button" type="button" data-order-status="completed" data-order-id="${escapeHtml(order.id)}">Finish Order</button>`;
  return `<article class="restaurant-order-card"><div class="restaurant-order-top"><strong>${escapeHtml(order.orderNumber || "Order")}</strong><span class="pill">${order.status === "new" ? "New order" : "In progress"}</span></div><p>${escapeHtml(order.customerName || "Customer")} · ${escapeHtml(order.deliveryAddress || "Delivery address not provided")}</p><div class="restaurant-order-lines">${(order.items || []).map((item) => `<div class="restaurant-order-line"><span>${Number(item.quantity || 0)} × ${escapeHtml(item.name)}</span><strong>${money(Number(item.lineTotal || 0))}</strong></div>`).join("")}</div><div class="restaurant-order-line"><span>Food + food tax</span><strong>${money(Number(order.restaurantAmount || 0))}</strong></div>${isPast ? `<small>${new Date(order.createdAt).toLocaleString()}</small>` : `<div class="restaurant-order-actions">${orderAction}</div>`}</article>`;
}

async function loadRestaurantOrders() {
  if (!restaurantAuthToken || !restaurantCurrentOrdersBoard) return;
  try {
    const [ordersResponse, payResponse] = await Promise.all([
      fetch(apiUrl("/api/restaurant/orders"), { headers: restaurantAuthHeaders() }),
      fetch(apiUrl("/api/restaurant/pay-records"), { headers: restaurantAuthHeaders() }),
    ]);
    const orders = await ordersResponse.json();
    const pay = await payResponse.json();
    if (!ordersResponse.ok) throw new Error(orders.error || "Orders could not be loaded.");
    restaurantCurrentOrdersBoard.innerHTML = orders.current.length ? orders.current.map((order) => renderRestaurantOrderCard(order)).join("") : `<div class="empty-state">No current orders.</div>`;
    restaurantPastOrdersBoard.innerHTML = orders.past.length ? orders.past.map((order) => renderRestaurantOrderCard(order, true)).join("") : `<div class="empty-state">No past orders yet.</div>`;
    restaurantPayRecordsBoard.innerHTML = pay.records.length ? pay.records.map((record) => `<article class="restaurant-order-card"><div class="restaurant-order-top"><strong>${escapeHtml(record.orderNumber)}</strong><span class="pill">${escapeHtml(record.paymentStatus)}</span></div><div class="restaurant-order-line"><span>Food subtotal</span><strong>${money(record.foodSubtotal)}</strong></div><div class="restaurant-order-line"><span>Food tax</span><strong>${money(record.foodTax)}</strong></div><div class="restaurant-order-line"><span>Restaurant amount</span><strong>${money(record.restaurantAmount)}</strong></div></article>`).join("") : `<div class="empty-state">No pay records yet.</div>`;
  } catch (error) {
    restaurantCurrentOrdersBoard.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function restaurantAuthHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${restaurantAuthToken}` };
}

function restaurantPlaceholderImage() {
  return "assets/logo.png";
}

async function imageFileToDataUrl(file) {
  if (!file) return "";
  if (file.size > 1_800_000) throw new Error("Please use a picture smaller than 1.8 MB.");
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The picture could not be read."));
    reader.readAsDataURL(file);
  });
}

function blankRestaurantMenuItem() {
  return { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "", description: "", category: "Menu", price: 0, image: "", active: true };
}

function renderRestaurantEditor() {
  if (!restaurantEditorData) return;
  document.querySelector("#restaurantDashboardTitle").textContent = restaurantEditorData.storeName || "Restaurant Dashboard";
  const adminEditingRestaurant = ["owner", "admin"].includes(currentRole);
  document.querySelector("#restaurantLogout").hidden = adminEditingRestaurant;
  document.querySelector("#restaurantBackToAdmin").hidden = !adminEditingRestaurant;
  document.querySelector("#restaurantStoreName").value = restaurantEditorData.storeName || "";
  document.querySelector("#restaurantPhone").value = restaurantEditorData.phone || "";
  document.querySelector("#restaurantAddress").value = restaurantEditorData.address || "";
  document.querySelector("#restaurantDescription").value = restaurantEditorData.description || "";
  restaurantStripeStatus.textContent = restaurantEditorData.stripeReady
    ? "Stripe is connected. Customer food and food tax can transfer automatically."
    : "Stripe connection is not finished. The menu can be published, but checkout will remain unavailable.";
  restaurantHoursEditor.innerHTML = restaurantDays.map((day) => `
    <label>${day}<input data-restaurant-hour="${day}" value="${escapeHtml(restaurantEditorData.hours?.[day] || "Closed")}" /></label>
  `).join("");
  restaurantMenuEditor.innerHTML = (restaurantEditorData.menu || []).map((item) => `
    <article class="restaurant-item-editor" data-menu-item="${escapeHtml(item.id)}">
      <label>Item name<input data-field="name" value="${escapeHtml(item.name)}" required /></label>
      <label>Category<input data-field="category" value="${escapeHtml(item.category || "Menu")}" /></label>
      <label>Price<input data-field="price" type="number" min="0" max="1000" step="0.01" value="${Number(item.price || 0).toFixed(2)}" required /></label>
      <label class="description-field">Description<textarea data-field="description" rows="2">${escapeHtml(item.description || "")}</textarea></label>
      <label>Food picture<input data-menu-image type="file" accept="image/png,image/jpeg,image/webp" /></label>
      <img src="${escapeHtml(item.image || restaurantPlaceholderImage())}" alt="" />
      <label><span>Available</span><input data-field="active" type="checkbox" ${item.active !== false ? "checked" : ""} /></label>
      <button class="secondary-admin-action" data-remove-menu-item type="button">Remove</button>
    </article>
  `).join("") || `<div class="empty-state">No menu items yet. Press “Add menu item.”</div>`;
  restaurantDealsEditor.innerHTML = (restaurantEditorData.weeklyDeals || []).map((deal) => `
    <article class="restaurant-item-editor" data-deal="${escapeHtml(deal.id)}">
      <label>Deal title<input data-field="title" value="${escapeHtml(deal.title)}" required /></label>
      <label class="description-field">Details<textarea data-field="description" rows="2">${escapeHtml(deal.description || "")}</textarea></label>
      <label><span>Show this deal</span><input data-field="active" type="checkbox" ${deal.active !== false ? "checked" : ""} /></label>
      <button class="secondary-admin-action" data-remove-deal type="button">Remove</button>
    </article>
  `).join("") || `<div class="empty-state">No weekly deals. Press “Add weekly deal.”</div>`;
}

async function captureRestaurantEditor() {
  restaurantEditorData.storeName = document.querySelector("#restaurantStoreName").value.trim();
  restaurantEditorData.phone = document.querySelector("#restaurantPhone").value.trim();
  restaurantEditorData.address = document.querySelector("#restaurantAddress").value.trim();
  restaurantEditorData.description = document.querySelector("#restaurantDescription").value.trim();
  restaurantEditorData.hours = Object.fromEntries([...document.querySelectorAll("[data-restaurant-hour]")].map((input) => [input.dataset.restaurantHour, input.value.trim() || "Closed"]));
  restaurantEditorData.menu = await Promise.all([...restaurantMenuEditor.querySelectorAll("[data-menu-item]")].map(async (row) => {
    const previous = restaurantEditorData.menu.find((item) => item.id === row.dataset.menuItem) || {};
    const file = row.querySelector("[data-menu-image]").files[0];
    return {
      id: row.dataset.menuItem,
      name: row.querySelector('[data-field="name"]').value.trim(),
      category: row.querySelector('[data-field="category"]').value.trim() || "Menu",
      price: Number(row.querySelector('[data-field="price"]').value || 0),
      description: row.querySelector('[data-field="description"]').value.trim(),
      active: row.querySelector('[data-field="active"]').checked,
      image: file ? await imageFileToDataUrl(file) : previous.image || "",
    };
  }));
  restaurantEditorData.weeklyDeals = [...restaurantDealsEditor.querySelectorAll("[data-deal]")].map((row) => ({
    id: row.dataset.deal,
    title: row.querySelector('[data-field="title"]').value.trim(),
    description: row.querySelector('[data-field="description"]').value.trim(),
    active: row.querySelector('[data-field="active"]').checked,
  }));
  const logoFile = document.querySelector("#restaurantLogoInput").files[0];
  const coverFile = document.querySelector("#restaurantCoverInput").files[0];
  if (logoFile) restaurantEditorData.logo = await imageFileToDataUrl(logoFile);
  if (coverFile) restaurantEditorData.coverImage = await imageFileToDataUrl(coverFile);
}

async function loadRestaurants() {
  restaurantStoreGrid.innerHTML = `<div class="empty-state">Loading restaurants…</div>`;
  try {
    const response = await fetch(apiUrl("/api/restaurants"));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Restaurants could not be loaded.");
    restaurantStoreGrid.innerHTML = data.restaurants.length ? data.restaurants.map((restaurant) => `
      <button class="restaurant-store-card" type="button" data-open-restaurant="${escapeHtml(restaurant.id)}">
        <img src="${escapeHtml(restaurant.coverImage || restaurant.logo || restaurantPlaceholderImage())}" alt="${escapeHtml(restaurant.storeName)}" />
        <span class="restaurant-store-card-body"><h3>${escapeHtml(restaurant.storeName)}</h3><span>${escapeHtml(restaurant.description || restaurant.address || "View menu")}</span></span>
      </button>
    `).join("") : `<div class="empty-state">Partner restaurants will appear here as they sign up.</div>`;
  } catch (error) { restaurantStoreGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; }
}

async function openRestaurantMenu(id) {
  const response = await fetch(apiUrl(`/api/restaurants/${encodeURIComponent(id)}`));
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Restaurant menu could not be loaded.");
  selectedRestaurantOrder = { restaurant: data.restaurant, items: new Map() };
  renderPublicRestaurantMenu();
}

function renderPublicRestaurantMenu() {
  if (!selectedRestaurantOrder) return;
  const restaurant = selectedRestaurantOrder.restaurant;
  const foodSubtotal = [...selectedRestaurantOrder.items.values()].reduce((sum, line) => sum + Number(line.item.price) * line.quantity, 0);
  const foodTax = foodSubtotal * Number(restaurant.foodTaxRate || 0);
  const itemCount = [...selectedRestaurantOrder.items.values()].reduce((sum, line) => sum + line.quantity, 0);
  restaurantStoreGrid.hidden = true;
  restaurantPublicMenu.hidden = false;
  restaurantPublicMenu.innerHTML = `
    <header class="restaurant-public-header">
      <button class="secondary-admin-action" type="button" data-back-to-restaurants>← All restaurants</button>
      <h2>${escapeHtml(restaurant.storeName)}</h2><p>${escapeHtml(restaurant.description || "")}</p><strong>${escapeHtml(restaurant.hours?.[new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date())] || "See restaurant for hours")}</strong>
    </header>
    <div class="restaurant-deals-strip">${(restaurant.weeklyDeals || []).map((deal) => `<article class="restaurant-deal-public"><strong>${escapeHtml(deal.title)}</strong><span>${escapeHtml(deal.description)}</span></article>`).join("")}</div>
    <div class="restaurant-menu-grid">${(restaurant.menu || []).map((item) => `
      <article class="restaurant-menu-card"><img src="${escapeHtml(item.image || restaurant.logo || restaurantPlaceholderImage())}" alt="${escapeHtml(item.name)}" /><div class="restaurant-menu-card-body"><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description || item.category)}</p><div class="restaurant-menu-card-footer"><strong>${money(item.price)}</strong><button class="checkout-button" type="button" data-add-food="${escapeHtml(item.id)}">Add</button></div></div></article>
    `).join("")}</div>
    <aside class="restaurant-food-cart"><strong>Your ${escapeHtml(restaurant.storeName)} order (${itemCount})</strong><div class="restaurant-food-cart-lines">${[...selectedRestaurantOrder.items.values()].map((line) => `<div class="restaurant-food-cart-line"><span>${line.quantity} × ${escapeHtml(line.item.name)}</span><span>${money(line.item.price * line.quantity)} <button type="button" data-remove-food="${escapeHtml(line.item.id)}">−</button></span></div>`).join("") || "No food selected yet."}</div><div class="restaurant-food-cart-line"><span>Food</span><strong>${money(foodSubtotal)}</strong></div><div class="restaurant-food-cart-line"><span>Restaurant food tax</span><strong>${money(foodTax)}</strong></div><button class="checkout-button" type="button" data-restaurant-continue ${itemCount ? "" : "disabled"}>Continue to delivery options</button></aside>
  `;
}

function getRestaurantOrderPayload() {
  if (!selectedRestaurantOrder || !selectedRestaurantOrder.items.size) return null;
  return { restaurantId: selectedRestaurantOrder.restaurant.id, items: [...selectedRestaurantOrder.items.values()].map((line) => ({ id: line.item.id, quantity: line.quantity })) };
}

function getRestaurantFoodTotals() {
  if (!selectedRestaurantOrder) return { subtotal: 0, tax: 0, totalItems: 0 };
  const subtotal = [...selectedRestaurantOrder.items.values()].reduce((sum, line) => sum + Number(line.item.price) * line.quantity, 0);
  return { subtotal, tax: subtotal * Number(selectedRestaurantOrder.restaurant.foodTaxRate || 0), totalItems: [...selectedRestaurantOrder.items.values()].reduce((sum, line) => sum + line.quantity, 0) };
}

const customerPages = [
  "customerServices",
  "customerAddons",
  "customerAreas",
  "customerTip",
  "customerInfo",
  "serviceInfo",
  "pickupInfo",
  "dropoffInfo",
  "customerCheckout",
];
const customerPageInfo = {
  customerServices: {
    category: "Main Services",
    step: "Step 1",
    title: "Choose a main service",
    next: "Continue to add-ons",
  },
  customerAddons: {
    category: "Add-ons",
    step: "Step 2",
    title: "Choose add-ons",
    next: "Continue to service areas",
  },
  customerAreas: {
    category: "Service Areas",
    step: "Step 3",
    title: "Choose service area",
    next: "Continue to tip",
  },
  customerTip: {
    step: "Step 4",
    title: "Add a tip",
    next: "Continue to customer info",
  },
  customerInfo: {
    step: "Step 5",
    title: "Customer info",
    next: "Continue to service info",
  },
  serviceInfo: {
    step: "Step 6",
    title: "Service info",
    next: "Continue to pickup info",
  },
  pickupInfo: {
    step: "Step 7",
    title: "Pickup info",
    next: "Continue to drop-off info",
  },
  dropoffInfo: {
    step: "Step 8",
    title: "Drop-off info",
    next: "Review & Checkout",
  },
  customerCheckout: {
    step: "Step 9",
    title: "Review & Checkout",
    next: "Finish checkout",
  },
};

const customerPageHelp = {
  home: {
    title: "Hope's & Go customer site",
    intro: "Start a new request, review your cart, manage memberships, or open your customer account from this site.",
  },
  customerServices: {
    title: "Choose a main service",
    intro: "Choose the one main service that best matches what you need today.",
  },
  customerAddons: {
    title: "Choose optional add-ons",
    intro: "Add-ons are optional. Choose only the extras that apply to this request.",
  },
  customerAreas: {
    title: "Choose the correct service area",
    intro: "If your pickup or delivery is outside Burlington city limits, select the tier that matches its distance from Burlington.",
    items: [
      { name: "No additional fee", description: "Burlington city limits and locations up to 5 miles outside the city limits." },
      { name: "Tier 1", description: "6-15 miles from Burlington." },
      { name: "Tier 2", description: "16-25 miles from Burlington." },
      { name: "Tier 3", description: "26-35 miles from Burlington." },
      { name: "More than 35 miles", description: "Request a custom quote before checkout." },
    ],
  },
  customerTip: {
    title: "Add or skip a tip",
    intro: "Tips are optional. If you add one, 100% goes to your Hope's & Go driver.",
  },
  customerInfo: {
    title: "Customer information",
    intro: "Confirm the name, phone number, and email connected with this request so we can provide updates.",
  },
  serviceInfo: {
    title: "Service information",
    intro: "Review your selected service and add-ons, then add any notes the driver needs to complete the request.",
  },
  pickupInfo: {
    title: "Pickup information",
    intro: "Enter where the driver should go first and include helpful pickup instructions, such as an order name or store department.",
  },
  dropoffInfo: {
    title: "Drop-off information",
    intro: "Enter the final delivery address, choose handoff or no-contact delivery, and add gate, apartment, or placement instructions.",
  },
  customerCheckout: {
    title: "Review and checkout",
    intro: "Check the service, addresses, shopping estimate, discounts, tip, and total before entering payment details.",
  },
  memberships: {
    title: "Memberships",
    intro: "Compare optional monthly plans and their included services, discounts, and priority benefits before choosing one.",
  },
  account: {
    title: "Customer account",
    intro: "Review and update the contact and delivery information saved to your account.",
  },
  orders: {
    title: "Past orders",
    intro: "Review your previous Hope's & Go requests and their completion details.",
  },
  payments: {
    title: "Saved payment methods",
    intro: "Review the cards or bank payment methods available for future requests.",
  },
};

function getCurrentCustomerHelp() {
  const key = currentCustomerMode === "request" ? currentCustomerPage : currentCustomerMode;
  const help = customerPageHelp[key] || customerPageHelp.home;
  if (key === "customerServices") {
    return {
      ...help,
      items: services
        .filter((service) => service.category === "Main Services")
        .map((service) => ({ name: service.name, description: service.description })),
    };
  }
  if (key === "customerAddons") {
    return {
      ...help,
      items: services
        .filter((service) => service.category === "Add-ons")
        .map((service) => ({ name: service.name, description: service.description })),
    };
  }
  return help;
}

function updateCustomerHelpButton() {
  if (!customerPageHelpButton) return;
  const help = getCurrentCustomerHelp();
  customerPageHelpButton.setAttribute("aria-label", `Help: ${help.title}`);
  customerPageHelpButton.title = `Help: ${help.title}`;
}

function openCustomerHelp() {
  if (!customerHelpModal || !customerHelpTitle || !customerHelpBody) return;
  const help = getCurrentCustomerHelp();
  customerHelpTitle.textContent = help.title;
  customerHelpBody.innerHTML = `
    <p>${escapeHtml(help.intro)}</p>
    ${Array.isArray(help.items) && help.items.length
      ? `<div class="customer-help-list">${help.items.map((item) => `
          <article>
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(item.description)}</span>
          </article>
        `).join("")}</div>`
      : ""}
  `;
  customerHelpModal.hidden = false;
  document.body.classList.add("customer-help-open");
  customerHelpClose?.focus();
}

function closeCustomerHelp() {
  if (!customerHelpModal) return;
  customerHelpModal.hidden = true;
  document.body.classList.remove("customer-help-open");
  customerPageHelpButton?.focus();
}
let currentCustomerPage = "customerServices";
let currentCustomerMode = "home";
let serviceAreaNoFeeSelected = false;
let serviceAreaReturnPage = "";
let customerInfoEditMode = false;
let tipChoiceMode = tipInput?.value ? "enter" : "";
let activeEmbeddedCheckout = null;
let activeMembershipCheckout = null;
let stripeScriptPromise = null;
let requestDraftWritePaused = false;

function apiUrl(path) {
  if (window.location.protocol === "file:") {
    return `http://localhost:3000${path}`;
  }
  return path;
}

function showAvailabilityGate() {
  if (!availabilityGateModal) return;
  availabilityGateModal.hidden = false;
  document.body.classList.add("availability-gate-open");
}

function closeAvailabilityGate() {
  if (!availabilityGateModal) return;
  availabilityGateModal.hidden = true;
  document.body.classList.remove("availability-gate-open");
}

function hasAdminTestingAccess() {
  return currentRole === "admin" || currentRole === "owner";
}

function getSeenOperationsAlertIds() {
  try {
    return JSON.parse(localStorage.getItem("hopesGoSeenOperationsAlerts") || "[]");
  } catch {
    return [];
  }
}

function notifyNewOperationsAlerts(alerts = []) {
  if (!["owner", "admin"].includes(currentRole)) return;
  const seen = new Set(getSeenOperationsAlertIds());
  alerts
    .filter((alert) => !seen.has(alert.id))
    .slice(0, 5)
    .forEach((alert) => {
      sendAppNotification(`Hope's & Go - ${alert.title}`, alert.message);
      seen.add(alert.id);
    });
  localStorage.setItem("hopesGoSeenOperationsAlerts", JSON.stringify([...seen].slice(-200)));
}

function renderOperationsStatus(status = latestOperationsStatus) {
  if (!status) {
    if (customerServiceAvailability) {
      customerServiceAvailability.textContent = "Driver availability could not be confirmed.";
      customerServiceAvailability.className = "customer-service-status unavailable";
    }
    return;
  }

  syncDriverScheduleFromServer(status);

  if (customerServiceAvailability) {
    customerServiceAvailability.textContent = status.bookingAvailable
      ? `${status.availableDriverCount} ${status.availableDriverCount === 1 ? "driver is" : "drivers are"} available now.`
      : "No drivers are currently available.";
    customerServiceAvailability.className = `customer-service-status ${status.bookingAvailable ? "available" : "unavailable"}`;
  }

  if (ownerOperationsStatus) {
    ownerOperationsStatus.innerHTML = `
      <div class="owner-status-summary">
        <div>
          <span>Current owner status</span>
          <strong class="operations-status-value status-${String(status.ownerEffectiveStatus).toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(status.ownerEffectiveStatus)}</strong>
        </div>
        <div>
          <span>Schedule control</span>
          <strong>${escapeHtml(status.ownerOverride === "Auto" ? "Automatic" : status.ownerOverride)}</strong>
        </div>
        <div>
          <span>Operating block</span>
          <strong>${escapeHtml(status.currentBlock)}</strong>
        </div>
        <div>
          <span>Booking coverage</span>
          <strong>${status.availableDriverCount} available</strong>
        </div>
        <div>
          <span>Owner SMS alerts</span>
          <strong class="sms-configuration-status ${status.smsConfigured ? "ready" : "needs-setup"}">${status.smsConfigured ? "Ready" : "Needs Twilio setup"}</strong>
        </div>
      </div>
      <div class="automatic-schedule-note">
        <strong>Automatic hours: 8:00 AM-12:00 AM</strong>
        <span>Monday offline 5:00 PM-8:30 PM</span>
        <span>Thursday offline 5:00 PM-9:00 PM</span>
        <span>Sunday offline 8:00 AM-1:00 PM</span>
      </div>
    `;
  }

  document.querySelectorAll("[data-owner-operations-status]").forEach((button) => {
    button.classList.toggle("active", button.dataset.ownerOperationsStatus === status.ownerOverride);
  });

  if (driverOperationsBoard) {
    driverOperationsBoard.innerHTML = status.drivers
      .map(
        (driver) => `
          <div class="driver-operations-row">
            <div>
              <strong>${escapeHtml(driver.name)}</strong>
              <span>${escapeHtml(driver.role)} - ${escapeHtml(driver.source)}</span>
            </div>
            <div>
              <span class="pill status-${String(driver.status).toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(driver.status)}</span>
              <small>${driver.clockedIn ? "Clocked in" : "Not clocked in"}</small>
            </div>
          </div>
        `
      )
      .join("");
  }

  if (driverClockPanel) {
    const currentDriver = status.drivers.find(
      (driver) => driver.name.toLowerCase() === String(currentEmployee || "").toLowerCase()
    );
    const isOwnerDriver = currentDriver?.role === "Owner / Driver";
    const todaySchedule = status.ownerSchedule?.days?.find((day) => day.day === status.currentDay);
    if (!currentEmployee || !currentDriver) {
      driverClockPanel.innerHTML = "";
    } else if (isOwnerDriver) {
      driverClockPanel.innerHTML = `
        <div>
          <span>Owner service status</span>
          <strong>${escapeHtml(currentDriver.status)}</strong>
          <small>${escapeHtml(currentDriver.source)}${todaySchedule ? ` • Today: ${escapeHtml(todaySchedule.online)}` : ""}. Manual overrides are on Admin &gt; Schedule.</small>
        </div>
      `;
    } else {
      driverClockPanel.innerHTML = `
        <div>
          <span>Your clock status</span>
          <strong>${escapeHtml(currentDriver.status)}</strong>
          <small>${currentDriver.clockedIn ? "You are clocked in." : "You are not clocked in."}</small>
        </div>
        <div class="driver-clock-actions">
          <button type="button" data-driver-clock-status="Online">Clock In</button>
          <button type="button" data-driver-clock-status="Busy">Busy</button>
          <button type="button" data-driver-clock-status="Offline">Clock Out</button>
        </div>
      `;
    }

    if (driverAutomaticSchedule && driverManualAvailabilityArea) {
      driverAutomaticSchedule.hidden = !isOwnerDriver;
      driverManualAvailabilityArea.hidden = false;
      if (availabilityEditorIntro) {
        availabilityEditorIntro.innerHTML = isOwnerDriver
          ? `<strong>Edit Hope's exact automatic schedule</strong><span>Shift blocks stay available, or use exact times for the hours you really plan to work. Saving here updates the automatic clock.</span>`
          : `<strong>Set this driver's availability</strong><span>Use shift blocks, exact times, or both. Driver hours may overlap Hope's schedule anywhere between 8:00 AM and midnight.</span>`;
      }
      if (isOwnerDriver) {
        const automaticIsActive = status.ownerOverride === "Auto";
        driverAutomaticSchedule.innerHTML = `
          <div class="driver-auto-schedule-heading">
            <div>
              <span>Your automatic clock</span>
              <strong>${automaticIsActive ? "Active" : `Temporarily overridden: ${escapeHtml(status.ownerOverride)}`}</strong>
            </div>
            <span class="pill status-${String(currentDriver.status).toLowerCase().replace(/\s+/g, "-")}">${escapeHtml(currentDriver.status)} now</span>
          </div>
          <p class="driver-auto-schedule-note">
            ${automaticIsActive
              ? "Hope is automatically clocked in during the online windows below and clocked out during breaks and closed hours."
              : "The weekly schedule is saved, but the Admin Schedule override currently controls your status."}
          </p>
          <div class="driver-weekly-schedule">
            ${(status.ownerSchedule?.days || [])
              .map(
                (day) => `
                  <article class="driver-schedule-day${day.day === status.currentDay ? " current" : ""}">
                    <strong>${escapeHtml(day.day)}${day.day === status.currentDay ? " • Today" : ""}</strong>
                    <span>${escapeHtml(day.online)}</span>
                    <small>${escapeHtml(day.break)}</small>
                  </article>
                `
              )
              .join("")}
          </div>
          <small class="driver-schedule-time-zone">All times are Central Time. Use Admin &gt; Schedule only when you need a temporary manual override.</small>
        `;
      }
    }
  }

  if (currentEmployee && ["driver", "owner"].includes(currentRole)) {
    renderDriverStatusSummary();
    renderDriverOfferQueue();
  }

  if (operationsAlertsBoard) {
    operationsAlertsBoard.innerHTML = status.alerts?.length
      ? status.alerts
          .map(
            (alert) => `
              <div class="operations-alert-card">
                <div>
                  <strong>${escapeHtml(alert.title)}</strong>
                  <span>${escapeHtml(formatDateTime(alert.createdAt))}</span>
                </div>
                <p>${escapeHtml(alert.message).replace(/\n/g, "<br>")}</p>
              </div>
            `
          )
          .join("")
      : `<div class="empty-state">No operations alerts yet.</div>`;
  }

  notifyNewOperationsAlerts(status.alerts || []);
}

async function fetchOperationsStatus({ quiet = false } = {}) {
  try {
    const response = await fetch(apiUrl("/operations-status"), { cache: "no-store" });
    if (!response.ok) throw new Error("Availability check failed.");
    latestOperationsStatus = await response.json();
    renderOperationsStatus(latestOperationsStatus);
    return latestOperationsStatus;
  } catch {
    latestOperationsStatus = null;
    renderOperationsStatus(null);
    if (!quiet) showAvailabilityGate();
    return null;
  }
}

async function ensureDriverAvailable() {
  const status = await fetchOperationsStatus({ quiet: true });
  if (status?.bookingAvailable) return true;
  if (hasAdminTestingAccess()) return true;
  showAvailabilityGate();
  return false;
}

async function updateOwnerOperationsStatus(status) {
  const response = await fetch(apiUrl("/operations-status/owner"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) return;
  latestOperationsStatus = await response.json();
  renderOperationsStatus(latestOperationsStatus);
}

async function updateDriverClockStatus(status) {
  if (!currentEmployee) return;
  const response = await fetch(apiUrl("/operations-status/driver"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: currentEmployee, status }),
  });
  if (!response.ok) return;
  latestOperationsStatus = await response.json();
  renderOperationsStatus(latestOperationsStatus);
}

async function notifyOwnerOfTestOrder(request) {
  try {
    await fetch(apiUrl("/notify-owner-new-order"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceName: request.items || "Test request",
        customerName: request.customer || "Customer",
        requestId: request.id || "",
      }),
    });
    fetchOperationsStatus({ quiet: true });
  } catch {
    // The saved test request remains visible in Dispatch even if the optional test alert cannot reach the server.
  }
}

function setCustomerMode(mode) {
  currentCustomerMode = mode;
  document.body.dataset.customerMode = mode;
  if (membershipPage) {
    membershipPage.setAttribute("aria-hidden", String(mode !== "memberships"));
  }
  if (restaurantMarketplace) {
    restaurantMarketplace.setAttribute("aria-hidden", String(mode !== "restaurants"));
  }
  renderCustomerAccountPage();
  renderCustomerOrdersPage();
  renderCustomerPaymentsPage();
  if (mode === "request") {
    setCustomerPage(currentCustomerPage || "customerServices");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (mode === "memberships") {
    membershipStatus.textContent = getActiveMembershipPlan()
      ? `${getActiveMembershipPlan().name} is active on this account. Savings apply automatically.`
      : "Memberships are optional. Choose a plan only if you want monthly perks.";
    renderMembershipDashboard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (mode === "restaurants") {
    restaurantStoreGrid.hidden = false;
    restaurantPublicMenu.hidden = true;
    loadRestaurants();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  updateCustomerHelpButton();
  updateResumeCartButton();
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function parseCurrencyValue(value) {
  const normalized = String(value || "").replace(/[^0-9.]/g, "");
  const parts = normalized.split(".");
  const clean = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : parts[0];
  return Number(clean) || 0;
}

function getTipAmount() {
  return Number(tipInput?.dataset.amount || parseCurrencyValue(tipInput?.value) || 0);
}

function syncTipAmountInput() {
  if (!tipInput) return;
  tipInput.dataset.amount = String(parseCurrencyValue(tipInput.value));
}

function formatTipAmountInput() {
  if (!tipInput) return;
  const amount = parseCurrencyValue(tipInput.value);
  tipInput.dataset.amount = String(amount);
  tipInput.value = money(amount);
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

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getLocalLocationMatches(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return localLocationSuggestions.slice(0, 8);
  const parts = normalized.split(" ").filter(Boolean);
  return localLocationSuggestions
    .filter((item) => {
      const haystack = normalizeSearchText([item.label, item.value, ...(item.keywords || [])].join(" "));
      return parts.every((part) => haystack.includes(part));
    })
    .slice(0, 8);
}

function updateLocationDatalist(query = "") {
  if (!locationSuggestionList) return;
  locationSuggestionList.innerHTML = getLocalLocationMatches(query)
    .map((item) => `<option value="${item.value}"></option>`)
    .join("");
}

function getLocationContext(field) {
  if (field === profileFields.pickupAddress) {
    return { key: "pickup", label: "Pickup", helper: document.querySelector("#pickupAddressHelper") };
  }
  if (field === profileFields.deliveryAddress) {
    return { key: "dropoff", label: "Drop-off", helper: document.querySelector("#deliveryAddressHelper") };
  }
  if (field === additionalStopAddress) {
    return { key: "additionalStop", label: "Additional stop", helper: document.querySelector("#additionalStopAddressHelper") };
  }
  return { key: "location", label: "Location", helper: null };
}

function setSelectedRequestLocation(field, address, coordinates = null, verified = false, source = "") {
  const context = getLocationContext(field);
  if (!selectedRequestLocations[context.key]) return;
  selectedRequestLocations[context.key] = {
    address: address || "",
    coordinates,
    verified: Boolean(verified && coordinates),
    source,
  };
  if (context.helper) {
    if (!address) {
      context.helper.textContent =
        context.key === "dropoff"
          ? "Saved delivery can prefill, but you can update it here."
          : context.key === "additionalStop"
            ? "Add the extra stop between pickup and final delivery."
            : "Start typing a store, business, or address.";
    } else if (selectedRequestLocations[context.key].verified) {
      context.helper.textContent = `${context.label} verified by Mapbox.`;
    } else if (coordinates) {
      context.helper.textContent = `${context.label} mapped from saved local suggestions.`;
    } else {
      context.helper.textContent = window.HOPES_GO_MAPBOX_TOKEN
        ? `${context.label} entered. Choose a Mapbox suggestion or leave the field to verify it.`
        : `${context.label} selected. Add a Mapbox public token to verify live addresses.`;
    }
  }
  updateMapStatus();
  if (context.key === "dropoff") {
    const requirement = getDeliveryServiceAreaRequirement();
    if (requirement.known && !requirement.required && hasServiceArea()) {
      [...cart.values()]
        .filter((item) => item.service.category === "Service Areas")
        .forEach((item) => cart.delete(item.service.id));
      serviceAreaNoFeeSelected = true;
      renderCart();
      renderServices();
      return;
    }
    renderDeliveryServiceAreaWarning();
    renderRequestValidation();
  }
}

function getKnownLocationCoordinates(address) {
  const normalizedAddress = normalizeSearchText(address);
  if (!normalizedAddress) return null;
  return (
    localLocationSuggestions.find((item) =>
      [item.value, item.label].some((value) => normalizeSearchText(value) === normalizedAddress)
    )?.coordinates || null
  );
}

function getCityAnchorCoordinates(address) {
  const normalizedAddress = normalizeSearchText(address);
  const cityAnchors = [
    { names: ["west burlington"], coordinates: [-91.1565, 40.825] },
    { names: ["fort madison"], coordinates: [-91.3152, 40.6298] },
    { names: ["mount pleasant", "mt pleasant"], coordinates: [-91.5521, 40.9636] },
    { names: ["new london"], coordinates: [-91.3996, 40.9267] },
    { names: ["mediapolis"], coordinates: [-91.164, 41.0086] },
    { names: ["danville"], coordinates: [-91.3157, 40.8648] },
    { names: ["burlington"], coordinates: BURLINGTON_REFERENCE_COORDINATES },
  ];
  return cityAnchors.find((city) => city.names.some((name) => normalizedAddress.includes(name)))?.coordinates || null;
}

function calculateCoordinateDistanceMiles(fromCoordinates, toCoordinates) {
  if (!fromCoordinates || !toCoordinates) return 0;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const [fromLng, fromLat] = fromCoordinates.map(Number);
  const [toLng, toLat] = toCoordinates.map(Number);
  const latitudeDifference = toRadians(toLat - fromLat);
  const longitudeDifference = toRadians(toLng - fromLng);
  const startLatitude = toRadians(fromLat);
  const endLatitude = toRadians(toLat);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDifference / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function estimateServiceTravelMiles(coordinates) {
  const directMiles = calculateCoordinateDistanceMiles(BURLINGTON_REFERENCE_COORDINATES, coordinates);
  return Math.round(directMiles * 1.1);
}

function getSelectedServiceAreaId() {
  return [...cart.values()].find((item) => item.service.category === "Service Areas")?.service.id || 0;
}

function getDeliveryServiceAreaRequirement() {
  const address = profileFields.deliveryAddress.value.trim() || customerProfile?.deliveryAddress || "";
  if (!address) return { known: false, required: false, miles: 0, tier: null };

  const selectedDropoff = selectedRequestLocations.dropoff;
  const coordinates =
    (selectedDropoff.address === address && selectedDropoff.coordinates) ||
    getKnownLocationCoordinates(address) ||
    getCityAnchorCoordinates(address);
  if (!coordinates) return { known: false, required: false, miles: 0, tier: null };

  const miles = estimateServiceTravelMiles(coordinates);
  if (miles <= INCLUDED_SERVICE_RADIUS_MILES) {
    return { known: true, required: false, miles, tier: null };
  }

  const tier = serviceAreaDistanceTiers.find(
    (entry) => miles > entry.minExclusive && miles <= entry.maxInclusive
  );
  return {
    known: true,
    required: true,
    miles,
    tier: tier || null,
    customQuote: !tier,
  };
}

function getServiceAreaRequirementMessage(requirement = getDeliveryServiceAreaRequirement()) {
  if (!requirement.known || !requirement.required) return "";
  if (requirement.customQuote) {
    return `This location is about ${requirement.miles} miles from Burlington and is beyond the 35-mile service tiers. Please request a custom service-area quote.`;
  }
  return `Additional service area needed. This location is about ${requirement.miles} miles from Burlington. Please select Service Area Tier ${requirement.tier.tier} for this location.`;
}

function renderDeliveryServiceAreaWarning() {
  if (!deliveryServiceAreaWarning) return;
  const requirement = getDeliveryServiceAreaRequirement();
  const selectedServiceAreaId = getSelectedServiceAreaId();
  const hasCorrectTier = requirement.tier && selectedServiceAreaId === requirement.tier.serviceId;
  const showWarning = requirement.required && !hasCorrectTier;
  deliveryServiceAreaWarning.hidden = !showWarning;
  deliveryServiceAreaWarning.textContent = showWarning ? getServiceAreaRequirementMessage(requirement) : "";
  profileFields.deliveryAddress?.classList.toggle("field-error", Boolean(showWarning));
}

function syncRequestLocationFromField(field) {
  if (!field) return;
  const address = field.value.trim();
  setSelectedRequestLocation(field, address, getKnownLocationCoordinates(address), false, address ? "local" : "");
}

async function searchLocations(query, limit = 5) {
  const mapboxToken = window.HOPES_GO_MAPBOX_TOKEN || "";
  if (mapboxToken && query.trim().length >= 3) {
    try {
      const url = new URL(`https://api.mapbox.com/search/geocode/v6/forward`);
      url.searchParams.set("q", `${query}, Burlington, Iowa`);
      url.searchParams.set("proximity", "-91.1129,40.8075");
      url.searchParams.set("country", "US");
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("access_token", mapboxToken);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const matches = (data.features || []).map((feature) => ({
          label: feature.properties?.full_address || feature.properties?.name || feature.place_name,
          value: feature.properties?.full_address || feature.properties?.name || feature.place_name,
          coordinates: feature.geometry?.coordinates,
          source: "mapbox",
        }));
        if (matches.length) return matches;
      }
    } catch {
      // Fall back to local suggestions if Mapbox is unavailable.
    }
  }
  return getLocalLocationMatches(query)
    .slice(0, limit)
    .map((match) => ({ ...match, source: "local" }));
}

function renderLocationSuggestions(container, matches, field) {
  if (!container) return;
  container.innerHTML = matches
    .map(
      (match) => {
        const value = match.value || match.label || "";
        return `
        <button
          type="button"
          data-location-value="${value.replace(/"/g, "&quot;")}"
          data-location-lng="${match.coordinates?.[0] ?? ""}"
          data-location-lat="${match.coordinates?.[1] ?? ""}"
          data-location-source="${match.source || ""}"
        >
          <strong>${escapeHtml(match.label || value)}</strong>
          <span>Use this location</span>
        </button>
      `;
      }
    )
    .join("");
  container.classList.toggle("active", Boolean(matches.length));
  container.querySelectorAll("[data-location-value]").forEach((button) => {
    button.addEventListener("click", () => {
      field.value = button.dataset.locationValue;
      container.classList.remove("active");
      updateLocationDatalist(field.value);
      renderCart();
      const coordinates =
        button.dataset.locationLng && button.dataset.locationLat
          ? [Number(button.dataset.locationLng), Number(button.dataset.locationLat)]
          : null;
      setSelectedRequestLocation(
        field,
        field.value,
        coordinates,
        button.dataset.locationSource === "mapbox" && Boolean(coordinates),
        button.dataset.locationSource
      );
    });
  });
}

function wireAddressAutocomplete(field, container) {
  if (!field) return;
  let searchTimer = null;
  const update = () => {
    clearTimeout(searchTimer);
    updateLocationDatalist(field.value);
    searchTimer = setTimeout(async () => {
      const matches = await searchLocations(field.value);
      renderLocationSuggestions(container, matches, field);
    }, 180);
  };
  field.addEventListener("input", update);
  field.addEventListener("input", () => {
    const context = getLocationContext(field);
    if (selectedRequestLocations[context.key]?.address !== field.value.trim()) {
      setSelectedRequestLocation(field, field.value.trim(), null, false);
    }
  });
  field.addEventListener("focus", update);
  field.addEventListener("blur", () => {
    setTimeout(() => container?.classList.remove("active"), 180);
    setTimeout(async () => {
      const address = field.value.trim();
      if (!address || !window.HOPES_GO_MAPBOX_TOKEN) return;
      const context = getLocationContext(field);
      if (selectedRequestLocations[context.key]?.verified && selectedRequestLocations[context.key].address === address) return;
      const [match] = await searchLocations(address, 1);
      if (match?.coordinates) {
        setSelectedRequestLocation(field, match.value || address, match.coordinates, match.source === "mapbox", match.source);
      }
    }, 220);
  });
}

function updateMapStatus() {
  if (!customerMapStatus) return;
  const hasToken = Boolean(window.HOPES_GO_MAPBOX_TOKEN);
  if (!hasToken) {
    if (customerMapPreview) customerMapPreview.hidden = true;
    customerMapStatus.textContent = "";
    return;
  }
  if (customerMapPreview) customerMapPreview.hidden = false;
  const pickup = selectedRequestLocations.pickup;
  const dropoff = selectedRequestLocations.dropoff;
  const activeLocations = [pickup, dropoff].filter((location) => location.address);
  const mappedLocations = activeLocations.filter((location) => location.coordinates);
  if (customerMapCanvas && hasToken && mappedLocations.length) {
    const markers = [];
    if (pickup.coordinates) markers.push(`pin-s-p+e73383(${pickup.coordinates[0]},${pickup.coordinates[1]})`);
    if (dropoff.coordinates) markers.push(`pin-s-d+7f3fbf(${dropoff.coordinates[0]},${dropoff.coordinates[1]})`);
    const camera =
      mappedLocations.length === 1 ? `${mappedLocations[0].coordinates[0]},${mappedLocations[0].coordinates[1]},13,0` : "auto";
    customerMapCanvas.style.backgroundImage = `url("https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers.join(",")}/${camera}/640x300?padding=60&access_token=${window.HOPES_GO_MAPBOX_TOKEN}")`;
    customerMapCanvas.style.backgroundSize = "cover";
    customerMapCanvas.style.backgroundPosition = "center";
  }
  if (!activeLocations.length) {
    customerMapStatus.textContent = "Enter pickup and drop-off addresses to preview the route.";
    return;
  }
  const pickupLabel = pickup.verified ? "pickup verified" : pickup.address ? "pickup needs verification" : "pickup needed";
  const dropoffLabel = dropoff.verified ? "drop-off verified" : dropoff.address ? "drop-off needs verification" : "drop-off needed";
  customerMapStatus.textContent = `Location status: ${pickupLabel}; ${dropoffLabel}.`;
}

function getRecentServiceCompletionPace(service) {
  const profile = serviceCompletionProfiles[service.id];
  if (!profile) return { averageMinutes: 0, jobCount: 0 };

  const now = Date.now();
  const historyWindowMs = 30 * 24 * 60 * 60 * 1000;
  const historyNames = profile.historyNames.map((name) => name.toLowerCase());
  const durations = requests
    .filter((request) => {
      if (request.status !== "Completed" || request.testMode) return false;
      const completedAt = Number(request.completedAtMs || 0) || parseStoredDate(request.completedAt);
      const createdAt = Number(request.createdAtMs || 0) || parseStoredDate(request.createdAt);
      const requestItems = String(request.items || "").toLowerCase();
      return (
        completedAt > createdAt &&
        now - completedAt <= historyWindowMs &&
        historyNames.some((name) => requestItems.includes(name))
      );
    })
    .map((request) => {
      const completedAt = Number(request.completedAtMs || 0) || parseStoredDate(request.completedAt);
      const createdAt = Number(request.createdAtMs || 0) || parseStoredDate(request.createdAt);
      return Math.round((completedAt - createdAt) / 60000);
    })
    .filter((minutes) => minutes >= 10 && minutes <= 360);

  if (!durations.length) return { averageMinutes: 0, jobCount: 0 };
  return {
    averageMinutes: Math.round(durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length),
    jobCount: durations.length,
  };
}

function getServiceCompletionEstimate(service) {
  const profile = serviceCompletionProfiles[service.id];
  if (!profile) return null;

  const driverCount = Math.max(approvedDriverLogins.length, 1);
  const activeRequestCount = requests.filter((request) =>
    ["Admin reviewing", "Approved for drivers", "Accepted by driver"].includes(request.status)
  ).length;
  const demand = getDriverDemandStatus();
  const recentPace = getRecentServiceCompletionPace(service);
  const startingMinutes = recentPace.jobCount
    ? profile.baselineMinutes * 0.45 + recentPace.averageMinutes * 0.55
    : profile.baselineMinutes;
  const workloadPerDriver = activeRequestCount / driverCount;
  const workloadAdjustment = Math.min(45, workloadPerDriver * 12);
  const demandAdjustment = demand.label === "Very busy" ? 30 : demand.label === "Busy" ? 15 : 0;
  const capacityAdjustment = Math.min(15, Math.max(0, driverCount - 1) * 5);
  const estimatedMinutes = Math.max(
    20,
    Math.min(240, Math.round((startingMinutes + workloadAdjustment + demandAdjustment - capacityAdjustment) / 5) * 5)
  );

  return {
    typical: profile.typical,
    estimatedMinutes,
    driverCount,
    demandLabel: demand.label,
    paceLabel: recentPace.jobCount
      ? `Recent pace: ${recentPace.averageMinutes} min avg (${recentPace.jobCount} ${recentPace.jobCount === 1 ? "job" : "jobs"})`
      : "Typical pace until completed-job history builds",
  };
}

function renderServices() {
  const search = searchInput.value.trim().toLowerCase();
  const pageInfo = customerPageInfo[currentCustomerPage] || customerPageInfo.customerServices;
  const category = pageInfo.category || categoryFilter.value;
  const filtered = services.filter((service) => {
    const searchable = [service.name, service.category, service.description].join(" ").toLowerCase();
    const matchesSearch = searchable.includes(search);
    const matchesCategory = !category || category === "all" || service.category === category;
    return matchesSearch && matchesCategory;
  });

  const noFeeCard =
    currentCustomerPage === "customerAreas"
      ? `
        <article class="product-card no-service-area-card ${serviceAreaNoFeeSelected ? "selected-card" : ""}">
          <img class="product-art" src="assets/no-service-area.png" alt="No additional service area needed" loading="lazy" decoding="async" />
          <div class="no-service-area-body">
            <h3>No Additional Service Area Needed</h3>
            <p>For service addresses in Burlington city limits or up to 5 miles outside Burlington city limits.</p>
            <strong>$0.00</strong>
          </div>
        </article>
      `
      : "";
  productCount.textContent = "";
  productGrid.innerHTML =
    noFeeCard +
    filtered
    .map(
      (service) => {
        const needsMainService = service.category !== "Main Services" && !hasMainService();
        const selected = cart.get(service.id);
        const completionEstimate = getServiceCompletionEstimate(service);
        const serviceControls = selected
          ? `
              <div class="service-stepper" aria-label="${service.name} selected quantity">
                <button type="button" data-remove-one="${service.id}" aria-label="Remove one ${service.name}">-</button>
                <span>${selected.quantity}</span>
                <button type="button" data-add="${service.id}" aria-label="Add one ${service.name}">+</button>
              </div>
            `
          : `
              <button type="button" data-add="${service.id}" ${needsMainService ? "disabled" : ""}>
                ${needsMainService ? "Choose main first" : "+ Add"}
              </button>
            `;
        return `
        <article class="product-card ${needsMainService ? "locked-card" : ""} ${selected ? "selected-card" : ""}">
          <img class="product-art" src="${service.image}" alt="${service.name}" loading="lazy" decoding="async" />
           <div class="product-body">
             <h3>${service.name}</h3>
             <p>${service.description}</p>
             ${
               completionEstimate
                 ? `
                   <div class="service-time-estimate" aria-label="Live completion estimate for ${service.name}">
                     <div>
                       <span>Typical completion</span>
                       <strong>${completionEstimate.typical}</strong>
                     </div>
                     <div class="current-service-estimate">
                       <span>Estimated right now</span>
                       <strong>About ${completionEstimate.estimatedMinutes} minutes</strong>
                     </div>
                     <small>${completionEstimate.driverCount} approved ${completionEstimate.driverCount === 1 ? "driver" : "drivers"} &bull; ${completionEstimate.demandLabel} &bull; ${completionEstimate.paceLabel}</small>
                   </div>
                 `
                 : ""
             }
             <div class="product-footer">
              <strong>${service.price ? money(service.price) : "Customer chooses"}</strong>
              ${serviceControls}
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");
  if (currentCustomerPage === "customerAreas") {
    const requirement = getDeliveryServiceAreaRequirement();
    const forcedChoice = Boolean(serviceAreaReturnPage && requirement.required);
    customerNextButtons.forEach((button) => {
      button.textContent =
        forcedChoice && requirement.tier && getSelectedServiceAreaId() !== requirement.tier.serviceId
          ? `Select Service Area Tier ${requirement.tier.tier}`
          : forcedChoice && requirement.customQuote
            ? "Custom quote required"
            : forcedChoice
              ? "Continue back to drop-off info"
              : hasServiceArea()
                ? "Continue with Additional Service Area"
                : "No Additional Fee Needed";
    });
  }
}

function hasMainService() {
  return [...cart.values()].some((item) => item.service.category === "Main Services");
}

function renderCart() {
  const entries = [...cart.values()];
  const totals = getCartTotals();

  if (serviceInfoSummary) {
    serviceInfoSummary.innerHTML = entries.length
      ? `
        <strong>Selected services</strong>
        ${entries
          .map(
            ({ service, quantity }) =>
              `<span>${quantity} x ${service.name} - ${money(getServiceLineTotal(service, quantity))}</span>`
          )
          .join("")}
      `
      : `
        <strong>Selected services</strong>
        <span>Your selected service and add-ons will appear here.</span>
      `;
  }

  if (cartCount) {
    cartCount.textContent = totals.totalItems;
  }
  discountTotal.textContent = `-${money(totals.discount + totals.membershipSavings)}`;
  shoppingHoldTotal.textContent = money(totals.shoppingHold);
  cartTotal.textContent = money(totals.total);
  if (customerRunningTotal) {
    customerRunningTotal.textContent = money(totals.total);
  }
  if (embeddedCheckoutTotal) {
    embeddedCheckoutTotal.textContent = money(totals.total);
  }
  renderRequestValidation();
  renderDeliveryServiceAreaWarning();
  renderShopDetailsVisibility();
  renderCheckoutCarryover();
  saveCurrentRequestDraft();

  if (currentCustomerPage === "customerCheckout") {
    return;
  }

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
            <strong>${money(getServiceLineTotal(service, quantity))}</strong>
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
  const tip = getTipAmount();
  const restaurantFood = getRestaurantFoodTotals();
  const totalItems = entries.reduce((sum, item) => sum + item.quantity, 0) + restaurantFood.totalItems;
  const regularSubtotal = entries.reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const subtotal = entries.reduce((sum, item) => sum + getServiceLineTotal(item.service, item.quantity), 0);
  const serviceCharge = entries
    .filter((item) => item.service.category === "Main Services")
    .reduce((sum, item) => sum + getServiceLineTotal(item.service, item.quantity), 0);
  const addonCharges = entries
    .filter((item) => item.service.category === "Add-ons")
    .reduce((sum, item) => sum + getServiceLineTotal(item.service, item.quantity), 0);
  const serviceAreaCharge = entries
    .filter((item) => item.service.category === "Service Areas")
    .reduce((sum, item) => sum + getServiceLineTotal(item.service, item.quantity), 0);
  const regularServiceCharge = entries
    .filter((item) => item.service.category === "Main Services")
    .reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const regularAddonCharges = entries
    .filter((item) => item.service.category === "Add-ons")
    .reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const regularServiceAreaCharge = entries
    .filter((item) => item.service.category === "Service Areas")
    .reduce((sum, item) => sum + item.service.price * item.quantity, 0);
  const membershipSavings = Math.max(0, regularSubtotal - subtotal);
  const discount = getDiscount(subtotal);
  const shoppingHold = selectedShopAndDeliver() ? getShoppingHoldTotal() : 0;
  const taxableSubtotal = Math.max(subtotal - discount, 0);
  const tax = taxableSubtotal * defaultTaxSettings.rate;
  return {
    totalItems,
    regularSubtotal,
    subtotal,
    serviceCharge,
    addonCharges,
    serviceAreaCharge,
    regularServiceCharge,
    regularAddonCharges,
    regularServiceAreaCharge,
    membershipSavings,
    discount,
    tip,
    tax,
    taxRate: defaultTaxSettings.rate,
    taxArea: defaultTaxSettings.area,
    shoppingHold,
    restaurantFoodSubtotal: restaurantFood.subtotal,
    restaurantFoodTax: restaurantFood.tax,
    total: taxableSubtotal + tax + tip + shoppingHold + restaurantFood.subtotal + restaurantFood.tax,
  };
}

function getActiveMembershipPlan() {
  if (!currentMembership?.active) return null;
  return membershipPlans.find((plan) => plan.id === currentMembership.planId) || null;
}

function getServiceLineTotal(service, quantity) {
  const plan = getActiveMembershipPlan();
  if (!plan) return service.price * quantity;
  const usage = getMembershipUsage();
  const remainingPickup = Math.max((plan.freePickupMonthly || 0) - (usage.pickup || 0), 0);
  const remainingShop = Math.max((plan.freeShopMonthly || 0) - (usage.shop || 0), 0);
  const remainingRush = Math.max((plan.freeRushMonthly || 0) - (usage.rush || 0), 0);

  if (plan.id === "community-heroes") {
    if (service.id === 1) return Math.max(0, quantity - remainingPickup) * (service.price * 0.9);
    if (service.id === 2) return service.price * quantity * 0.8;
    if (service.id === 3) return service.price * quantity * 0.85;
    if (service.id === 4) return Math.max(0, quantity - remainingRush) * service.price;
  }

  if (plan.id === "hopes-go-plus") {
    if (service.id === 1) return Math.max(0, quantity - remainingPickup) * 8;
    if (service.id === 2) return quantity * 13.5;
    if (service.id === 3) return quantity * 18;
    if (service.id === 4) return Math.max(0, quantity - remainingRush) * service.price;
    if ([10, 11, 12].includes(service.id)) return service.price * quantity * 0.9;
  }

  if (plan.id === "senior-go-plus") {
    if (service.id === 1) return Math.max(0, quantity - remainingPickup) * 7;
    if (service.id === 2) return Math.max(0, quantity - remainingShop) * 10;
    if (service.id === 3) return quantity * 15;
    if (service.id === 4) return 0;
    if (service.id === 5) return quantity * 3;
    if (service.id === 12) return service.price * quantity * 0.9;
  }

  return service.price * quantity;
}

function selectedShopAndDeliver() {
  return [...cart.values()].some((item) => item.service.name === "Shop & Deliver");
}

function getShoppingProductLabel(product) {
  return [product.brand, product.name, product.size].filter(Boolean).join(" - ");
}

function getSelectedShoppingRetailer() {
  const name = shoppingStoreInput?.value.trim() || "";
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const retailer = normalized.includes("walmart") || normalized.includes("wal mart")
    ? "walmart"
    : normalized.includes("hy vee") || normalized.includes("hyvee")
      ? "hyvee"
      : normalized.includes("aldi")
        ? "aldi"
        : normalized.includes("dollar general") || normalized === "dg"
          ? "dollar-general"
          : "other";
  return {
    id: retailer,
    name: name || "Other store",
  };
}

function getShoppingStoreSelectionKey() {
  return (shoppingStoreInput?.value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getSelectedShoppingEstimateEntries() {
  return selectedShoppingProducts.map((product) => {
    const exactCatalogPrice = Number(product.price) > 0
      ? ` $${Number(product.price).toFixed(2)} each`
      : "";
    return `${product.quantity}x ${getShoppingProductLabel(product)}${exactCatalogPrice}`;
  });
}

function renderSelectedShoppingProducts() {
  if (!selectedShoppingProductsBoard) return;
  if (!selectedShoppingProducts.length) {
    selectedShoppingProductsBoard.innerHTML = `<span>No exact products selected yet.</span>`;
    return;
  }

  selectedShoppingProductsBoard.innerHTML = selectedShoppingProducts
    .map((product) => {
      const price = Number(product.price || 0);
      const priceLabel = price
        ? `${money(price)}${product.priceType === "estimate" ? " estimated" : " catalog price"}`
        : "Price review needed";
      return `
        <article class="selected-shopping-product">
          <div class="shopping-product-icon" aria-hidden="true">${escapeHtml((product.brand || product.name || "P").slice(0, 1).toUpperCase())}</div>
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>${escapeHtml([product.brand, product.size].filter(Boolean).join(" • "))}</span>
            <small>${escapeHtml(priceLabel)} • ${escapeHtml(product.availability || "Availability must be verified")}</small>
          </div>
          <div class="shopping-product-quantity" aria-label="Quantity for ${escapeHtml(product.name)}">
            <button type="button" data-shopping-product-action="decrease" data-shopping-product-id="${escapeHtml(product.id)}" aria-label="Decrease ${escapeHtml(product.name)} quantity">−</button>
            <strong>${product.quantity}</strong>
            <button type="button" data-shopping-product-action="increase" data-shopping-product-id="${escapeHtml(product.id)}" aria-label="Increase ${escapeHtml(product.name)} quantity">+</button>
            <button class="remove-shopping-product" type="button" data-shopping-product-action="remove" data-shopping-product-id="${escapeHtml(product.id)}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderShoppingProductSuggestions(result) {
  if (!shoppingProductSuggestions || !shoppingCatalogStatus) return;
  latestShoppingProductSuggestions = Array.isArray(result.items) ? result.items : [];
  shoppingCatalogStatus.textContent = result.note || "Choose the exact product you want.";
  shoppingProductSuggestions.hidden = false;
  shoppingProductSuggestions.innerHTML = latestShoppingProductSuggestions.length
    ? latestShoppingProductSuggestions
        .map((product) => {
          const price = Number(product.price || 0);
          const priceLabel = price
            ? `${money(price)}${product.priceType === "estimate" ? " est." : ""}`
            : "Price unavailable";
          return `
            <button class="shopping-product-suggestion" type="button" data-shopping-product-suggestion-id="${escapeHtml(product.id)}">
              <span class="shopping-product-icon" aria-hidden="true">${escapeHtml((product.brand || product.name || "P").slice(0, 1).toUpperCase())}</span>
              <span>
                <strong>${escapeHtml(product.name)}</strong>
                <small>${escapeHtml([product.brand, product.size, product.category].filter(Boolean).join(" • "))}</small>
                <small>${escapeHtml(product.availability || "Availability must be verified")}</small>
              </span>
              <strong>${escapeHtml(priceLabel)}</strong>
            </button>
          `;
        })
        .join("")
    : `<div class="shopping-product-empty">No catalog matches found. Add it under custom items for price review.</div>`;
}

async function searchShoppingProducts(query) {
  const sequence = ++shoppingProductSearchSequence;
  shoppingCatalogStatus.textContent = "Searching product catalog...";
  try {
    const retailer = getSelectedShoppingRetailer();
    const response = await fetch(
      apiUrl(`/product-suggestions?q=${encodeURIComponent(query)}&limit=8&store=${encodeURIComponent(retailer.name)}`),
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Product search failed.");
    const result = await response.json();
    if (sequence !== shoppingProductSearchSequence) return;
    renderShoppingProductSuggestions(result);
  } catch {
    if (sequence !== shoppingProductSearchSequence) return;
    latestShoppingProductSuggestions = [];
    shoppingProductSuggestions.hidden = false;
    shoppingProductSuggestions.innerHTML = `<div class="shopping-product-empty">Product search is temporarily unavailable. Add the item under custom items.</div>`;
    shoppingCatalogStatus.textContent = "Catalog connection unavailable.";
  }
}

function scheduleShoppingProductSearch() {
  const query = shoppingProductSearch.value.trim();
  const retailer = getSelectedShoppingRetailer();
  window.clearTimeout(shoppingProductSearchTimer);
  shoppingProductSearchSequence += 1;
  if (!shoppingStoreInput.value.trim()) {
    latestShoppingProductSuggestions = [];
    shoppingProductSuggestions.hidden = true;
    shoppingProductSuggestions.innerHTML = "";
    shoppingCatalogStatus.textContent = "Type the shopping store first, then search for a product.";
    return;
  }
  if (query.length < 2) {
    latestShoppingProductSuggestions = [];
    shoppingProductSuggestions.hidden = true;
    shoppingProductSuggestions.innerHTML = "";
    shoppingCatalogStatus.textContent = `${retailer.name} selected. Type at least 2 letters to search the monthly catalog.`;
    return;
  }
  shoppingProductSearchTimer = window.setTimeout(() => searchShoppingProducts(query), 250);
}

function handleShoppingStoreInput() {
  const nextStoreKey = getShoppingStoreSelectionKey();
  const storeChanged = Boolean(shoppingStoreSelectionKey && nextStoreKey !== shoppingStoreSelectionKey);
  const retailer = getSelectedShoppingRetailer();
  shoppingStoreSelectionKey = nextStoreKey;
  if (storeChanged) {
    selectedShoppingProducts = [];
    latestShoppingProductSuggestions = [];
    shoppingProductSearch.value = "";
    shoppingProductSuggestions.hidden = true;
    shoppingProductSuggestions.innerHTML = "";
    renderSelectedShoppingProducts();
    renderShoppingEstimate();
  }
  shoppingCatalogStatus.textContent = retailer.name === "Other store"
    ? "Type the shopping store first, then search for a product."
    : `${retailer.name} selected. Type at least 2 letters to search the monthly catalog.`;
  saveCurrentRequestDraft();
}

function addSelectedShoppingProduct(product) {
  const existing = selectedShoppingProducts.find((item) => item.id === product.id);
  if (existing) existing.quantity += 1;
  else selectedShoppingProducts.push({ ...product, quantity: 1 });
  shoppingProductSearch.value = "";
  shoppingProductSuggestions.hidden = true;
  shoppingProductSuggestions.innerHTML = "";
  latestShoppingProductSuggestions = [];
  shoppingCatalogStatus.textContent = "Exact product added. Search for another item.";
  renderSelectedShoppingProducts();
  renderShoppingEstimate();
}

function updateSelectedShoppingProduct(productId, action) {
  const product = selectedShoppingProducts.find((item) => item.id === productId);
  if (!product) return;
  if (action === "increase") product.quantity += 1;
  if (action === "decrease") product.quantity = Math.max(1, product.quantity - 1);
  if (action === "remove") selectedShoppingProducts = selectedShoppingProducts.filter((item) => item.id !== productId);
  renderSelectedShoppingProducts();
  renderShoppingEstimate();
}

function parseShoppingItems() {
  return shoppingListInput.value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function roundShoppingMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function parseShoppingItemEntry(item) {
  let description = String(item || "").trim();
  let quantity = 1;

  const prefixQuantity = description.match(/^(?:qty\s*)?(\d{1,2})\s*[x×]\s*/i);
  const suffixQuantity = description.match(/\s+[x×]\s*(\d{1,2})\s*$/i);
  const plainQuantity = description.match(/^(\d{1,2})\s+(?!pack\b|ct\b|count\b|lb\b|lbs\b|oz\b|gallon\b|liter\b)/i);
  if (prefixQuantity) {
    quantity = Math.max(1, Math.min(99, Number(prefixQuantity[1])));
    description = description.slice(prefixQuantity[0].length).trim();
  } else if (suffixQuantity) {
    quantity = Math.max(1, Math.min(99, Number(suffixQuantity[1])));
    description = description.slice(0, suffixQuantity.index).trim();
  } else if (plainQuantity) {
    quantity = Math.max(1, Math.min(99, Number(plainQuantity[1])));
    description = description.slice(plainQuantity[0].length).trim();
  }

  const enteredPrice = description.match(/\$([\d,]+(?:\.\d{1,2})?)\s*(total|each|ea\.?|per item)?/i);
  let explicitUnitPrice = null;
  let enteredPriceNeedsReview = false;
  if (enteredPrice) {
    const enteredAmount = Number(enteredPrice[1].replace(/,/g, ""));
    const enteredUnitPrice = String(enteredPrice[2] || "").toLowerCase() === "total"
      ? enteredAmount / quantity
      : enteredAmount;
    enteredPriceNeedsReview = !Number.isFinite(enteredUnitPrice) || enteredUnitPrice > MAX_CUSTOM_ITEM_UNIT_ESTIMATE;
    explicitUnitPrice = enteredPriceNeedsReview ? null : enteredUnitPrice;
    description = description.replace(enteredPrice[0], "").trim();
  }

  return {
    raw: String(item || "").trim(),
    description: description || String(item || "").trim(),
    quantity,
    explicitUnitPrice: explicitUnitPrice === null ? null : roundShoppingMoney(explicitUnitPrice),
    enteredPriceNeedsReview,
  };
}

function findShoppingCatalogPrice(description) {
  const normalized = String(description || "").toLowerCase();
  return shoppingPriceCatalog.find((entry) => entry.aliases.some((alias) => normalized.includes(alias))) || null;
}

function calculateShoppingEstimate(items) {
  const result = {
    typical: 0,
    low: 0,
    high: 0,
    unknownCount: 0,
    explicitCount: 0,
    catalogCount: 0,
    unitCount: 0,
    unknownItems: [],
    details: [],
  };

  items.map(parseShoppingItemEntry).forEach((item) => {
    const catalogPrice = findShoppingCatalogPrice(item.description);
    const price = item.explicitUnitPrice === null
      ? catalogPrice || unknownShoppingItemRange
      : { typical: item.explicitUnitPrice, low: item.explicitUnitPrice, high: item.explicitUnitPrice };

    let source = "Needs review";
    if (item.explicitUnitPrice !== null) {
      result.explicitCount += 1;
      source = "Selected or entered price";
    }
    else if (catalogPrice) {
      result.catalogCount += 1;
      source = "Recognized average";
    }
    else {
      result.unknownCount += 1;
      result.unknownItems.push(item.description);
      source = item.enteredPriceNeedsReview ? "Entered price needs review" : "Needs review";
    }

    result.unitCount += item.quantity;
    result.typical += price.typical * item.quantity;
    result.low += price.low * item.quantity;
    result.high += price.high * item.quantity;
    result.details.push({
      description: item.description,
      quantity: item.quantity,
      source,
      unitTypical: roundShoppingMoney(price.typical),
      unitLow: roundShoppingMoney(price.low),
      unitHigh: roundShoppingMoney(price.high),
      lineTypical: roundShoppingMoney(price.typical * item.quantity),
      lineLow: roundShoppingMoney(price.low * item.quantity),
      lineHigh: roundShoppingMoney(price.high * item.quantity),
    });
  });

  result.typical = roundShoppingMoney(result.typical);
  result.low = roundShoppingMoney(result.low);
  result.high = roundShoppingMoney(result.high);
  return result;
}

function closeShoppingPriceModal() {
  if (!shoppingPriceModal) return;
  shoppingPriceModal.hidden = true;
  document.body.classList.remove("shopping-price-modal-open");
  estimateShoppingButton?.focus();
}

function openShoppingPriceModal() {
  renderShoppingEstimate();
  const customItems = parseShoppingItems();
  const selectedProductItems = getSelectedShoppingEstimateEntries();
  const items = [...selectedProductItems, ...customItems];
  const estimate = calculateShoppingEstimate(items);
  if (!shoppingPriceModal || !shoppingPriceModalBody) return;

  if (!estimate.details.length) {
    shoppingPriceModalBody.innerHTML = `
      <div class="shopping-price-empty">
        <strong>No products to estimate yet.</strong>
        <span>Add exact products or custom list items, then try again.</span>
      </div>
    `;
  } else {
    const rows = estimate.details.map((detail) => {
      const range = detail.unitLow === detail.unitHigh
        ? money(detail.unitTypical)
        : `${money(detail.unitLow)}-${money(detail.unitHigh)}`;
      const sourceClass = detail.source.toLowerCase().includes("needs review") ? "needs-review" : "ready";
      return `
        <tr>
          <td data-label="Product"><strong>${escapeHtml(detail.description)}</strong><small class="shopping-price-source ${sourceClass}">${escapeHtml(detail.source)}</small></td>
          <td data-label="Quantity">${detail.quantity}</td>
          <td data-label="Unit estimate"><strong>${money(detail.unitTypical)}</strong><small>${range} range</small></td>
          <td data-label="Estimated total"><strong>${money(detail.lineTypical)}</strong>${detail.lineLow === detail.lineHigh ? "" : `<small>${money(detail.lineLow)}-${money(detail.lineHigh)}</small>`}</td>
        </tr>
      `;
    }).join("");
    const cushion = getShoppingCushion();
    shoppingPriceModalBody.innerHTML = `
      <div class="shopping-price-table-wrap">
        <table class="shopping-price-table">
          <thead><tr><th>Product</th><th>Qty</th><th>Unit estimate</th><th>Estimated total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="shopping-price-summary">
        <span><strong>Products:</strong> ${money(estimate.typical)}</span>
        <span><strong>Likely range:</strong> ${money(estimate.low)}-${money(estimate.high)}</span>
        <span><strong>Uncertainty cushion:</strong> ${money(cushion)}</span>
        <span class="shopping-price-hold"><strong>Shopping estimate hold:</strong> ${money(getShoppingHoldTotal())}</span>
      </div>
      ${estimate.unknownCount ? `<p class="shopping-price-review-note"><strong>${estimate.unknownCount} item(s) need review.</strong> These rows use the default estimate until a specific product or catalog price is added.</p>` : `<p class="shopping-price-review-note ready"><strong>Every item has a specific or recognized price.</strong></p>`}
    `;
  }

  shoppingPriceModal.hidden = false;
  document.body.classList.add("shopping-price-modal-open");
  shoppingPriceModalClose?.focus();
}

function renderShopDetailsVisibility() {
  shopDetailsPanel.classList.toggle("active", selectedShopAndDeliver());
  additionalStopDetails?.classList.toggle("active", selectedAdditionalStop());
}

function selectedAdditionalStop() {
  return [...cart.values()].some((item) => item.service.id === 5);
}

function renderShoppingEstimate() {
  const customItems = parseShoppingItems();
  const selectedProductItems = getSelectedShoppingEstimateEntries();
  const items = [...selectedProductItems, ...customItems];
  const photos = [...shoppingPhotoInput.files].map((file) => file.name);
  const estimate = calculateShoppingEstimate(items);
  shoppingEstimateTotal = estimate.typical;
  shoppingEstimateRange = {
    low: estimate.low,
    high: estimate.high,
    unknownCount: estimate.unknownCount,
    explicitCount: estimate.explicitCount,
    catalogCount: estimate.catalogCount,
    unitCount: estimate.unitCount,
  };

  if (!items.length && !photos.length) {
    shoppingEstimate.innerHTML = `
      <strong>Shopping estimate</strong>
      <span>Add a list or photo to estimate average item prices.</span>
    `;
    saveCurrentRequestDraft();
    return;
  }

  if (!items.length && photos.length) {
    shoppingEstimate.innerHTML = `
      <strong>Photo list needs price review</strong>
      <span>${photos.length} photo upload(s) received.</span>
      <span>Type the items in the text list for an automatic price range. The app does not guess prices from a photo filename.</span>
    `;
    renderCart();
    return;
  }

  const needsReview = estimate.unknownCount > 0 || photos.length > 0;
  const confidenceLabel = needsReview
    ? "Price review recommended"
    : estimate.explicitCount === items.length
      ? "High confidence - customer-entered prices"
      : "Good estimate - all items recognized";
  const unknownLabel = estimate.unknownCount
    ? `<span class="shopping-estimate-warning">${estimate.unknownCount} item(s) need price review: ${estimate.unknownItems.slice(0, 3).map(escapeHtml).join(", ")}</span>`
    : "";

  shoppingEstimate.innerHTML = `
    <strong>${money(getShoppingHoldTotal())} shopping estimate hold</strong>
    <span>Likely item range: ${money(estimate.low)}-${money(estimate.high)}</span>
    <span>${money(shoppingEstimateTotal)} working estimate + ${money(getShoppingCushion())} uncertainty cushion</span>
    <span>${estimate.unitCount} total unit(s) across ${selectedShoppingProducts.length} exact product(s) and ${customItems.length} custom item(s)${photos.length ? `, ${photos.length} photo upload(s)` : ""}</span>
    <span class="shopping-estimate-confidence ${needsReview ? "needs-review" : "ready"}">${confidenceLabel}</span>
    ${unknownLabel}
    <span>Final receipt pricing replaces this estimate. Unused shopping funds are refunded immediately.</span>
  `;
  renderCart();
}

function getShoppingCushion() {
  if (!shoppingEstimateTotal) return 0;
  const minimumCushion = Math.max(2, shoppingEstimateTotal * 0.05);
  const rangeCushion = Math.max(0, shoppingEstimateRange.high - shoppingEstimateTotal);
  return roundShoppingMoney(Math.max(minimumCushion, rangeCushion));
}

function getShoppingHoldTotal() {
  return roundShoppingMoney(shoppingEstimateTotal + getShoppingCushion());
}

function hasServiceArea() {
  return [...cart.values()].some((item) => item.service.category === "Service Areas");
}

function renderTipChoice() {
  const showTipAmount = tipChoiceMode === "enter";
  tipChoiceCard?.classList.toggle("tip-entering", showTipAmount);
  tipAmountField?.classList.toggle("hidden-field", !showTipAmount);
  applyTipButton?.classList.toggle("hidden-field", !showTipAmount);
}

function setCustomerStatus(message = "") {
  if (checkoutStatus) checkoutStatus.textContent = message;
  if (customerFlowStatus) customerFlowStatus.textContent = message;
}

function calculateExtendedServiceAreaFee(miles) {
  const distance = Number(miles || 0);
  if (!distance || distance <= 35) return 0;
  return 20 + Math.ceil(distance - 35);
}

function pruneExpiredTestRequests(list) {
  const now = Date.now();
  return list.filter((request) => {
    if (!request.testMode) return true;
    const createdAt = Number(request.createdAtMs || Date.parse(request.createdAt));
    if (!createdAt) return true;
    return now - createdAt < TEST_REQUEST_TTL_MS;
  });
}

function getRequestValidationMessage() {
  if (!cart.size) return "Choose a main service to start.";
  if (!hasMainService()) return "Choose a main service before add-ons or service areas.";

  const serviceAreaRequirement = getDeliveryServiceAreaRequirement();
  if (serviceAreaRequirement.required) {
    const selectedServiceAreaId = getSelectedServiceAreaId();
    if (serviceAreaRequirement.customQuote || selectedServiceAreaId !== serviceAreaRequirement.tier.serviceId) {
      return getServiceAreaRequirementMessage(serviceAreaRequirement);
    }
  }

  if (selectedAdditionalStop() && !additionalStopAddress.value.trim()) {
    return "Add the additional stop address before checkout.";
  }

  if (selectedShopAndDeliver()) {
    if (!shoppingStoreInput.value.trim()) {
      return "Enter the shopping store name before checkout.";
    }
    if (!selectedShoppingProducts.length && !parseShoppingItems().length && !shoppingPhotoInput.files.length) {
      return "Select an exact product, add a custom shopping item, or upload a shopping list photo.";
    }
  }

  return "";
}

function renderRequestValidation() {
  requestValidation.textContent = getRequestValidationMessage();
}

function getCartPayload() {
  const customer = getCurrentCustomer();
  const totals = getCartTotals();
  const deliveryMethod = getDeliveryMethod();
  const plan = getActiveMembershipPlan();
  return {
    items: [...cart.values()].map(({ service, quantity }) => ({
      id: service.id,
      quantity,
    })),
    tip: getTipAmount(),
    discountCode: discountInput.value.trim().toUpperCase(),
    membershipCode: plan?.internalCode || "",
    membershipName: plan?.name || "",
    membershipUsage: getMembershipUsage(),
    customer,
    deliveryMethod,
    deliveryPin: deliveryMethod === "hand_to_customer" ? getDeliveryPin() : "",
    requestToken: getCurrentRequestToken(),
    total: totals.total,
    subtotal: totals.subtotal,
    serviceCharge: totals.serviceCharge,
    addonCharges: totals.addonCharges,
    serviceAreaCharge: totals.serviceAreaCharge,
    regularSubtotal: totals.regularSubtotal,
    membershipSavings: totals.membershipSavings,
    discount: totals.discount,
    tax: totals.tax,
    taxRate: totals.taxRate,
    taxArea: totals.taxArea,
    restaurantOrder: getRestaurantOrderPayload(),
    shopping: {
      items: parseShoppingItems(),
      products: selectedShoppingProducts.map((product) => ({ ...product })),
      retailer: getSelectedShoppingRetailer(),
      estimate: shoppingEstimateTotal,
      estimateDetails: calculateShoppingEstimate([
        ...getSelectedShoppingEstimateEntries(),
        ...parseShoppingItems(),
      ]).details,
      rangeLow: shoppingEstimateRange.low,
      rangeHigh: shoppingEstimateRange.high,
      unknownCount: shoppingEstimateRange.unknownCount,
      cushion: getShoppingCushion(),
      holdTotal: selectedShopAndDeliver() ? getShoppingHoldTotal() : 0,
      photos: [...shoppingPhotoInput.files].map((file) => file.name),
    },
    additionalStop: selectedAdditionalStop()
      ? {
          address: additionalStopAddress.value.trim(),
          notes: additionalStopNotes.value.trim(),
        }
      : null,
  };
}

function getCurrentCustomer() {
  return {
    ...(customerProfile || {}),
    name: profileFields.name.value.trim() || customerProfile?.name || "",
    phone: profileFields.phone.value.trim() || customerProfile?.phone || "",
    email: profileFields.email.value.trim() || customerProfile?.email || "",
    pickupAddress: profileFields.pickupAddress.value.trim(),
    deliveryAddress: profileFields.deliveryAddress.value.trim() || customerProfile?.deliveryAddress || "",
    pickupInstructions: profileFields.pickupInstructions?.value.trim() || "",
    dropoffInstructions: profileFields.dropoffInstructions?.value.trim() || "",
    notes: profileFields.notes.value.trim() || customerProfile?.notes || "",
  };
}

function renderCheckoutCarryover() {
  const customer = getCurrentCustomer();
  const totals = getCartTotals();
  const plan = getActiveMembershipPlan();
  const deliveryMethod = getDeliveryMethod();
  const pin = deliveryMethod === "hand_to_customer" ? getDeliveryPin() : "";
  const entries = [...cart.values()];
  const mainServices = entries.filter((item) => item.service.category === "Main Services");
  const addons = entries.filter((item) => item.service.category === "Add-ons");
  const serviceAreas = entries.filter((item) => item.service.category === "Service Areas");
  const lineList = (items, emptyText) =>
    items.length
      ? items.map(({ service, quantity }) => `<span>${quantity} x ${service.name}</span>`).join("")
      : `<span>${emptyText}</span>`;

  if (checkoutOrderCard) {
    checkoutOrderCard.innerHTML = `
      <h3>Order Info</h3>
      <div class="checkout-card-lines">
        <strong>Selected service</strong>
        ${lineList(mainServices, "No main service selected")}
        <strong>Add-ons</strong>
        ${lineList(addons, "No add-ons selected")}
        <strong>Service area</strong>
        ${serviceAreas.length ? lineList(serviceAreas, "No additional service area fee") : `<span>No additional service area fee needed</span>`}
        ${plan ? `<strong>Membership</strong><span>${plan.name} savings applied automatically</span>` : ""}
      </div>
    `;
  }

  if (requestProfile) {
    requestProfile.innerHTML = `
      <h3>Customer Info</h3>
      <div class="checkout-card-lines">
        <strong>${displayValue(customer.name, "Customer name needed")}</strong>
        <span>${displayValue(customer.phone, "Phone needed")}</span>
        <span>${displayValue(customer.email, "Email needed")}</span>
      </div>
    `;
  }

  if (checkoutPickupCard) {
    checkoutPickupCard.innerHTML = `
      <h3>Pickup Info</h3>
      <div class="checkout-card-lines">
        <strong>${displayValue(customer.pickupAddress, "Pickup location needed")}</strong>
        <span>${displayValue(customer.pickupInstructions, "No pickup instructions")}</span>
      </div>
    `;
  }

  if (checkoutDropoffCard) {
    checkoutDropoffCard.innerHTML = `
      <h3>Drop-Off Info</h3>
      <div class="checkout-card-lines">
        <strong>${displayValue(customer.deliveryAddress, "Drop-off address needed")}</strong>
        <span>${displayValue(customer.dropoffInstructions, "No drop-off instructions")}</span>
        <span>${formatDeliveryMethod(deliveryMethod)}</span>
      </div>
    `;
  }

  if (checkoutPaymentSummary) {
    checkoutPaymentSummary.innerHTML = `
      <h3>Payment Summary</h3>
      ${totals.restaurantFoodSubtotal ? `<div class="payment-line"><span>${escapeHtml(selectedRestaurantOrder?.restaurant?.storeName || "Restaurant")} food</span><strong>${money(totals.restaurantFoodSubtotal)}</strong></div><div class="payment-line"><span>Restaurant food tax</span><strong>${money(totals.restaurantFoodTax)}</strong></div>` : ""}
      <div class="payment-line"><span>Service charge</span><strong>${money(totals.regularServiceCharge)}</strong></div>
      <div class="payment-line"><span>Add-on charges</span><strong>${money(totals.regularAddonCharges)}</strong></div>
      <div class="payment-line"><span>Additional service area charge</span><strong>${money(totals.regularServiceAreaCharge)}</strong></div>
      ${selectedShopAndDeliver() ? `<div class="payment-line"><span>Shopping estimate hold</span><strong>${money(totals.shoppingHold)}</strong></div>` : ""}
      <div class="payment-line"><span>Tip</span><strong>${money(totals.tip)}</strong></div>
      ${totals.membershipSavings ? `<div class="payment-line"><span>Membership savings</span><strong>-${money(totals.membershipSavings)}</strong></div>` : ""}
      <div class="payment-line"><span>Tax (${Math.round(totals.taxRate * 10000) / 100}%)</span><strong>${money(totals.tax)}</strong></div>
      <div class="payment-line"><span>Discount</span><strong>-${money(totals.discount)}</strong></div>
      <div class="payment-line payment-total"><span>Estimated total</span><strong>${money(totals.total)}</strong></div>
      <p class="tax-note">${totals.taxArea}</p>
    `;
  }

  if (checkoutPaymentNotice) {
    checkoutPaymentNotice.textContent = selectedShopAndDeliver()
      ? "No charge until Hope's & Go accepts your request. Unused shopping estimate funds are refunded immediately when shopping is completed."
      : "No charge until Hope's & Go accepts your request.";
  }

  checkoutCarryover.innerHTML = "";
  if (deliveryPinCard) {
    deliveryPinCard.innerHTML =
      deliveryMethod === "hand_to_customer"
        ? `<h3>Delivery Code</h3><div class="delivery-code-badge">${pin}</div><p>Give this code to your driver at handoff.</p>`
        : `<h3>Delivery Code</h3><div class="delivery-code-badge">Photo</div><p>No-contact delivery selected. Your driver will upload a drop-off photo.</p>`;
  }
}

function renderCustomerAccountPage() {
  const accountPage = document.querySelector("#customerAccountPage");
  if (!accountPage) return;
  const customer = getCurrentCustomer();
  const plan = getActiveMembershipPlan();
  accountPage.setAttribute("aria-hidden", String(currentCustomerMode !== "account"));
  accountPage.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Profile</p>
        <h2>Your Hope's & Go account</h2>
      </div>
      <button class="secondary-admin-action" type="button" data-customer-menu-action="home">Back home</button>
    </div>
    <div class="account-grid">
      <article class="account-card account-profile-card">
        <div class="profile-avatar">${escapeHtml((customer.name || "H").slice(0, 1).toUpperCase())}</div>
        <div>
          <h3>${escapeHtml(customer.name || "Customer profile")}</h3>
          <p>${escapeHtml(customer.phone || "Add a phone number")}</p>
          <p>${escapeHtml(customer.email || "Add an email address")}</p>
        </div>
      </article>
      <article class="account-card">
        <h3>Home Address</h3>
        <p>${escapeHtml(customer.deliveryAddress || "No home address saved yet.")}</p>
        <button class="secondary-admin-action compact-edit-action" type="button" data-customer-menu-action="profile-edit">Edit profile</button>
      </article>
      <article class="account-card">
        <h3>Security</h3>
        <p>Password and contact changes will use text verification before they save.</p>
        <button class="secondary-admin-action compact-edit-action" type="button" data-account-action="change-password">Change password</button>
        <button class="secondary-admin-action compact-edit-action" type="button" data-account-action="verify-contact">Add or verify phone/email</button>
      </article>
      <article class="account-card">
        <h3>Membership</h3>
        <p>${plan ? `${escapeHtml(plan.name)} is active. Benefits apply automatically.` : "No active membership."}</p>
        <button class="secondary-admin-action compact-edit-action" type="button" data-customer-menu-action="memberships">View memberships</button>
      </article>
    </div>
    <p class="checkout-status" id="customerAccountStatus"></p>
  `;
}

function renderCustomerOrdersPage() {
  const ordersPage = document.querySelector("#customerOrdersPage");
  if (!ordersPage) return;
  ordersPage.setAttribute("aria-hidden", String(currentCustomerMode !== "orders"));
  const customer = getCurrentCustomer();
  const customerRequests = requests.filter(
    (request) =>
      (customer.email && request.email?.toLowerCase() === customer.email.toLowerCase()) ||
      (customer.phone && normalizePhone(request.phone) === normalizePhone(customer.phone))
  );
  ordersPage.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Orders</p>
        <h2>Past orders</h2>
      </div>
      <button class="secondary-admin-action" type="button" data-customer-menu-action="home">Back home</button>
    </div>
    <div class="account-grid">
      ${
        customerRequests.length
          ? customerRequests
              .map(
                (request) => `
                  <article class="account-card">
                    <h3>${escapeHtml(request.id)}</h3>
                    <p>${escapeHtml(request.items || "Request")}</p>
                    <p>${escapeHtml(request.status || "Submitted")}</p>
                    <strong>${money(Number(request.total || 0))}</strong>
                    ${
                      request.assignedDriver && ["Accepted by driver", "Completed"].includes(request.status)
                        ? `<div class="request-conversation-stack">
                            ${renderConversation(request, "customer", {
                              channel: MESSAGE_CHANNEL_CUSTOMER_DRIVER,
                              title: "Message your driver",
                            })}
                            ${renderConversation(request, "customer", {
                              channel: MESSAGE_CHANNEL_ADMIN_CUSTOMER,
                              title: "Private message with Hope's & Go",
                            })}
                          </div>`
                        : ""
                    }
                  </article>
                `
              )
              .join("")
          : `<article class="account-card"><h3>No past orders yet</h3><p>Your submitted requests will appear here.</p></article>`
      }
    </div>
  `;
}

function renderCustomerPaymentsPage() {
  const paymentsPage = document.querySelector("#customerPaymentsPage");
  if (!paymentsPage) return;
  paymentsPage.setAttribute("aria-hidden", String(currentCustomerMode !== "payments"));
  paymentsPage.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">Payments</p>
        <h2>Saved cards and banks</h2>
      </div>
      <button class="secondary-admin-action" type="button" data-customer-menu-action="home">Back home</button>
    </div>
    <div class="account-grid">
      <article class="account-card">
        <h3>Saved payment methods</h3>
        <p>Cards and banks will be managed through Stripe after checkout is connected to your live customer portal.</p>
        <button class="secondary-admin-action compact-edit-action" type="button" data-account-action="payment-portal">Open payment settings</button>
      </article>
      <article class="account-card">
        <h3>Billing safety</h3>
        <p>Hope's & Go does not store full card or bank numbers in this app. Stripe handles secure payment storage.</p>
      </article>
    </div>
    <p class="checkout-status" id="customerPaymentsStatus"></p>
  `;
}

function getMembershipUsage() {
  if (!currentMembership?.active) {
    return { pickup: 0, shop: 0, rush: 0 };
  }
  return currentMembership.usage || { pickup: 0, shop: 0, rush: 0 };
}

function getMembershipRenewalDate() {
  if (!currentMembership?.startedAt) return "Next monthly renewal";
  const started = new Date(currentMembership.startedAt);
  if (Number.isNaN(started.getTime())) return "Next monthly renewal";
  const renewal = new Date(started);
  renewal.setMonth(renewal.getMonth() + 1);
  return renewal.toLocaleDateString();
}

function renderMembershipPerk(name, used, included, unlimited = false) {
  const remaining = unlimited ? "Unlimited" : Math.max((included || 0) - (used || 0), 0);
  const includedText = unlimited ? "Unlimited included" : `${included || 0} included monthly`;
  return `
    <div class="membership-perk-card">
      <span>${escapeHtml(name)}</span>
      <strong>${remaining}</strong>
      <small>${includedText}</small>
    </div>
  `;
}

function renderMembershipDashboard() {
  if (!membershipDashboard) return;
  const plan = getActiveMembershipPlan();
  if (!plan || !currentMembership?.active) {
    membershipDashboard.innerHTML = `
      <div class="membership-dashboard-empty">
        <h3>No active membership</h3>
        <p>Choose a membership to unlock automatic savings, monthly perks, and priority support.</p>
      </div>
    `;
    return;
  }

  const usage = getMembershipUsage();
  membershipDashboard.innerHTML = `
    <div class="membership-active-card">
      <div>
        <p class="eyebrow">Active membership</p>
        <h3>${escapeHtml(plan.name)}</h3>
        <p>${money(plan.monthlyPrice)} per month - renews ${escapeHtml(getMembershipRenewalDate())}</p>
      </div>
      <div class="membership-actions">
        <button class="secondary-admin-action" type="button" data-cancel-membership>Cancel membership</button>
        <button class="checkout-button" type="button" data-customer-menu-action="home">Use benefits on a request</button>
      </div>
    </div>
    <div class="membership-perk-grid">
      ${renderMembershipPerk("Pickup & Delivery", usage.pickup, plan.freePickupMonthly)}
      ${renderMembershipPerk("Shop & Deliver", usage.shop, plan.freeShopMonthly)}
      ${renderMembershipPerk("Rush Service", usage.rush, plan.freeRushMonthly, plan.id === "senior-go-plus")}
    </div>
    <div class="membership-benefit-card">
      <h3>Automatic member savings</h3>
      <ul>${plan.benefits.map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join("")}</ul>
    </div>
  `;
}

function createRequestRecord(payload) {
  const existing = requests.find((request) => request.checkoutKey === getRequestCheckoutKey(payload));
  if (existing) return existing;
  const request = {
    id: `REQ-${String(Date.now()).slice(-6)}`,
    checkoutKey: getRequestCheckoutKey(payload),
    customer: payload.customer.name || "Customer",
    phone: payload.customer.phone || "",
    email: payload.customer.email || "",
    items: [...cart.values()].map(({ service, quantity }) => `${service.name} x${quantity}`).join(", "),
    pickup: payload.customer.pickupAddress || "",
    dropoff: payload.customer.deliveryAddress || "",
    distance: estimateRouteDistance(payload.customer.deliveryAddress || ""),
    total: payload.total,
    serviceFee: payload.subtotal,
    serviceCharge: payload.serviceCharge,
    addonCharges: payload.addonCharges,
    serviceAreaCharge: payload.serviceAreaCharge,
    regularSubtotal: payload.regularSubtotal,
    membershipSavings: payload.membershipSavings,
    discountCode: payload.discountCode,
    discountAmount: payload.discount,
    tax: payload.tax,
    taxRate: payload.taxRate,
    taxArea: payload.taxArea,
    tip: Number(payload.tip || 0),
    pickupInstructions: payload.customer.pickupInstructions || "",
    dropoffInstructions: payload.customer.dropoffInstructions || "",
    shoppingHold: Number(payload.shopping.holdTotal || 0),
    shoppingCushion: Number(payload.shopping.cushion || 0),
    shoppingEstimateLow: Number(payload.shopping.rangeLow || 0),
    shoppingEstimateHigh: Number(payload.shopping.rangeHigh || 0),
    shoppingUnknownCount: Number(payload.shopping.unknownCount || 0),
    notes: payload.customer.notes || "",
    status: "Admin reviewing",
    adminReason: "",
    assignedDriver: "",
    deliveryMethod: payload.deliveryMethod,
    deliveryPin: payload.deliveryPin,
    additionalStopAddress: payload.additionalStop?.address || "",
    additionalStopNotes: payload.additionalStop?.notes || "",
    shoppingRetailer: payload.shopping.retailer?.name || "",
    shoppingProducts: payload.shopping.products || [],
    shoppingCustomItems: payload.shopping.items || [],
    shoppingList: [
      ...(payload.shopping.items || []),
      ...(payload.shopping.products || []).map(
        (product) => `${product.quantity} x ${getShoppingProductLabel(product)}`
      ),
    ],
    shoppingEstimate: payload.shopping.estimate,
    shoppingEstimateDetails: Array.isArray(payload.shopping.estimateDetails) ? payload.shopping.estimateDetails : [],
    shoppingPhotos: payload.shopping.photos,
    membershipName: payload.membershipName || "",
    createdAt: new Date().toLocaleString(),
    createdAtMs: Date.now(),
    testMode: Boolean(payload.testMode || customerTestingMode),
    paymentValidation: payload.testMode || customerTestingMode ? "Test mode - not validated" : "Pending authorization",
    riskSummary: payload.testMode || customerTestingMode ? "No live Stripe risk check" : "Waiting for Stripe",
  };
  recordMembershipUsageFromCart();
  requests.unshift(request);
  saveRequests();
  renderAdminBoards();
  if (request.testMode) {
    processAutoApproval(request.id, { valid: false }, { additionalFlags: ["Test-mode payment cannot be validated"] });
  }
  return request;
}

function recordMembershipUsageFromCart() {
  if (!currentMembership?.active) return;
  const usage = getMembershipUsage();
  const entries = [...cart.values()];
  const pickupUsed = entries
    .filter((item) => item.service.id === 1)
    .reduce((sum, item) => sum + item.quantity, 0);
  const shopUsed = entries
    .filter((item) => item.service.id === 2)
    .reduce((sum, item) => sum + item.quantity, 0);
  const rushUsed = entries
    .filter((item) => item.service.id === 4)
    .reduce((sum, item) => sum + item.quantity, 0);

  currentMembership = {
    ...currentMembership,
    usage: {
      pickup: usage.pickup + pickupUsed,
      shop: usage.shop + shopUsed,
      rush: usage.rush + rushUsed,
    },
  };
  const storage = customerTestingMode ? sessionStorage : localStorage;
  storage.setItem("hopesGoMembership", JSON.stringify(currentMembership));
  renderCustomerMenuStatus();
  renderMembershipDashboard();
}

function getRequestCheckoutKey(payload) {
  return [
    payload.requestToken || "legacy-request",
    payload.customer.email,
    payload.customer.pickupAddress,
    payload.customer.deliveryAddress,
    payload.items.map((item) => `${item.id}:${item.quantity}`).join("|"),
    payload.total,
  ].join("::");
}

function estimateRouteDistance(address) {
  const coordinates = getKnownLocationCoordinates(address) || getCityAnchorCoordinates(address);
  if (!coordinates) return /west burlington|burlington/i.test(address) ? "Included area" : "Distance pending verification";
  const miles = estimateServiceTravelMiles(coordinates);
  if (miles <= INCLUDED_SERVICE_RADIUS_MILES) return `${miles} miles - included area`;
  const tier = serviceAreaDistanceTiers.find(
    (entry) => miles > entry.minExclusive && miles <= entry.maxInclusive
  );
  return tier ? `${miles} miles - Service Area Tier ${tier.tier}` : `${miles} miles - custom quote`;
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
  const response = await fetch(apiUrl("/send-verification-code"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code }),
  });

  if (!response.ok) {
    throw new Error("Verification text could not be sent.");
  }
}

function clearEmbeddedCheckout() {
  if (activeEmbeddedCheckout?.destroy) {
    activeEmbeddedCheckout.destroy();
  }
  activeEmbeddedCheckout = null;
  embeddedCheckoutShell?.classList.remove("active");
  if (embeddedCheckout) {
    embeddedCheckout.innerHTML = "";
  }
}

function resetTestCheckoutState() {
  if (!checkoutButton) return;
  clearEmbeddedCheckout();
  checkoutButton.disabled = false;
  checkoutButton.textContent = "Continue to secure checkout";
}

async function handleCheckoutReturnStatus() {
  const params = new URLSearchParams(window.location.search);
  const membershipState = params.get("membership");
  if (membershipState === "active") {
    const planId = params.get("plan");
    if (planId && membershipPlans.some((plan) => plan.id === planId)) {
      saveMembership(planId);
    }
    setCustomerMode("memberships");
    membershipStatus.textContent = "Membership checkout received. Your benefits are active on this account.";
    return;
  }
  const checkoutState = params.get("checkout");
  if (!checkoutState) return;

  setCustomerMode("request");
  setCustomerPage("customerCheckout");
  if (checkoutState === "cancelled") {
    checkoutStatus.textContent = "Checkout was cancelled. You can review your request and try again.";
    return;
  }

  clearSavedRequestDraft();
  checkoutStatus.textContent = "Checkout received. Hope's & Go will review your request next.";
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  try {
    const response = await fetch(apiUrl(`/checkout-session-status?session_id=${encodeURIComponent(sessionId)}`));
    const data = await response.json();
    if (response.ok && data.status) {
      const matchedRequest = requests.find((request) => request.checkoutKey?.startsWith(`${data.requestToken || "missing"}::`));
      if (matchedRequest) {
        processAutoApproval(matchedRequest.id, {
          valid: Boolean(data.paymentValid),
          failed: data.paymentStatus === "unpaid" || data.paymentStatus === "failed",
          riskLevel: data.riskLevel || "",
          riskScore: data.riskScore,
          outcomeType: data.outcomeType || "",
          billingAddress: data.billingAddress || "",
        }, { additionalFlags: data.riskFlags || [] });
      }
      checkoutStatus.textContent =
        data.paymentStatus === "paid" || data.status === "complete"
          ? "Your request was received. Hope's & Go will review and accept it before the final charge is completed."
          : "Your checkout is being reviewed. Hope's & Go will follow up if anything else is needed.";
    }
  } catch {
    checkoutStatus.textContent = "Your checkout was received. Hope's & Go will review your request next.";
  }
}

function loadStripeScript() {
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (stripeScriptPromise) return stripeScriptPromise;
  stripeScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-hopes-go-stripe]');
    const script = existing || document.createElement("script");
    const handleLoad = () => window.Stripe
      ? resolve(window.Stripe)
      : reject(new Error("Stripe.js could not initialize."));
    const handleError = () => {
      stripeScriptPromise = null;
      script.remove();
      reject(new Error("Stripe.js could not load. Check your connection and try again."));
    };
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) {
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.dataset.hopesGoStripe = "true";
      document.head.append(script);
    }
  });
  return stripeScriptPromise;
}

async function mountEmbeddedStripeCheckout(clientSecret, fallbackUrl) {
  if (!embeddedCheckoutShell || !embeddedCheckout) return;
  const publishableKey = window.HOPES_GO_STRIPE_PUBLISHABLE_KEY || "";
  if (!publishableKey) {
    throw new Error("Missing STRIPE_PUBLISHABLE_KEY for the in-app checkout screen.");
  }
  await loadStripeScript();

  clearEmbeddedCheckout();
  embeddedCheckoutShell.classList.add("active");
  embeddedCheckout.innerHTML = `<div class="embedded-loading">Loading secure checkout...</div>`;

  const stripe = window.Stripe(publishableKey);
  const fetchClientSecret = async () => clientSecret;
  if (stripe.createEmbeddedCheckoutPage) {
    activeEmbeddedCheckout = await stripe.createEmbeddedCheckoutPage({ fetchClientSecret });
  } else if (stripe.initEmbeddedCheckout) {
    activeEmbeddedCheckout = await stripe.initEmbeddedCheckout({ fetchClientSecret });
  } else if (fallbackUrl) {
    window.location.href = fallbackUrl;
    return;
  } else {
    throw new Error("Embedded checkout is not available in this browser.");
  }

  embeddedCheckout.innerHTML = "";
  activeEmbeddedCheckout.mount("#embeddedCheckout");
}

function clearMembershipCheckout() {
  if (activeMembershipCheckout?.destroy) {
    activeMembershipCheckout.destroy();
  }
  activeMembershipCheckout = null;
  membershipCheckoutShell?.classList.remove("active");
  if (membershipEmbeddedCheckout) {
    membershipEmbeddedCheckout.innerHTML = "";
  }
}

async function mountMembershipStripeCheckout(clientSecret, fallbackUrl) {
  if (!membershipCheckoutShell || !membershipEmbeddedCheckout) return;
  const publishableKey = window.HOPES_GO_STRIPE_PUBLISHABLE_KEY || "";
  if (!publishableKey) {
    throw new Error("Missing STRIPE_PUBLISHABLE_KEY for membership checkout.");
  }
  await loadStripeScript();

  clearMembershipCheckout();
  membershipCheckoutShell.classList.add("active");
  membershipEmbeddedCheckout.innerHTML = `<div class="embedded-loading">Loading membership checkout...</div>`;

  const stripe = window.Stripe(publishableKey);
  const fetchClientSecret = async () => clientSecret;
  if (stripe.createEmbeddedCheckoutPage) {
    activeMembershipCheckout = await stripe.createEmbeddedCheckoutPage({ fetchClientSecret });
  } else if (stripe.initEmbeddedCheckout) {
    activeMembershipCheckout = await stripe.initEmbeddedCheckout({ fetchClientSecret });
  } else if (fallbackUrl) {
    window.location.href = fallbackUrl;
    return;
  } else {
    throw new Error("Embedded checkout is not available in this browser.");
  }

  membershipEmbeddedCheckout.innerHTML = "";
  activeMembershipCheckout.mount("#membershipEmbeddedCheckout");
}

async function startMembershipCheckout(planId) {
  const plan = membershipPlans.find((item) => item.id === planId);
  if (!plan) return;
  const customer = getCurrentCustomer();
  membershipStatus.textContent = "";
  if (membershipCheckoutTitle) {
    membershipCheckoutTitle.textContent = `${plan.name} - ${money(plan.monthlyPrice)} per month`;
  }

  if (customerTestingMode) {
    saveMembership(plan.id);
    membershipStatus.textContent = `${plan.name} is active for this test account. Benefits apply automatically.`;
    return;
  }

  if (!customer.email) {
    membershipStatus.textContent = "Add an email to your profile before starting membership checkout.";
    setCustomerMode("account");
    return;
  }

  membershipStatus.textContent = "Loading secure membership checkout...";
  try {
    const response = await fetch(apiUrl("/create-membership-checkout-session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id, customer }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Membership checkout could not be started.");
    }
    await mountMembershipStripeCheckout(data.clientSecret, data.url);
    membershipStatus.textContent = "Secure membership checkout is ready below.";
  } catch (error) {
    membershipStatus.textContent = `Membership checkout could not open: ${error.message}`;
  }
}

async function startStripeCheckout() {
  const payload = getCartPayload();
  if (!payload.items.length) {
    checkoutStatus.textContent = "Choose a main service before checkout.";
    return;
  }

  if (!(await ensureDriverAvailable())) {
    checkoutStatus.textContent = "No drivers are currently available. Please check back during operating hours.";
    return;
  }

  if (!customerTestingMode && !payload.customer.email) {
    setCustomerPage("customerInfo");
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
    checkoutStatus.textContent = "Please accept the Terms of Service and the cancellation/refund policy before checkout.";
    return;
  }

  checkoutButton.disabled = true;
  checkoutStatus.textContent = "Loading secure in-app checkout...";
  sendAppNotification("Hope's & Go request", "Your secure checkout is loading.");

  try {
    const response = await fetch(apiUrl("/create-checkout-session"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Checkout could not be started.");
    }

    createRequestRecord(payload);
    await mountEmbeddedStripeCheckout(data.clientSecret, data.url);
    checkoutStatus.textContent = "Secure checkout is ready below.";
  } catch (error) {
    const message =
      error.message === "Failed to fetch"
        ? "Checkout could not reach the app server. Use the live Railway link or start the local app server first."
        : error.message;
    checkoutStatus.textContent = `Stripe checkout could not open: ${message}`;
    checkoutButton.disabled = false;
  }
}

function loadProfile() {
  const saved = customerTestingMode
    ? sessionStorage.getItem("hopesGoCustomerProfile")
    : localStorage.getItem("hopesGoCustomerProfile");
  if (!saved) return null;

  try {
    const profile = JSON.parse(saved);
    if (profile?.notes === "Owner test profile") {
      profile.notes = "";
      const storage = customerTestingMode ? sessionStorage : localStorage;
      storage.setItem("hopesGoCustomerProfile", JSON.stringify(profile));
    }
    return profile;
  } catch {
    return null;
  }
}

function loadCustomerAccounts() {
  const saved = customerTestingMode
    ? sessionStorage.getItem("hopesGoCustomerAccounts")
    : localStorage.getItem("hopesGoCustomerAccounts");
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function loadStoredList(key) {
  const storage = customerTestingMode && key === "hopesGoRequests" ? sessionStorage : localStorage;
  const saved = storage.getItem(key);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveStoredList(key, value) {
  const storage = customerTestingMode && key === "hopesGoRequests" ? sessionStorage : localStorage;
  storage.setItem(key, JSON.stringify(value));
}

function loadAutoApprovalSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("hopesGoAutoApprovalSettings") || "null"); } catch { saved = null; }
  return autoApprovalEngine.normalizeSettings(saved || {});
}

function saveAutoApprovalSettings() {
  autoApprovalSettings = autoApprovalEngine.normalizeSettings(autoApprovalSettings);
  localStorage.setItem("hopesGoAutoApprovalSettings", JSON.stringify(autoApprovalSettings));
}

function loadAutoApprovalLog() {
  try { return JSON.parse(localStorage.getItem("hopesGoAutoApprovalLog") || "[]"); } catch { return []; }
}

function saveAutoApprovalLog() {
  autoApprovalLog = autoApprovalLog.slice(0, 250);
  localStorage.setItem("hopesGoAutoApprovalLog", JSON.stringify(autoApprovalLog));
}

function isExistingCustomer(request) {
  const normalizedEmail = String(request.email || "").trim().toLowerCase();
  const normalizedPhone = String(request.phone || "").replace(/\D/g, "");
  return requests.some((entry) => entry.id !== request.id && (
    (normalizedEmail && String(entry.email || "").trim().toLowerCase() === normalizedEmail) ||
    (normalizedPhone && String(entry.phone || "").replace(/\D/g, "") === normalizedPhone)
  ));
}

function getFailedPaymentAttempts(request) {
  const email = String(request.email || "").trim().toLowerCase();
  return requests.filter((entry) => entry.id !== request.id && String(entry.email || "").trim().toLowerCase() === email && entry.paymentValidation === "Failed").length;
}

async function notifyOwnerOfManualReview(request, reasons) {
  try {
    await fetch(apiUrl("/notify-owner-manual-review"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id, customerName: request.customer, total: request.total, reasons }),
    });
    fetchOperationsStatus({ quiet: true });
  } catch {
    sendAppNotification("Manual review needed", `${request.id} needs your review.`);
  }
}

function processAutoApproval(requestId, payment = {}, extraContext = {}) {
  const request = requests.find((entry) => entry.id === requestId);
  if (!request) return null;
  const context = {
    existingCustomer: isExistingCustomer(request),
    trustedCustomer: Boolean(request.trustedCustomer),
    failedPaymentAttempts: getFailedPaymentAttempts(request),
    suspiciousCustomerData: !request.email || !request.phone,
    ...extraContext,
  };
  const decision = autoApprovalEngine.evaluate(request, autoApprovalSettings, payment, context);
  const timestamp = new Date().toISOString();
  requests = requests.map((entry) => entry.id === requestId ? {
    ...entry,
    status: decision.approved ? "Approved for drivers" : "Admin reviewing",
    autoApprovalDecision: decision.approved ? "Auto-approved" : "Manual review",
    autoApprovalReason: decision.reason,
    autoApprovalCheckedAt: timestamp,
    paymentValidation: payment.valid ? "Validated" : (payment.failed ? "Failed" : entry.paymentValidation),
    riskSummary: payment.riskLevel ? `Stripe ${payment.riskLevel}${payment.riskScore != null ? ` (${payment.riskScore})` : ""}` : (payment.valid ? "No known Stripe risk flags" : entry.riskSummary),
    trustedPriority: decision.priority,
  } : entry);
  autoApprovalLog.unshift({
    requestId,
    customer: request.customer,
    timestamp,
    decision: decision.approved ? "Auto-approved" : "Manual review",
    reason: decision.reason,
    payment: payment.valid ? "Validated" : (payment.failed ? "Failed" : "Not validated"),
    risk: payment.riskLevel ? `${payment.riskLevel}${payment.riskScore != null ? ` (${payment.riskScore})` : ""}` : "No available risk score",
  });
  saveRequests();
  saveAutoApprovalLog();
  renderAdminBoards();
  renderEmployeeViews();
  if (!decision.approved) notifyOwnerOfManualReview(request, decision.flags);
  return decision;
}

function saveCustomerAccounts() {
  const storage = customerTestingMode ? sessionStorage : localStorage;
  storage.setItem("hopesGoCustomerAccounts", JSON.stringify(customerAccounts));
}

function loadRequests() {
  const storage = customerTestingMode ? sessionStorage : localStorage;
  const saved = storage.getItem("hopesGoRequests");
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    const pruned = pruneExpiredTestRequests(parsed);
    if (pruned.length !== parsed.length) {
      storage.setItem("hopesGoRequests", JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return [];
  }
}

function saveRequests() {
  const storage = customerTestingMode ? sessionStorage : localStorage;
  requests = pruneExpiredTestRequests(requests);
  storage.setItem("hopesGoRequests", JSON.stringify(requests));
}

function loadMembership() {
  const saved = customerTestingMode
    ? sessionStorage.getItem("hopesGoMembership")
    : localStorage.getItem("hopesGoMembership");
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function saveMembership(planId) {
  const plan = membershipPlans.find((item) => item.id === planId);
  if (!plan) return;
  currentMembership = {
    planId: plan.id,
    name: plan.name,
    internalCode: plan.internalCode,
    active: true,
    startedAt: new Date().toISOString(),
    usage: { pickup: 0, shop: 0, rush: 0 },
  };
  const storage = customerTestingMode ? sessionStorage : localStorage;
  storage.setItem("hopesGoMembership", JSON.stringify(currentMembership));
  renderCart();
  renderCustomerMenuStatus();
  renderMembershipDashboard();
}

function renderCustomerMenuStatus() {
  if (!customerMenuMembershipStatus) return;
  const plan = getActiveMembershipPlan();
  customerMenuMembershipStatus.textContent = plan
    ? `${plan.name} active`
    : "No membership active";
  customerMenuMembershipStatus.setAttribute(
    "aria-label",
    plan ? `View ${plan.name} membership details` : "View membership options"
  );
}

function saveProfile(profile) {
  const cleanProfile = {
    name: profile.name || "",
    phone: profile.phone || "",
    email: profile.email || "",
    deliveryAddress: profile.deliveryAddress || "",
    notes: profile.notes || "",
  };
  const storage = customerTestingMode ? sessionStorage : localStorage;
  storage.setItem("hopesGoCustomerProfile", JSON.stringify(cleanProfile));
  customerProfile = cleanProfile;
  renderProfile();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

function loginMatchesAccount(account, lookup) {
  const normalizedLookup = normalizePhone(lookup);
  const emailLookup = String(lookup || "").trim().toLowerCase();
  return (
    account.email?.toLowerCase() === emailLookup ||
    (normalizedLookup && normalizePhone(account.phone) === normalizedLookup)
  );
}

function getDeliveryMethod() {
  return [...deliveryMethodInputs].find((input) => input.checked)?.value || "hand_to_customer";
}

function getDeliveryPin() {
  const storage = getRequestDraftStorage();
  let pin = storage.getItem("hopesGoCurrentDeliveryPin");
  if (!pin) {
    pin = generateDeliveryPin();
    storage.setItem("hopesGoCurrentDeliveryPin", pin);
  }
  return pin;
}

function getRequestDraftStorage() {
  return customerTestingMode ? sessionStorage : localStorage;
}

function generateDeliveryPin(previousPin = "") {
  let pin = "";
  do {
    if (window.crypto?.getRandomValues) {
      const randomValue = new Uint32Array(1);
      window.crypto.getRandomValues(randomValue);
      pin = String(1000 + (randomValue[0] % 9000));
    } else {
      pin = String(Math.floor(1000 + Math.random() * 9000));
    }
  } while (pin === String(previousPin || ""));
  return pin;
}

function generateRequestToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `REQUEST-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCurrentRequestToken() {
  const storage = getRequestDraftStorage();
  let token = storage.getItem("hopesGoCurrentRequestToken");
  if (!token) {
    token = generateRequestToken();
    storage.setItem("hopesGoCurrentRequestToken", token);
  }
  return token;
}

function beginNewRequestIdentity() {
  const storage = getRequestDraftStorage();
  const previousPin = storage.getItem("hopesGoCurrentDeliveryPin") || "";
  const pin = generateDeliveryPin(previousPin);
  const token = generateRequestToken();
  storage.setItem("hopesGoCurrentDeliveryPin", pin);
  storage.setItem("hopesGoCurrentRequestToken", token);
  return { pin, token };
}

function loadSavedRequestDraft() {
  const saved = getRequestDraftStorage().getItem("hopesGoRequestDraft");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    getRequestDraftStorage().removeItem("hopesGoRequestDraft");
    return null;
  }
}

function isMeaningfulRequestDraft(draft) {
  return Boolean(
    draft?.items?.length ||
    (draft?.page && draft.page !== "customerServices") ||
    draft?.tip?.value ||
    draft?.discountCode ||
    draft?.shopping?.list ||
    draft?.additionalStop?.address,
  );
}

function buildCurrentRequestDraft() {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    page: currentCustomerPage,
    items: [...cart.values()].map(({ service, quantity }) => ({ id: service.id, quantity })),
    tip: {
      value: tipInput.value || "",
      amount: tipInput.dataset.amount || "",
      choice: tipChoiceMode || "",
      seen: tipStepSeen,
    },
    discountCode: discountInput.value || "",
    serviceAreaNoFeeSelected,
    serviceAreaReturnPage,
    customer: Object.fromEntries(
      Object.entries(profileFields).map(([key, field]) => [key, field?.value || ""]),
    ),
    deliveryMethod: getDeliveryMethod(),
    shopping: {
      list: shoppingListInput.value || "",
      estimate: shoppingEstimateTotal,
      retailer: getSelectedShoppingRetailer(),
      products: selectedShoppingProducts.map((product) => ({ ...product })),
    },
    additionalStop: {
      address: additionalStopAddress.value || "",
      notes: additionalStopNotes.value || "",
    },
    termsAccepted: Boolean(termsAccepted.checked),
    deliveryPin: getDeliveryPin(),
    requestToken: getCurrentRequestToken(),
    total: getCartTotals().total,
  };
}

function updateResumeCartButton() {
  if (!resumeCartButton || !customerCartSummary) return;
  const draft = loadSavedRequestDraft();
  const hasDraft = isMeaningfulRequestDraft(draft);
  const isRequestOpen = currentCustomerMode === "request";
  customerCartSummary.hidden = !isRequestOpen && !hasDraft;
  if (!isRequestOpen && !hasDraft) return;

  const currentTotals = isRequestOpen ? getCartTotals() : null;
  const itemCount = isRequestOpen
    ? currentTotals.totalItems
    : (draft?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const activePage = isRequestOpen ? currentCustomerPage : draft?.page;
  const pageInfo = customerPageInfo[activePage] || customerPageInfo.customerServices;
  if (resumeCartCount) resumeCartCount.textContent = itemCount;
  if (resumeCartStep) resumeCartStep.textContent = `${pageInfo.step || "Saved"}: ${pageInfo.title || "Unfinished request"}`;
  if (resumeCartTitle) resumeCartTitle.textContent = isRequestOpen ? "Cart" : "Resume cart";
  resumeCartButton.setAttribute("aria-label", isRequestOpen ? "Open current cart" : "Resume unfinished request");
  if (customerRunningTotal) {
    const total = isRequestOpen ? currentTotals.total : Number(draft?.total || 0);
    customerRunningTotal.textContent = money(total);
  }
}

function saveCurrentRequestDraft() {
  if (requestDraftWritePaused || currentCustomerMode !== "request") {
    updateResumeCartButton();
    return;
  }
  const draft = buildCurrentRequestDraft();
  if (isMeaningfulRequestDraft(draft)) {
    getRequestDraftStorage().setItem("hopesGoRequestDraft", JSON.stringify(draft));
  } else {
    getRequestDraftStorage().removeItem("hopesGoRequestDraft");
  }
  updateResumeCartButton();
}

function clearSavedRequestDraft() {
  const storage = getRequestDraftStorage();
  storage.removeItem("hopesGoRequestDraft");
  storage.removeItem("hopesGoCurrentDeliveryPin");
  storage.removeItem("hopesGoCurrentRequestToken");
  updateResumeCartButton();
}

function startFreshRequest() {
  requestDraftWritePaused = true;
  getRequestDraftStorage().removeItem("hopesGoRequestDraft");
  cart.clear();
  selectedRestaurantOrder = null;
  customPickupDetailsCollected = false;
  serviceAreaNoFeeSelected = false;
  serviceAreaReturnPage = "";
  customerInfoEditMode = false;
  tipChoiceMode = "";
  tipStepSeen = false;
  shoppingEstimateTotal = 0;
  shoppingEstimateRange = { low: 0, high: 0, unknownCount: 0, explicitCount: 0, catalogCount: 0, unitCount: 0 };
  selectedShoppingProducts = [];
  renderProfile();
  profileFields.pickupAddress.value = "";
  profileFields.pickupInstructions.value = "";
  profileFields.dropoffInstructions.value = "";
  shoppingListInput.value = "";
  shoppingPhotoInput.value = "";
  shoppingStoreInput.value = "";
  shoppingStoreSelectionKey = "";
  shoppingProductSearch.value = "";
  shoppingProductSuggestions.hidden = true;
  shoppingProductSuggestions.innerHTML = "";
  shoppingCatalogStatus.textContent = "Type the shopping store first, then search for a product.";
  renderSelectedShoppingProducts();
  additionalStopAddress.value = "";
  additionalStopNotes.value = "";
  tipInput.value = "";
  delete tipInput.dataset.amount;
  discountInput.value = "";
  termsAccepted.checked = false;
  searchInput.value = "";
  categoryFilter.value = "all";
  deliveryMethodInputs.forEach((input) => {
    input.checked = input.value === "hand_to_customer";
  });
  Object.values(selectedRequestLocations).forEach((location) => {
    location.address = "";
    location.coordinates = null;
    location.verified = false;
  });
  syncRequestLocationFromField(profileFields.deliveryAddress);
  if (shoppingEstimate) {
    shoppingEstimate.innerHTML = `<strong>Shopping estimate</strong><span>Add a list or photo to estimate average item prices.</span>`;
  }
  checkoutStatus.textContent = "";
  customerFlowStatus.textContent = "";
  beginNewRequestIdentity();
  currentCustomerPage = "customerServices";
  requestDraftWritePaused = false;
  resetTestCheckoutState();
  setCustomerMode("request");
  setCustomerPage("customerServices");
  updateResumeCartButton();
}

function resumeSavedRequest() {
  const draft = loadSavedRequestDraft();
  if (!isMeaningfulRequestDraft(draft)) {
    startFreshRequest();
    return;
  }
  requestDraftWritePaused = true;
  cart.clear();
  (draft.items || []).forEach((item) => {
    const service = services.find((entry) => entry.id === Number(item.id));
    if (service && Number(item.quantity) > 0) {
      cart.set(service.id, { service, quantity: Number(item.quantity) });
    }
  });
  Object.entries(draft.customer || {}).forEach(([key, value]) => {
    if (profileFields[key]) profileFields[key].value = value || "";
  });
  tipInput.value = draft.tip?.value || "";
  if (draft.tip?.amount) tipInput.dataset.amount = draft.tip.amount;
  else delete tipInput.dataset.amount;
  tipChoiceMode = draft.tip?.choice || "";
  tipStepSeen = Boolean(draft.tip?.seen);
  discountInput.value = draft.discountCode || "";
  serviceAreaNoFeeSelected = Boolean(draft.serviceAreaNoFeeSelected);
  shoppingListInput.value = draft.shopping?.list || "";
  shoppingEstimateTotal = Number(draft.shopping?.estimate || 0);
  shoppingStoreInput.value = draft.shopping?.retailer?.name || "";
  shoppingStoreSelectionKey = getShoppingStoreSelectionKey();
  shoppingCatalogStatus.textContent = shoppingStoreInput.value
    ? `${shoppingStoreInput.value} selected. Type at least 2 letters to search the monthly catalog.`
    : "Type the shopping store first, then search for a product.";
  selectedShoppingProducts = Array.isArray(draft.shopping?.products)
    ? draft.shopping.products.map((product) => ({
        ...product,
        id: String(product.id || ""),
        quantity: Math.max(1, Math.min(99, Number(product.quantity || 1))),
        price: Math.max(0, Number(product.price || 0)),
      }))
    : [];
  renderSelectedShoppingProducts();
  additionalStopAddress.value = draft.additionalStop?.address || "";
  additionalStopNotes.value = draft.additionalStop?.notes || "";
  termsAccepted.checked = Boolean(draft.termsAccepted);
  deliveryMethodInputs.forEach((input) => {
    input.checked = input.value === (draft.deliveryMethod || "hand_to_customer");
  });
  const storage = getRequestDraftStorage();
  storage.setItem("hopesGoCurrentDeliveryPin", draft.deliveryPin || generateDeliveryPin());
  storage.setItem("hopesGoCurrentRequestToken", draft.requestToken || generateRequestToken());
  currentCustomerPage = customerPages.includes(draft.page) ? draft.page : "customerServices";
  syncRequestLocationFromField(profileFields.pickupAddress);
  syncRequestLocationFromField(profileFields.deliveryAddress);
  serviceAreaReturnPage = draft.serviceAreaReturnPage || "";
  if (currentCustomerPage === "customerAreas" && getDeliveryServiceAreaRequirement().required) {
    serviceAreaReturnPage = serviceAreaReturnPage || "dropoffInfo";
  }
  requestDraftWritePaused = false;
  setCustomerMode("request");
  setCustomerPage(currentCustomerPage);
  renderShoppingEstimate();
  updateResumeCartButton();
}

function setupPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    if (input.dataset.hasPasswordToggle) return;
    input.dataset.hasPasswordToggle = "true";
    const wrapper = document.createElement("span");
    wrapper.className = "password-input-wrap";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.append(input);
    const button = document.createElement("button");
    button.className = "password-toggle-button";
    button.type = "button";
    button.textContent = "Show";
    button.setAttribute("aria-label", "Show password");
    wrapper.append(button);
    button.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      button.textContent = isPassword ? "Hide" : "Show";
      button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    });
  });
}

function loadOwnerMockCustomer() {
  saveProfile({
    name: "Hope",
    phone: "3195944964",
    email: "helping_hands@hopes-go.com",
    deliveryAddress: "Burlington, IA",
    notes: "",
  });
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
        name: "Hope",
        selections: {},
        exactTimes: defaultHopeExactTimes,
        notes: "Primary Hope's & Go driver",
        updatedAt: new Date().toISOString(),
        history: [],
      },
    ];
  }

  try {
    return dedupeAvailabilityEntries(JSON.parse(saved).map(normalizeAvailabilityEntry).map((entry) => {
      if (entry.name?.toLowerCase() === "hope" && entry.notes === "Structured availability test") {
        return {
          ...entry,
          selections: {},
          exactTimes: defaultHopeExactTimes,
          notes: "Primary Hope's & Go driver",
          history: [],
        };
      }
      return entry;
    }));
  } catch {
    return [];
  }
}

function dedupeAvailabilityEntries(entries = []) {
  const newestFirst = [...entries].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );
  const unique = new Map();
  newestFirst.forEach((entry) => {
    const key = String(entry.name || "Driver").trim().toLowerCase();
    if (!unique.has(key)) unique.set(key, entry);
  });
  return [...unique.values()];
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

function normalizeAvailabilitySelections(selections = {}) {
  return Object.fromEntries(
    Object.entries(selections).map(([day, blocks]) => {
      const migratedBlocks = [...new Set(
        (Array.isArray(blocks) ? blocks : [])
          .map((block) => ({ morning: "morning", afternoon: "morning", evening: "evening", overnight: "overnight" })[block])
          .filter(Boolean),
      )];
      return [day, migratedBlocks];
    }),
  );
}

function normalizeExactTimes(exactTimes = {}, { useHopeDefaults = false } = {}) {
  const source = Object.keys(exactTimes || {}).length ? exactTimes : (useHopeDefaults ? defaultHopeExactTimes : {});
  return Object.fromEntries(
    availabilityDays
      .map((day) => [
        day,
        (Array.isArray(source[day]) ? source[day] : [])
          .map((interval) => ({ start: String(interval?.start || ""), end: String(interval?.end || "") }))
          .filter((interval) => /^\d{2}:\d{2}$/.test(interval.start) && /^\d{2}:\d{2}$/.test(interval.end)),
      ])
      .filter(([, intervals]) => intervals.length),
  );
}

function normalizeAvailabilityEntry(entry = {}) {
  if (entry.selections) {
    return {
      ...entry,
      selections: normalizeAvailabilitySelections(entry.selections),
      exactTimes: normalizeExactTimes(entry.exactTimes, { useHopeDefaults: String(entry.name || "").toLowerCase() === "hope" }),
      history: Array.isArray(entry.history)
        ? entry.history.map((item) => ({
            ...item,
            selections: normalizeAvailabilitySelections(item.selections),
            exactTimes: normalizeExactTimes(item.exactTimes),
          }))
        : [],
    };
  }
  const selections = {};
  String(entry.days || "")
    .split(",")
    .map((day) => day.trim())
    .filter(Boolean)
    .forEach((day) => {
      const dayName = availabilityDays.find((item) => item.toLowerCase() === day.toLowerCase());
      if (dayName) {
        selections[dayName] = ["morning"];
      }
    });
  return {
    name: entry.name || "Driver",
    selections,
    exactTimes: normalizeExactTimes(entry.exactTimes, { useHopeDefaults: String(entry.name || "").toLowerCase() === "hope" }),
    notes: entry.notes || "",
    updatedAt: entry.updatedAt || new Date().toISOString(),
    history: Array.isArray(entry.history) ? entry.history : [],
  };
}

function getAvailabilityForDriver(name = currentEmployee) {
  return employeeAvailability.find((item) => item.name.toLowerCase() === String(name || "").toLowerCase());
}

function syncDriverScheduleFromServer(status) {
  const name = String(currentEmployee || "");
  const serverRecord = status?.driverSchedules?.[name];
  if (!name || !serverRecord?.days || availabilityForm?.contains(document.activeElement)) return;
  const index = employeeAvailability.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
  const current = index >= 0 ? normalizeAvailabilityEntry(employeeAvailability[index]) : null;
  if (current?.serverUpdatedAt === serverRecord.updatedAt) return;
  const next = {
    ...(current || { name, selections: {}, notes: "", history: [] }),
    exactTimes: normalizeExactTimes(serverRecord.days),
    serverUpdatedAt: serverRecord.updatedAt || "",
    updatedAt: serverRecord.updatedAt || current?.updatedAt || new Date().toISOString(),
  };
  if (index >= 0) employeeAvailability[index] = next;
  else employeeAvailability.unshift(next);
  saveAvailabilityList();
  renderAvailability();
}

function getSelectedAvailability() {
  const selections = {};
  availabilityDays.forEach((day) => {
    const blocks = availabilityTimeBlocks
      .filter((block) => document.querySelector(`[data-availability-day="${day}"][data-availability-block="${block.id}"]`)?.checked)
      .map((block) => block.id);
    if (blocks.length) selections[day] = blocks;
  });
  return selections;
}

function getSelectedExactTimes() {
  const exactTimes = {};
  availabilityDays.forEach((day) => {
    const intervals = [...availabilityBuilder.querySelectorAll(`[data-exact-time-row][data-availability-day="${day}"]`)]
      .map((row) => ({
        start: row.querySelector("[data-exact-start]")?.value || "",
        end: row.querySelector("[data-exact-end]")?.value || "",
      }))
      .filter((interval) => interval.start && interval.end);
    if (intervals.length) exactTimes[day] = intervals;
  });
  return exactTimes;
}

function buildWeeklyScheduleDays(selections = {}, exactTimes = {}) {
  return Object.fromEntries(
    availabilityDays
      .map((day) => {
        const blockIntervals = (selections[day] || [])
          .map((blockId) => availabilityBlockExactTimes[blockId])
          .filter(Boolean);
        return [day, [...blockIntervals, ...(exactTimes[day] || [])]];
      })
      .filter(([, intervals]) => intervals.length),
  );
}

function formatExactAvailability(exactTimes = {}) {
  const lines = availabilityDays
    .filter((day) => exactTimes[day]?.length)
    .map((day) => `${day}: ${exactTimes[day].map((interval) => `${formatTime(interval.start)}-${formatTime(interval.end)}`).join(", ")}`);
  return lines.length ? lines.join("; ") : "No exact times added";
}

function formatAvailabilitySelections(selections = {}) {
  const lines = availabilityDays
    .filter((day) => selections[day]?.length)
    .map((day) => {
      const blocks = selections[day]
        .map((blockId) => availabilityTimeBlocks.find((block) => block.id === blockId)?.label)
        .filter(Boolean)
        .join(", ");
      return `${day}: ${blocks}`;
    });
  return lines.length ? lines.join("; ") : "No availability selected";
}

function getAvailableDaysText(selections = {}, exactTimes = {}) {
  const days = availabilityDays.filter((day) => selections[day]?.length || exactTimes[day]?.length);
  return days.length ? days.join(", ") : "No days selected";
}

function getSelectedBlocksText(selections = {}) {
  const blockIds = [...new Set(Object.values(selections).flat())];
  const blocks = blockIds
    .map((blockId) => availabilityTimeBlocks.find((block) => block.id === blockId)?.label)
    .filter(Boolean);
  return blocks.length ? blocks.join(", ") : "No time blocks selected";
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

function formatDateOnly(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { dateStyle: "long" });
}

function renderAvailabilityBuilder() {
  if (!availabilityBuilder) return;
  const current = getAvailabilityForDriver();
  availabilityBuilder.innerHTML = availabilityDays
    .map(
      (day) => `
        <fieldset class="availability-day-card">
          <legend>${day}</legend>
          <div class="availability-block-grid">
            ${availabilityTimeBlocks
              .map(
                (block) => `
                  <label class="availability-block-option">
                    <input
                      type="checkbox"
                      data-availability-day="${day}"
                      data-availability-block="${block.id}"
                      ${current?.selections?.[day]?.includes(block.id) ? "checked" : ""}
                    />
                    <span>
                      <strong>${block.label}</strong>
                      <small>${block.time}</small>
                    </span>
                  </label>
                `
              )
              .join("")}
          </div>
          <div class="availability-exact-time-section">
            <div class="availability-exact-time-heading">
              <div>
                <strong>Specific times</strong>
                <small>Add split times if needed. Use 12:00 AM for midnight.</small>
              </div>
              <button class="secondary-admin-action" type="button" data-add-exact-time="${day}">Add time</button>
            </div>
            <div class="availability-exact-time-list" data-exact-time-list="${day}">
              ${(current?.exactTimes?.[day]?.length ? current.exactTimes[day] : [{ start: "", end: "" }])
                .map((interval) => renderExactTimeRow(day, interval))
                .join("")}
            </div>
          </div>
        </fieldset>
      `
    )
    .join("");
  if (availabilityFields.notes && current) {
    availabilityFields.notes.value = current.notes || "";
  }
}

function renderExactTimeRow(day, interval = {}) {
  return `
    <div class="availability-exact-time-row" data-exact-time-row data-availability-day="${escapeHtml(day)}">
      <label>
        Start
        <input type="time" min="08:00" max="23:59" value="${escapeHtml(interval.start || "")}" data-exact-start />
      </label>
      <label>
        End
        <input type="time" value="${escapeHtml(interval.end || "")}" data-exact-end />
      </label>
      <button type="button" class="availability-remove-time" data-remove-exact-time aria-label="Remove ${escapeHtml(day)} time">Remove</button>
    </div>
  `;
}

function renderAvailabilitySummary(entry, { includeHistory = false } = {}) {
  if (!entry) {
    return `<div class="empty-state">No availability saved yet.</div>`;
  }
  const history = Array.isArray(entry.history) ? entry.history : [];
  return `
    <div class="alert-card availability-record-card">
      <div class="alert-top">
        <strong>${escapeHtml(entry.name)}</strong>
        <span class="pill">Current</span>
      </div>
      <p><strong>Available Days:</strong> ${escapeHtml(getAvailableDaysText(entry.selections, entry.exactTimes))}</p>
      <p><strong>Selected Time Blocks:</strong> ${escapeHtml(getSelectedBlocksText(entry.selections))}</p>
      <p><strong>Specific Times:</strong> ${escapeHtml(formatExactAvailability(entry.exactTimes))}</p>
      <p><strong>Last Updated Date:</strong> ${escapeHtml(formatDateTime(entry.updatedAt))}</p>
      <p>${escapeHtml(entry.notes || "No notes added.")}</p>
    </div>
    ${
      includeHistory
        ? `<section class="availability-history-section">
            <h3>Availability History</h3>
            ${
              history.length
                ? history
                    .map(
                      (item) => `
                        <div class="alert-card availability-record-card">
                          <div class="alert-top">
                            <strong>Previous schedule</strong>
                            <span class="pill">Previous</span>
                          </div>
                          <p><strong>Available Days:</strong> ${escapeHtml(getAvailableDaysText(item.selections, item.exactTimes))}</p>
                          <p><strong>Selected Time Blocks:</strong> ${escapeHtml(getSelectedBlocksText(item.selections))}</p>
                          <p><strong>Specific Times:</strong> ${escapeHtml(formatExactAvailability(item.exactTimes))}</p>
                          <p><strong>Last Updated Date:</strong> ${escapeHtml(formatDateTime(item.updatedAt))}</p>
                          <p>${escapeHtml(item.notes || "No notes added.")}</p>
                        </div>
                      `
                    )
                    .join("")
                : `<div class="empty-state">No previous availability records yet.</div>`
            }
          </section>`
        : ""
    }
  `;
}

function renderAvailability() {
  const employeeList = document.querySelector("#employeeAvailabilityList");
  const adminList = document.querySelector("#adminAvailabilityBoard");
  const current = getAvailabilityForDriver();
  renderAvailabilityBuilder();
  if (driverAvailabilitySummary) {
    driverAvailabilitySummary.innerHTML = renderAvailabilitySummary(current);
  }
  if (driverAvailabilityHistory) {
    driverAvailabilityHistory.innerHTML = renderAvailabilitySummary(current, { includeHistory: true });
  }
  const employeeMarkup = current ? renderAvailabilitySummary(current, { includeHistory: true }) : "";
  const adminMarkup = employeeAvailability
    .map((entry) => renderAvailabilitySummary(entry, { includeHistory: true }))
    .join("");

  if (employeeList) employeeList.innerHTML = employeeMarkup || `<div class="empty-state">No availability saved yet.</div>`;
  if (adminList) adminList.innerHTML = adminMarkup || `<div class="empty-state">No driver availability submitted yet.</div>`;
}

function getPreviousMonthActivity(referenceDate = new Date()) {
  const rangeEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
  const rangeStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  const dayCounts = Object.fromEntries(availabilityDays.map((day) => [day, 0]));
  const shiftCounts = Object.fromEntries(availabilityTimeBlocks.map((shift) => [shift.id, 0]));
  const matchingRequests = requests.filter((request) => {
    const requestTime = Number(request.createdAtMs || 0) || parseStoredDate(request.createdAt);
    return requestTime >= rangeStart.getTime() && requestTime < rangeEnd.getTime();
  });

  matchingRequests.forEach((request) => {
    const requestTime = Number(request.createdAtMs || 0) || parseStoredDate(request.createdAt);
    const requestDate = new Date(requestTime);
    const dayName = requestDate.toLocaleDateString("en-US", { weekday: "long" });
    if (dayName in dayCounts) dayCounts[dayName] += 1;

    const hour = requestDate.getHours() + requestDate.getMinutes() / 60;
    const shift = hour >= 8 && hour < 14
      ? "morning"
      : hour >= 14 && hour < 20
        ? "evening"
        : hour >= 20 && hour < 24
          ? "overnight"
          : null;
    if (shift) shiftCounts[shift] += 1;
  });

  return {
    label: rangeStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    requestCount: matchingRequests.length,
    dayCounts,
    shiftCounts,
  };
}

function getBusiestLabels(entries, labelForKey) {
  const highestCount = Math.max(0, ...Object.values(entries));
  if (!highestCount) return "No activity recorded";
  return Object.entries(entries)
    .filter(([, count]) => count === highestCount)
    .map(([key]) => labelForKey(key))
    .join(", ");
}

function renderMonthlyScheduleActivity() {
  if (!monthlyActivityInsights) return;
  const activity = getPreviousMonthActivity();
  const busiestDays = getBusiestLabels(activity.dayCounts, (day) => day);
  const busiestShifts = getBusiestLabels(
    activity.shiftCounts,
    (shiftId) => availabilityTimeBlocks.find((shift) => shift.id === shiftId)?.label || shiftId,
  );
  const maxDayCount = Math.max(1, ...Object.values(activity.dayCounts));
  const maxShiftCount = Math.max(1, ...Object.values(activity.shiftCounts));

  monthlyActivityInsights.innerHTML = `
    <div class="monthly-activity-overview">
      <article><span>Reporting Month</span><strong>${activity.label}</strong></article>
      <article><span>Most Active Day${busiestDays.includes(",") ? "s" : ""}</span><strong>${busiestDays}</strong></article>
      <article><span>Most Active Shift${busiestShifts.includes(",") ? "s" : ""}</span><strong>${busiestShifts}</strong></article>
      <article><span>Requests Tracked</span><strong>${activity.requestCount}</strong></article>
    </div>
    ${activity.requestCount
      ? `<div class="monthly-activity-breakdown">
          <div>
            <h4>Activity by day</h4>
            ${availabilityDays.map((day) => `
              <div class="activity-row">
                <span>${day}</span>
                <div class="activity-meter"><i style="width: ${(activity.dayCounts[day] / maxDayCount) * 100}%"></i></div>
                <strong>${activity.dayCounts[day]}</strong>
              </div>
            `).join("")}
          </div>
          <div>
            <h4>Activity by shift</h4>
            ${availabilityTimeBlocks.map((shift) => `
              <div class="activity-row">
                <span>${shift.label}</span>
                <div class="activity-meter"><i style="width: ${(activity.shiftCounts[shift.id] / maxShiftCount) * 100}%"></i></div>
                <strong>${activity.shiftCounts[shift.id]}</strong>
              </div>
              <small>${shift.time}</small>
            `).join("")}
          </div>
        </div>`
      : `<div class="empty-state">No requests were recorded in ${activity.label}. This report will fill in automatically as request history builds.</div>`}
  `;
}

function upsertAvailability(entry) {
  const index = employeeAvailability.findIndex((item) => item.name.toLowerCase() === entry.name.toLowerCase());
  if (index >= 0) {
    const current = normalizeAvailabilityEntry(employeeAvailability[index]);
    const historyItem = {
      name: current.name,
      selections: current.selections,
      exactTimes: current.exactTimes || {},
      notes: current.notes || "",
      updatedAt: current.updatedAt || new Date().toISOString(),
    };
    employeeAvailability[index] = {
      ...entry,
      history: [historyItem, ...(current.history || [])],
    };
  } else {
    employeeAvailability.unshift(entry);
  }
  saveAvailabilityList();
  renderAvailability();
  renderAdminBoards();
}

function profileFieldLabel(field) {
  return document.querySelector(`label[for="${field.id}"]`) || field.closest("label");
}

function renderProfile() {
  ["name", "phone", "email"].forEach((key) => {
    profileFieldLabel(profileFields[key])?.classList.remove("hidden-field");
    profileFields[key]?.classList.remove("hidden-field");
  });
  customerInfoSavedSummary?.classList.add("hidden-field");
  if (!customerProfile) {
    syncRequestLocationFromField(profileFields.pickupAddress);
    syncRequestLocationFromField(profileFields.deliveryAddress);
    profileStatus.textContent = "Not saved";
    requestProfile.innerHTML = `
      <strong>Profile details</strong>
      <span>Create or log in to a customer account first.</span>
    `;
    return;
  }

  ["name", "phone", "email", "deliveryAddress", "notes"].forEach((key) => {
    if (profileFields[key]) profileFields[key].value = customerProfile[key] || "";
  });
  syncRequestLocationFromField(profileFields.pickupAddress);
  syncRequestLocationFromField(profileFields.deliveryAddress);
  profileFieldLabel(profileFields.name)?.classList.add("hidden-field");
  profileFieldLabel(profileFields.phone)?.classList.add("hidden-field");
  profileFieldLabel(profileFields.email)?.classList.add("hidden-field");
  profileFields.name?.classList.add("hidden-field");
  profileFields.phone?.classList.add("hidden-field");
  profileFields.email?.classList.add("hidden-field");
  profileStatus.textContent = "Saved";
  if (customerInfoSavedSummary) {
    customerInfoSavedSummary.classList.remove("hidden-field");
    customerInfoSavedSummary.innerHTML = `
      <strong>${customerProfile.name || "Saved customer"}</strong>
      <span>${customerProfile.phone || "No phone saved"}</span>
      <span>${customerProfile.email || "No email saved"}</span>
      <button class="secondary-admin-action compact-edit-action" type="button" data-edit-customer-info>Edit Info</button>
    `;
  }
  if (customerInfoEditMode) {
    customerInfoSavedSummary?.classList.add("hidden-field");
    profileFieldLabel(profileFields.name)?.classList.remove("hidden-field");
    profileFieldLabel(profileFields.phone)?.classList.remove("hidden-field");
    profileFieldLabel(profileFields.email)?.classList.remove("hidden-field");
    profileFields.name?.classList.remove("hidden-field");
    profileFields.phone?.classList.remove("hidden-field");
    profileFields.email?.classList.remove("hidden-field");
  }
  requestProfile.innerHTML = `
    <strong>${customerProfile.name || "Saved customer"}</strong>
    <span>${customerProfile.phone || "No phone"} - ${customerProfile.email || "No email"}</span>
    <span>Delivery: ${customerProfile.deliveryAddress || "Add delivery address"}</span>
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
  if (service.category === "Service Areas") {
    serviceAreaNoFeeSelected = false;
    [...cart.values()]
      .filter((item) => item.service.category === "Service Areas" && item.service.id !== service.id)
      .forEach((item) => cart.delete(item.service.id));
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

function parseStoredDate(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? time : 0;
}

function saveRequestMessages() {
  localStorage.setItem("hopesGoRequestMessages", JSON.stringify(requestMessages));
}

function getMessageChannel(message = {}) {
  return message.channel || MESSAGE_CHANNEL_CUSTOMER_DRIVER;
}

function getRequestMessages(requestId, channel = null) {
  return requestMessages.filter(
    (message) => message.requestId === requestId && (!channel || getMessageChannel(message) === channel),
  );
}

function getMessageWindowInfo(request) {
  if (!request) return { open: false, label: "No active request", remainingMs: 0 };
  if (request.status !== "Completed") return { open: true, label: "Messaging active", remainingMs: null };
  const completedAtMs = Number(request.completedAtMs || parseStoredDate(request.completedAt));
  const remainingMs = completedAtMs ? Math.max(0, completedAtMs + POST_DELIVERY_MESSAGE_WINDOW_MS - Date.now()) : 0;
  return {
    open: remainingMs > 0,
    label:
      remainingMs > 0
        ? `Messaging available for: ${Math.ceil(remainingMs / 60000)} minutes remaining`
        : "Messaging window closed. Conversation archived.",
    remainingMs,
  };
}

function getMessagePartyLabel(sender) {
  if (sender === "driver") return "Driver";
  if (sender === "admin") return "Admin";
  return "Customer";
}

function getUnreadMessageCount(requestId, viewer, channel = MESSAGE_CHANNEL_CUSTOMER_DRIVER) {
  return getRequestMessages(requestId, channel).filter(
    (message) => message.sender !== viewer && !message.readBy?.includes(viewer),
  ).length;
}

function markMessagesRead(requestId, viewer, channel = MESSAGE_CHANNEL_CUSTOMER_DRIVER) {
  let changed = false;
  requestMessages = requestMessages.map((message) => {
    if (
      message.requestId !== requestId ||
      getMessageChannel(message) !== channel ||
      message.sender === viewer ||
      message.readBy?.includes(viewer)
    ) return message;
    changed = true;
    return { ...message, readBy: [...(message.readBy || []), viewer] };
  });
  if (changed) saveRequestMessages();
}

function getMessageChannelParticipants(channel) {
  if (channel === MESSAGE_CHANNEL_ADMIN_DRIVER) return ["admin", "driver"];
  if (channel === MESSAGE_CHANNEL_ADMIN_CUSTOMER) return ["admin", "customer"];
  return ["customer", "driver"];
}

function addRequestMessage(requestId, sender, text, channel = MESSAGE_CHANNEL_CUSTOMER_DRIVER) {
  const request = requests.find((item) => item.id === requestId);
  const windowInfo = getMessageWindowInfo(request);
  if (
    !request ||
    !windowInfo.open ||
    !getMessageChannelParticipants(channel).includes(sender) ||
    !String(text || "").trim()
  ) return false;
  requestMessages.push({
    id: `MSG-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    requestId,
    channel,
    sender,
    text: String(text).trim(),
    createdAt: new Date().toISOString(),
    readBy: [sender],
  });
  saveRequestMessages();
  requests = requests.map((item) =>
    item.id === requestId
      ? {
          ...item,
          messageArchived: false,
          messageUpdatedAt: new Date().toISOString(),
          messageCount: getRequestMessages(requestId).length,
        }
      : item
  );
  saveRequests();
  renderMessagingSurfaces();
  return true;
}

function getMessageChannelTitle(channel) {
  if (channel === MESSAGE_CHANNEL_ADMIN_DRIVER) return "Admin ↔ Driver";
  if (channel === MESSAGE_CHANNEL_ADMIN_CUSTOMER) return "Admin ↔ Customer";
  return "Customer ↔ Driver";
}

function renderConversation(request, viewer, options = {}) {
  if (!request) return `<div class="empty-state">No active request conversation.</div>`;
  const channel = options.channel || MESSAGE_CHANNEL_CUSTOMER_DRIVER;
  const readOnly = Boolean(options.readOnly);
  const title = options.title || getMessageChannelTitle(channel);
  const windowInfo = getMessageWindowInfo(request);
  const messages = getRequestMessages(request.id, channel);
  const unread = readOnly ? 0 : getUnreadMessageCount(request.id, viewer, channel);
  if (!readOnly) markMessagesRead(request.id, viewer, channel);
  return `
    <div class="message-thread ${readOnly ? "message-thread-readonly" : ""}" data-message-thread="${escapeHtml(request.id)}" data-message-channel="${escapeHtml(channel)}">
      <div class="message-thread-header">
        <div>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(request.id)} · ${escapeHtml(request.items || "Active request")}</span>
        </div>
        <span class="pill">${readOnly ? "View only" : `${unread} unread`}</span>
      </div>
      <p class="message-window-status" data-message-countdown="${escapeHtml(request.id)}">${escapeHtml(windowInfo.label)}</p>
      <div class="message-list">
        ${
          messages.length
            ? messages
                .map(
                  (message) => `
                    <div class="message-bubble ${message.sender === viewer ? "mine" : ""}">
                      <strong>${getMessagePartyLabel(message.sender)}</strong>
                      <p>${escapeHtml(message.text)}</p>
                      <small>${escapeHtml(formatDateTime(message.createdAt))} - ${message.readBy?.length > 1 ? "Read" : "Sent"}</small>
                    </div>
                  `
                )
                .join("")
            : `<div class="empty-state">No messages yet.</div>`
        }
      </div>
      ${
        windowInfo.open && !readOnly
          ? `<form class="message-form" data-message-form="${escapeHtml(request.id)}" data-message-sender="${viewer}" data-message-channel="${escapeHtml(channel)}">
              ${
                viewer === "driver" && channel === MESSAGE_CHANNEL_CUSTOMER_DRIVER
                  ? `<div class="quick-reply-grid">
                      ${quickDriverMessages
                        .map(
                          (message) =>
                            `<button class="secondary-admin-action" type="button" data-quick-message="${escapeHtml(message)}" data-request-id="${escapeHtml(request.id)}" data-message-channel="${escapeHtml(channel)}">${escapeHtml(message)}</button>`
                        )
                        .join("")}
                    </div>`
                  : ""
              }
              <label>
                Message
                <textarea rows="3" data-message-input placeholder="${channel === MESSAGE_CHANNEL_ADMIN_DRIVER ? "Message the driver privately" : channel === MESSAGE_CHANNEL_ADMIN_CUSTOMER ? "Message the customer privately" : "Type a secure request message"}"></textarea>
              </label>
              <button class="checkout-button" type="submit">Send</button>
            </form>`
          : `<p class="payment-note">${readOnly ? "Administration can review this conversation but cannot join it." : "Conversation is read-only and archived with this request."}</p>`
      }
    </div>
  `;
}

function getActiveDriverRequest() {
  return (
    acceptedDriverJob ||
    requests.find((request) => request.status === "Accepted by driver" && request.assignedDriver === currentEmployee) ||
    requests.find((request) => request.status === "Completed" && request.assignedDriver === currentEmployee)
  );
}

function getCustomerActiveRequest() {
  const customer = getCurrentCustomer();
  return requests.find(
    (request) =>
      request.assignedDriver &&
      ["Accepted by driver", "Completed"].includes(request.status) &&
      ((customer.email && request.email?.toLowerCase() === customer.email.toLowerCase()) ||
        (customer.phone && normalizePhone(request.phone) === normalizePhone(customer.phone)))
  );
}

function renderMessagingSurfaces() {
  const activeDriverRequest = getActiveDriverRequest();
  const unreadDriver = activeDriverRequest
    ? getUnreadMessageCount(activeDriverRequest.id, "driver", MESSAGE_CHANNEL_CUSTOMER_DRIVER) +
      getUnreadMessageCount(activeDriverRequest.id, "driver", MESSAGE_CHANNEL_ADMIN_DRIVER)
    : 0;
  if (driverMessageBadge) driverMessageBadge.textContent = `${unreadDriver} unread`;
  if (driverMessagesPanel) {
    driverMessagesPanel.innerHTML = activeDriverRequest
      ? `<div class="request-conversation-stack">
          ${renderConversation(activeDriverRequest, "driver", {
            channel: MESSAGE_CHANNEL_CUSTOMER_DRIVER,
            title: "Customer conversation",
          })}
          ${renderConversation(activeDriverRequest, "driver", {
            channel: MESSAGE_CHANNEL_ADMIN_DRIVER,
            title: "Private message with administration",
          })}
        </div>`
      : `<div class="empty-state">No active request conversation.</div>`;
  }
  if (driverActiveMessaging) {
    driverActiveMessaging.innerHTML = renderConversation(activeDriverRequest, "driver", {
      channel: MESSAGE_CHANNEL_CUSTOMER_DRIVER,
      title: "Customer conversation",
    });
  }
  renderCustomerOrdersPage();
  renderAdminMessages();
  renderAdminConversationCounts();
  updateMessageCountdowns();
}

function updateMessageCountdowns() {
  document.querySelectorAll("[data-message-countdown]").forEach((item) => {
    const request = requests.find((entry) => entry.id === item.dataset.messageCountdown);
    if (!request) return;
    const windowInfo = getMessageWindowInfo(request);
    item.textContent = windowInfo.label;
    const form = item.closest("[data-message-thread]")?.querySelector("[data-message-form]");
    form?.querySelector("button[type='submit']")?.toggleAttribute("disabled", !windowInfo.open);
    if (!windowInfo.open && request.status === "Completed" && !request.messageArchived) {
      requests = requests.map((entry) =>
        entry.id === request.id
          ? { ...entry, messageArchived: true, messageCount: getRequestMessages(request.id).length, messageArchivedAt: new Date().toISOString() }
          : entry
      );
      saveRequests();
    }
  });
}

function getDriverBonusPay(name = currentEmployee) {
  const activeBonus = driverBonusPay.find(
    (bonus) => bonus.active && bonus.driver.toLowerCase() === String(name || "").toLowerCase()
  );
  return activeBonus || { amount: 0, reason: "No bonus pay active right now." };
}

function getCurrentDriverOperationsRecord(status = latestOperationsStatus) {
  if (!currentEmployee || !Array.isArray(status?.drivers)) return null;
  return status.drivers.find(
    (driver) => driver.name.toLowerCase() === String(currentEmployee).toLowerCase()
  ) || null;
}

function isCurrentDriverClockedIn(status = latestOperationsStatus) {
  return getCurrentDriverOperationsRecord(status)?.clockedIn === true;
}

function getDriverDemandStatus() {
  const driverCount = Math.max(approvedDriverLogins.length, 1);
  const now = Date.now();
  const recentRequests = requests.filter((request) => {
    const createdTime = parseStoredDate(request.createdAt);
    return createdTime && now - createdTime <= 30 * 60 * 1000;
  });
  const recentDriverReady = recentRequests.filter((request) =>
    ["Approved for drivers", "Accepted by driver", "Completed"].includes(request.status)
  );
  const minutesPerDriver =
    recentDriverReady.length > 0 ? 30 / (recentDriverReady.length / driverCount) : Number.POSITIVE_INFINITY;

  if (minutesPerDriver <= 5) {
    return {
      label: "Very busy",
      wait: "Drivers are getting requests about every 5 minutes or less.",
      className: "very-busy",
    };
  }

  if (minutesPerDriver <= 10) {
    return {
      label: "Busy",
      wait: "Drivers are getting requests about every 10 minutes.",
      className: "busy",
    };
  }

  return {
    label: "Not busy",
    wait: "Driver wait time is currently more than 10 minutes.",
    className: "not-busy",
  };
}

function renderDriverStatusSummary() {
  if (!driverStatusSummary) return;
  const clockedIn = isCurrentDriverClockedIn();

  if (driverGreeting) {
    driverGreeting.textContent = `Hello, ${currentEmployee || "driver"}`;
  }
  updateDriverPageTitle(document.querySelector(".driver-page.active")?.id || "driverHome");

  if (!clockedIn) {
    if (driverDemandPill) {
      driverDemandPill.textContent = "Clock in required";
      driverDemandPill.className = "pill demand-pill status-offline";
      driverDemandPill.title = "Approved requests remain private until you clock in.";
    }
    driverStatusSummary.innerHTML = `
      <article>
        <span>Request access</span>
        <strong>Clock in first</strong>
        <p>Approved offers and live request activity become available after you clock in.</p>
      </article>
    `;
    return;
  }

  const approvedCount = requests.filter((request) => request.status === "Approved for drivers").length;
  const activeCount = requests.filter(
    (request) => request.status === "Accepted by driver" && request.assignedDriver === currentEmployee
  ).length;
  const bonus = getDriverBonusPay();
  const demand = getDriverDemandStatus();

  if (driverDemandPill) {
    driverDemandPill.textContent = demand.label;
    driverDemandPill.className = `pill demand-pill ${demand.className}`;
    driverDemandPill.title = "Live activity based on driver-ready requests from the last 30 minutes. Updates every minute.";
  }

  driverStatusSummary.innerHTML = `
    <article>
      <span>Live app activity</span>
      <strong>${demand.label}</strong>
      <p>${demand.wait} Updates automatically every minute.</p>
    </article>
    <article>
      <span>Bonus pay available</span>
      <strong>${money(Number(bonus.amount || 0))}</strong>
      <p>${escapeHtml(bonus.reason || "No bonus pay active right now.")}</p>
    </article>
    <article>
      <span>Ready requests</span>
      <strong>${approvedCount}</strong>
      <p>${activeCount ? "Finish your current job before accepting another." : "Available jobs will appear below."}</p>
    </article>
  `;
}

function renderDriverOfferQueue() {
  const orderQueue = document.querySelector("#orderQueue");
  if (!orderQueue) return;
  const queueColumn = orderQueue.closest(".ops-column");
  const queueTitle = queueColumn?.querySelector(".section-heading h2");
  const queueSubtitle = queueColumn?.querySelector(".section-heading span");

  if (!isCurrentDriverClockedIn()) {
    if (queueTitle) queueTitle.textContent = "Request access";
    if (queueSubtitle) queueSubtitle.textContent = "Clock in required";
    orderQueue.innerHTML = `<div class="empty-state">Clock in to view approved requests.</div>`;
    return;
  }

  if (queueTitle) queueTitle.textContent = "Approved requests";
  if (queueSubtitle) queueSubtitle.textContent = "Ready to accept";
  const approvedRequests = requests.filter(
    (request) =>
      request.status === "Approved for drivers" &&
      (!request.assignedDriver || request.assignedDriver.toLowerCase() === currentEmployee.toLowerCase())
  );

  orderQueue.innerHTML = approvedRequests.length
    ? approvedRequests
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
        .join("")
    : `<div class="empty-state">No approved requests are ready right now.</div>`;
}

function renderEmployeeViews() {
  renderEmployeeAccess();
  if (!currentEmployee) return;
  renderDriverStatusSummary();
  renderMonthlyScheduleActivity();

  renderDriverOfferQueue();

  renderDriverDashboard();
  renderDriverPay();
  renderPastJobs();
  renderDriverDocuments();
  renderDriverProfile();
  renderMessagingSurfaces();
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
  renderDriverStatusSummary();
  const activeJob = acceptedDriverJob || requests.find((request) => request.status === "Accepted by driver" && request.assignedDriver === currentEmployee);
  if (activeJob && !acceptedDriverJob) acceptedDriverJob = activeJob;
  completionForm.classList.toggle("active", Boolean(activeJob));

  if (!activeJob) {
    container.innerHTML = `
      <div class="empty-state">Accept an available job to see the driver dashboard.</div>
    `;
    if (driverActiveMessaging) driverActiveMessaging.innerHTML = `<div class="empty-state">Messages appear here after a job is accepted.</div>`;
    return;
  }

  const isShoppingJob = activeJob.items.toLowerCase().includes("shop");
  receiptPhotoField.classList.toggle("active", isShoppingJob);
  handoffPinField?.classList.toggle("active", activeJob.deliveryMethod === "hand_to_customer");

  container.innerHTML = `
    <article class="driver-job-card">
      <div class="driver-job-main">
        <div>
          <span class="pill">Assigned</span>
          <h3>${activeJob.id} - ${activeJob.customer}</h3>
          <p>${activeJob.items}</p>
        </div>
        <strong>${money(activeJob.total)}</strong>
      </div>
      <div class="driver-info-grid">
        <div>
          <span>Customer name</span>
          <strong>${displayValue(activeJob.customer)}</strong>
        </div>
        <div>
          <span>Pickup</span>
          <strong>${displayValue(activeJob.pickup)}</strong>
        </div>
        <div>
          <span>Pickup instructions</span>
          <strong>${displayValue(activeJob.pickupInstructions, "No pickup instructions")}</strong>
        </div>
        <div>
          <span>Delivery</span>
          <strong>${displayValue(activeJob.dropoff)}</strong>
        </div>
        <div>
          <span>Drop-off instructions</span>
          <strong>${displayValue(activeJob.dropoffInstructions, "No drop-off instructions")}</strong>
        </div>
        <div>
          <span>Estimated drive</span>
          <strong>${displayValue(activeJob.distance)}</strong>
        </div>
        <div>
          <span>Notes</span>
          <strong>${displayValue(activeJob.notes, "No notes")}</strong>
        </div>
        <div>
          <span>Completion proof</span>
          <strong>${activeJob.deliveryMethod === "hand_to_customer" ? "Customer code required" : "Drop-off photo required"}</strong>
        </div>
        ${
          activeJob.additionalStopAddress
            ? `
        <div>
          <span>Additional stop</span>
          <strong>${displayValue(activeJob.additionalStopAddress)}</strong>
        </div>
        <div>
          <span>Additional stop notes</span>
          <strong>${displayValue(activeJob.additionalStopNotes, "No extra notes")}</strong>
        </div>`
            : ""
        }
        <div>
          <span>Delivery method</span>
          <strong>${formatDeliveryMethod(activeJob.deliveryMethod)}</strong>
        </div>
        <div>
          <span>Customer code</span>
          <strong>${activeJob.deliveryMethod === "hand_to_customer" ? "Ask customer for their 4-digit code" : "Not needed"}</strong>
        </div>
      </div>
      ${renderDriverShoppingInfo(activeJob)}
      <div class="map-actions">
        <a class="primary-action" href="${mapLink(activeJob.pickup)}" target="_blank" rel="noreferrer">Open pickup map</a>
        <a class="primary-action" href="${mapLink(activeJob.dropoff)}" target="_blank" rel="noreferrer">Open delivery map</a>
        <a class="secondary-map-action" href="${fullRouteLink(activeJob)}" target="_blank" rel="noreferrer">Open full route</a>
      </div>
      <p class="payment-note">When the driver accepts this dispatched job, the customer charge can be captured through Stripe.</p>
    </article>
  `;
  if (driverActiveMessaging) driverActiveMessaging.innerHTML = renderConversation(activeJob, "driver");
}

function validateCompletion() {
  if (!acceptedDriverJob) return "No active job to complete.";

  const isShoppingJob = acceptedDriverJob.items.toLowerCase().includes("shop");
  if (isShoppingJob && !receiptPhoto.files.length) {
    return "Shopping orders require a receipt photo.";
  }

  if (acceptedDriverJob.deliveryMethod === "hand_to_customer") {
    if (!handedToCustomer.checked) {
      return "Confirm the order was handed directly to the customer.";
    }
    if (handoffPinInput.value.trim() !== String(acceptedDriverJob.deliveryPin || "")) {
      return "Enter the customer's 4-digit handoff code to complete this job.";
    }
  }

  if (acceptedDriverJob.deliveryMethod !== "hand_to_customer" && !dropoffPhoto.files.length) {
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
        <span><strong>Shopping store:</strong> ${escapeHtml(job.shoppingRetailer || "Not specified")}</span>
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
  const completedJobs = records.length;
  const container = document.querySelector("#driverPayDetails");

  container.innerHTML = `
    <div class="pay-summary">
      <article><span>Current Pay Period</span><strong>${formatDateOnly(new Date().toISOString())}</strong></article>
      <article><span>Estimated Earnings</span><strong>${money(servicePay + tips)}</strong></article>
      <article><span>Completed Jobs</span><strong>${completedJobs}</strong></article>
      <article><span>Tips</span><strong>${money(tips)}</strong></article>
      <article><span>Payroll Status</span><strong>${records.length ? "Pending payroll review" : "No payroll records yet"}</strong></article>
    </div>
    <p class="payment-note">This page is informational only. Payroll actions will appear here only after a real payroll function is connected.</p>
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

function renderDriverDocuments() {
  if (!driverDocumentsList) return;
  driverDocumentsList.innerHTML = `
    <div class="integration-list driver-document-links">
      <a href="assets/terms-of-service.pdf" target="_blank" rel="noreferrer"><strong>Terms of Service</strong><span>Customer-facing policy reference for delivery and refund rules.</span><em>Open document</em></a>
      <a href="assets/driver-completion-proof.html" target="_blank" rel="noreferrer"><strong>Completion Proof</strong><span>Drop-off photo or handoff code requirements before closing a request.</span><em>Open document</em></a>
      <a href="assets/driver-contact-safety.html" target="_blank" rel="noreferrer"><strong>Contact Safety</strong><span>Safe in-app communication rules for customer and driver privacy.</span><em>Open document</em></a>
    </div>
  `;
}

function renderDriverProfile() {
  if (!driverProfileDetails) return;
  const currentAvailability = getAvailabilityForDriver();
  driverProfileDetails.innerHTML = `
    <div class="alert-card">
      <div class="alert-top">
        <strong>${escapeHtml(currentEmployee || "Driver")}</strong>
        <span class="pill">Active</span>
      </div>
      <p><strong>Role:</strong> Driver</p>
      <p><strong>Available Days:</strong> ${escapeHtml(getAvailableDaysText(currentAvailability?.selections || {}))}</p>
      <p><strong>Selected Time Blocks:</strong> ${escapeHtml(getSelectedBlocksText(currentAvailability?.selections || {}))}</p>
      <p><strong>Last Updated Date:</strong> ${escapeHtml(formatDateTime(currentAvailability?.updatedAt))}</p>
    </div>
  `;
}

function normalizeCatalogLearningText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getCatalogLearningItemsFromRequest(request) {
  if (Array.isArray(request?.shoppingCustomItems)) return request.shoppingCustomItems.filter(Boolean);
  const products = Array.isArray(request?.shoppingProducts) ? request.shoppingProducts : [];
  return (Array.isArray(request?.shoppingList) ? request.shoppingList : []).filter((item) => {
    const itemText = normalizeCatalogLearningText(item);
    return !products.some((product) => {
      const brand = normalizeCatalogLearningText(product.brand);
      const name = normalizeCatalogLearningText(product.name);
      return name && itemText.includes(name) && (!brand || itemText.includes(brand));
    });
  });
}

async function captureRequestCatalogLearning(request) {
  const items = getCatalogLearningItemsFromRequest(request);
  if (!request?.id || !items.length) return 0;
  try {
    const response = await fetch(apiUrl("/catalog-learning/capture"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: request.id,
        storeName: request.shoppingRetailer || "Other store",
        items,
      }),
    });
    if (!response.ok) return 0;
    const result = await response.json();
    return Number(result.captured || 0);
  } catch {
    return 0;
  }
}

function completeAcceptedJob() {
  if (!acceptedDriverJob) return;
  const serviceFee = Number(acceptedDriverJob.serviceFee || 0);
  const tips = Number(acceptedDriverJob.tip || 0);
  const driverShare = Math.round(serviceFee * 0.4 * 100) / 100;
  const completedAt = new Date().toLocaleString();

  driverPayRecords.unshift({
    driver: currentEmployee,
    job: acceptedDriverJob.id,
    serviceFee,
    driverShare,
    tips,
    status: tips > 0 ? "Tips held" : "No tips",
    submitted: false,
    completedAt,
  });
  saveStoredList("hopesGoDriverPayRecords", driverPayRecords);

  pastJobs.unshift({
    driver: currentEmployee,
    job: acceptedDriverJob.id,
    service: acceptedDriverJob.items,
    completed: completedAt,
    mileage: acceptedDriverJob.distance,
    proof:
      acceptedDriverJob.deliveryMethod === "hand_to_customer"
        ? "Completed with customer handoff code"
        : "Completed with drop-off photo",
  });
  saveStoredList("hopesGoPastJobs", pastJobs);

  driverTracking.unshift({
    driver: currentEmployee,
    job: acceptedDriverJob.id,
    status: "Completed",
    lastLocation: acceptedDriverJob.dropoff,
    routeMiles: Number(String(acceptedDriverJob.distance).match(/\d+/)?.[0] || 0),
    note: "Completed job saved for export.",
  });
  saveStoredList("hopesGoDriverTracking", driverTracking);

  requests = requests.map((request) =>
    request.id === acceptedDriverJob.id
      ? {
          ...request,
          status: "Completed",
          assignedDriver: currentEmployee,
          completedAt,
          completedAtMs: Date.now(),
          messageArchived: false,
        }
      : request
  );
  saveRequests();
  void captureRequestCatalogLearning(acceptedDriverJob);
}

function getDriverPhone(name) {
  return approvedDriverLogins.find((login) => login.name.toLowerCase() === String(name || "").toLowerCase())?.phone || "";
}

function getDailyReportRows(type) {
  if (type === "jobs") {
    return pastJobs.map((job) => ({
      Driver: job.driver,
      Job: job.job,
      Service: job.service,
      Completed: job.completed,
      Mileage: job.mileage,
      Proof: job.proof,
    }));
  }

  if (type === "mileage") {
    return driverTracking.map((driver) => ({
      Driver: driver.driver,
      Job: driver.job,
      Status: driver.status,
      "Last Location": driver.lastLocation,
      Miles: driver.routeMiles,
      Note: driver.note,
    }));
  }

  if (type === "tips") {
    return driverPayRecords
      .filter((record) => Number(record.tips || 0) > 0)
      .map((record) => ({
        Driver: record.driver,
        Job: record.job,
        Tips: record.tips,
        Status: record.status,
      }));
  }

  if (type === "payroll") {
    return driverPayRecords.map((record) => ({
      Driver: record.driver,
      Job: record.job,
      "Service Fee": record.serviceFee,
      "Driver Share": record.driverShare,
      Tips: record.tips,
      Status: record.status,
      Completed: record.completedAt || "",
    }));
  }

  if (type === "taxRecords") {
    return driverTracking.map((driver) => ({
      Driver: driver.driver,
      Job: driver.job,
      Miles: driver.routeMiles,
      Status: driver.status,
      Note: driver.note,
    }));
  }

  if (type === "documents") {
    return [
      { Document: "Terms of Service", Status: "Available", Owner: "Admin" },
      { Document: "Completion Proof Policy", Status: "Available", Owner: "Admin" },
      { Document: "Messaging Archive Policy", Status: "Available", Owner: "Admin" },
    ];
  }

  if (type === "customers") {
    const profileRows = customerProfile
      ? [
          {
            Name: customerProfile.name,
            Phone: customerProfile.phone,
            Email: customerProfile.email,
            "Delivery Address": customerProfile.deliveryAddress,
            Notes: customerProfile.notes,
            Source: "Current profile",
          },
        ]
      : [];
    const accountRows = customerAccounts.map((account) => ({
      Name: account.name,
      Phone: account.phone,
      Email: account.email,
      "Delivery Address": account.deliveryAddress || "",
      Notes: account.notes || "",
      Source: "Customer account",
    }));
    return [...accountRows, ...profileRows];
  }

  if (type === "drivers") {
    return employeeAvailability.map((entry) => ({
      Driver: entry.name,
      "Available Days": getAvailableDaysText(entry.selections),
      "Selected Time Blocks": getSelectedBlocksText(entry.selections),
      "Last Updated Date": formatDateTime(entry.updatedAt),
      Notes: entry.notes || "",
    }));
  }

  if (type === "requests") {
    return requests.map((request) => ({
      "Request ID": request.id,
      Customer: request.customer,
      Phone: request.phone,
      Items: request.items,
      Pickup: request.pickup,
      Dropoff: request.dropoff,
      Distance: request.distance,
      Total: request.total,
      Status: request.status,
      Driver: request.assignedDriver || "",
      Messages: getRequestMessages(request.id).length,
    }));
  }

  if (type === "driverLogs") {
    const trackingRows = driverTracking.map((driver) => ({
      Driver: driver.driver,
      Job: driver.job,
      Status: driver.status,
      "Last Location": driver.lastLocation,
      Miles: driver.routeMiles,
      Note: driver.note,
      Source: "Active tracking",
    }));
    const historyRows = pastJobs.map((job) => ({
      Driver: job.driver,
      Job: job.job,
      Status: "Completed",
      "Last Location": "",
      Miles: job.mileage,
      Note: `${job.service} - ${job.proof}`,
      Source: "Past jobs",
    }));
    return [...trackingRows, ...historyRows];
  }

  if (type === "pay") {
    return getDailyReportRows("payroll");
  }

  return [];
}

function formatRecordCount(count) {
  return `${count} ${count === 1 ? "Record" : "Records"}`;
}

function toCsv(rows) {
  if (!rows.length) return "No records yet\n";
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escapeCell).join(","), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(","))].join("\n");
}

function downloadDailyReport(type, format = "csv") {
  const rows = getDailyReportRows(type);
  const normalizedFormat = String(format || "csv").toLowerCase();
  const csv = toCsv(rows);
  const contents =
    normalizedFormat === "csv"
      ? csv
      : `Hope's & Go ${normalizedFormat.toUpperCase()} export placeholder\n\nThis file contains the same export data and is ready for the connected ${normalizedFormat.toUpperCase()} generator.\n\n${csv}`;
  const mime =
    normalizedFormat === "pdf"
      ? "application/pdf"
      : normalizedFormat === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv;charset=utf-8";
  const blob = new Blob(["\ufeff", contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `hopes-go-${type}-${date}.${normalizedFormat}`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getDailyUpdateSummary() {
  return [
    ["Jobs", getDailyReportRows("jobs").length, "Completed job records"],
    ["Driver Status", requests.filter((request) => request.assignedDriver).length, "Assigned driver request statuses"],
    ["Mileage", getDailyReportRows("mileage").length, "Mileage records updated"],
    ["Payroll Totals", getDailyReportRows("payroll").length, "Payroll records updated"],
    ["Tips", getDailyReportRows("tips").length, "Tip records updated"],
    ["Reports", exportCategories.length, "Export categories refreshed"],
    ["Dashboard Metrics", getDashboardStats().length, "Dashboard counts recalculated"],
  ];
}

function showDailyUpdateToast(summary) {
  if (!dailyUpdateToast) return;
  const jobs = summary.find(([title]) => title === "Jobs")?.[1] || 0;
  const mileage = summary.find(([title]) => title === "Mileage")?.[1] || 0;
  const payroll = summary.find(([title]) => title === "Payroll Totals")?.[1] || 0;
  dailyUpdateToast.innerHTML = `
    <strong>✅ Daily Update Completed</strong>
    <span>Jobs Updated: ${jobs}</span>
    <span>Mileage Records Updated: ${mileage}</span>
    <span>Payroll Records Updated: ${payroll}</span>
  `;
  dailyUpdateToast.classList.add("active");
  window.setTimeout(() => dailyUpdateToast.classList.remove("active"), 5000);
}

function recordDailyArchive(now) {
  const date = new Date(now);
  const folder = `${date.getFullYear()} / ${date.toLocaleString("en-US", { month: "long" })} / ${date.toISOString().slice(0, 10)}`;
  const files = ["Drivers.xlsx", "Customers.xlsx", "Jobs.xlsx", "Mileage.xlsx", "Payroll.xlsx", "Tips.xlsx", "TaxRecords.xlsx"];
  const entry = {
    date: date.toISOString(),
    fileCount: files.length,
    archiveStatus: "✅ Daily Archive Complete",
    folder,
    confirmationId: `OD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(Date.now()).slice(-5)}`,
    files,
  };
  archiveLog.unshift(entry);
  saveStoredList("hopesGoArchiveLog", archiveLog);
}

function renderArchiveLog() {
  if (!archiveLogBoard) return;
  archiveLogBoard.innerHTML = archiveLog.length
    ? archiveLog
        .map(
          (entry) => `
            <div class="alert-card">
              <div class="alert-top">
                <strong>✅ Daily Archive Complete</strong>
                <span class="pill">${escapeHtml(entry.archiveStatus)}</span>
              </div>
              <p><strong>Date:</strong> ${escapeHtml(formatDateTime(entry.date))}</p>
              <p><strong>File Count:</strong> ${entry.fileCount}</p>
              <p><strong>Archive Status:</strong> ${escapeHtml(entry.archiveStatus)}</p>
              <p><strong>OneDrive Confirmation ID:</strong> ${escapeHtml(entry.confirmationId)}</p>
              <p><strong>Folder:</strong> ${escapeHtml(entry.folder)}</p>
            </div>
          `
        )
        .join("")
    : `<div class="empty-state">No daily archive log entries yet.</div>`;
}

function renderDailyUpdate(runNow = false) {
  if (!dailyUpdateBoard) return;
  const summary = getDailyUpdateSummary();
  if (runNow) {
    const now = new Date().toISOString();
    dailyUpdateHistory.unshift({ date: now, summary });
    saveStoredList("hopesGoDailyUpdateHistory", dailyUpdateHistory);
    recordDailyArchive(now);
    showDailyUpdateToast(summary);
    renderAdminBoards();
    renderEmployeeViews();
  }
  const lastRun = dailyUpdateHistory[0];
  dailyUpdateBoard.innerHTML = summary
    .map(
      ([title, count, note]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">${formatRecordCount(count)}</span>
          </div>
          <p>${note}</p>
        </div>
      `
    )
    .join("");
  if (dailyUpdateStamp) {
    dailyUpdateStamp.textContent = lastRun ? `Last Daily Update: ${formatDateTime(lastRun.date)}` : "Last Daily Update: Not run yet";
  }
  if (dailyUpdateStatus) {
    dailyUpdateStatus.innerHTML = lastRun
      ? `<strong>Last Daily Update</strong><span>${formatDateOnly(lastRun.date)}</span><span>${new Date(lastRun.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>`
      : `<strong>Last Daily Update</strong><span>Not run yet</span>`;
  }
  renderArchiveLog();
  renderExportCenter();
}

function getDispatchFilterInfo(filter = adminDispatchFilter) {
  const filters = {
    all: { label: "All requests", description: "Every saved request", match: () => true },
    review: {
      label: "Needs review",
      description: "Waiting for admin approval or send-back",
      match: (request) => request.status === "Admin reviewing" || request.status === "Needs customer fix",
    },
    ready: {
      label: "Ready for drivers",
      description: "Approved and visible in the driver app",
      match: (request) => request.status === "Approved for drivers",
    },
    completed: {
      label: "Completed jobs",
      description: "Finished driver jobs saved for records",
      match: (request) => request.status === "Completed",
    },
  };
  return filters[filter] || filters.all;
}

function getDashboardStats() {
  return [
    ["Drivers", employeeAvailability.length],
    ["Customers", getDailyReportRows("customers").length],
    ["Active Requests", requests.filter((request) => ["Admin reviewing", "Needs customer fix", "Approved for drivers", "Accepted by driver"].includes(request.status)).length],
    ["Completed Requests", requests.filter((request) => request.status === "Completed").length],
    ["Mileage Records", getDailyReportRows("mileage").length],
    ["Payroll Records", getDailyReportRows("payroll").length],
    ["Messages", requestMessages.length],
  ];
}

function renderExportCenter() {
  const exportCenter = document.querySelector("#exportCenter");
  const exportNotes = document.querySelector("#exportNotes");
  if (!exportCenter) return;
  exportCenter.innerHTML = exportCategories
    .map(
      (category) => `
        <div class="alert-card export-category-card">
          <div class="alert-top">
            <strong>${category.label}</strong>
            <span class="pill">${formatRecordCount(getDailyReportRows(category.id).length)}</span>
          </div>
          <div class="export-format-actions">
            ${exportFormats
              .map(
                (format) =>
                  `<button class="secondary-admin-action" type="button" data-download-report="${category.id}" data-export-format="${format.toLowerCase()}">Export ${format}</button>`
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");
  if (exportNotes) {
    exportNotes.innerHTML = `
      <div class="integration-list">
        <div><strong>Standard Daily Archive</strong><span>Drivers, Customers, Jobs, Mileage, Payroll, Tips, and TaxRecords are included in the end-of-day archive record.</span></div>
        <div><strong>OneDrive Folder Pattern</strong><span>Year / Month / Date, for example 2026 / July / 2026-07-12.</span></div>
        <div><strong>Formats</strong><span>CSV downloads are generated now. XLSX and PDF buttons produce matching export files once file-generation services are connected.</span></div>
      </div>
    `;
  }
}

function renderAdminConversationCounts() {
  const conversationElements = document.querySelectorAll("[data-admin-conversation-count]");
  conversationElements.forEach((element) => {
    const requestId = element.dataset.adminConversationCount;
    element.textContent = `${formatRecordCount(getRequestMessages(requestId, MESSAGE_CHANNEL_CUSTOMER_DRIVER).length)} in conversation`;
  });
}

function getAdminCustomerRecords() {
  const customerMap = new Map();
  getDailyReportRows("customers").forEach((customer) => {
    const key = String(customer.Email || "").trim().toLowerCase() ||
      normalizePhone(customer.Phone) ||
      String(customer.Name || "").trim().toLowerCase();
    if (!key) return;
    customerMap.set(key, { ...(customerMap.get(key) || {}), ...customer });
  });
  return [...customerMap.values()];
}

function renderAdminCustomers() {
  const board = document.querySelector("#adminCustomerBoard");
  const count = document.querySelector("#adminCustomerCount");
  if (!board) return;
  const customers = getAdminCustomerRecords();
  if (count) count.textContent = formatRecordCount(customers.length);
  board.innerHTML = customers.length
    ? `<div class="admin-customer-grid">
        ${customers.map((customer) => {
          const customerRequests = requests.filter(
            (request) =>
              (customer.Email && request.email?.toLowerCase() === String(customer.Email).toLowerCase()) ||
              (customer.Phone && normalizePhone(request.phone) === normalizePhone(customer.Phone)),
          );
          return `
            <article class="alert-card customer-record-card">
              <div class="alert-top">
                <strong>${displayValue(customer.Name, "Customer")}</strong>
                <span class="pill">${formatRecordCount(customerRequests.length)}</span>
              </div>
              <p><strong>Email:</strong> ${displayValue(customer.Email)}</p>
              <p><strong>Phone:</strong> ${displayValue(customer.Phone)}</p>
              <p><strong>Delivery address:</strong> ${displayValue(customer["Delivery Address"])}</p>
              <p><strong>Notes:</strong> ${displayValue(customer.Notes, "None")}</p>
            </article>
          `;
        }).join("")}
      </div>`
    : `<div class="empty-state">No customer records are available yet.</div>`;
}

function getOpenAdminMessageRequests() {
  return requests
    .filter((request) => request.assignedDriver && getMessageWindowInfo(request).open)
    .sort(sortRequestsByRecentMessage);
}

function sortRequestsByRecentMessage(a, b) {
  const bTime = Number(b.messageUpdatedAt ? parseStoredDate(b.messageUpdatedAt) : b.createdAtMs || parseStoredDate(b.createdAt));
  const aTime = Number(a.messageUpdatedAt ? parseStoredDate(a.messageUpdatedAt) : a.createdAtMs || parseStoredDate(a.createdAt));
  return bTime - aTime;
}

function getArchivedAdminMessageRequests() {
  return requests
    .filter(
      (request) =>
        request.assignedDriver &&
        !getMessageWindowInfo(request).open &&
        getRequestMessages(request.id).length > 0,
    )
    .sort(sortRequestsByRecentMessage);
}

function renderArchivedAdminConversation(request) {
  const archivedChannels = [
    [MESSAGE_CHANNEL_CUSTOMER_DRIVER, "Customer and driver conversation"],
    [MESSAGE_CHANNEL_ADMIN_DRIVER, "Private admin and driver conversation"],
    [MESSAGE_CHANNEL_ADMIN_CUSTOMER, "Private admin and customer conversation"],
  ].filter(([channel]) => getRequestMessages(request.id, channel).length > 0);
  return `
    <details class="admin-message-request-card archived-message-card">
      <summary class="admin-message-request-header">
        <div>
          <strong>${displayValue(request.id)} - ${displayValue(request.customer, "Customer")}</strong>
          <span>${displayValue(request.items, "Completed request")}</span>
        </div>
        <div class="admin-message-parties">
          <span class="pill">Archived</span>
          <span>Driver: ${displayValue(request.assignedDriver)}</span>
        </div>
      </summary>
      <div class="archived-conversation-list">
        ${archivedChannels.map(([channel, title]) => renderConversation(request, "admin", {
          channel,
          readOnly: true,
          title,
        })).join("")}
      </div>
    </details>
  `;
}

function renderAdminMessages() {
  const board = document.querySelector("#adminMessagesBoard");
  const count = document.querySelector("#adminActiveMessageCount");
  if (!board) return;
  const activeRequests = getOpenAdminMessageRequests();
  const archivedRequests = getArchivedAdminMessageRequests();
  if (count) count.textContent = `${activeRequests.length} Open`;
  const activeMarkup = activeRequests.length
    ? activeRequests.map((request) => `
        <article class="admin-message-request-card">
          <div class="admin-message-request-header">
            <div>
              <strong>${displayValue(request.id)} - ${displayValue(request.customer, "Customer")}</strong>
              <span>${displayValue(request.items, "Active request")}</span>
            </div>
            <div class="admin-message-parties">
              <span class="pill">${displayValue(request.status)}</span>
              <span>Driver: ${displayValue(request.assignedDriver)}</span>
            </div>
          </div>
          <section class="admin-observer-conversation">
            <div class="message-section-heading">
              <div>
                <strong>Customer / Driver</strong>
                <span>Administration view only</span>
              </div>
              <span class="pill">Cannot join</span>
            </div>
            ${renderConversation(request, "admin", {
              channel: MESSAGE_CHANNEL_CUSTOMER_DRIVER,
              readOnly: true,
              title: "Customer and driver conversation",
            })}
          </section>
          <div class="admin-direct-message-grid">
            <section>
              <div class="message-section-heading">
                <strong>Message Driver</strong>
                <span>Private admin chat</span>
              </div>
              ${renderConversation(request, "admin", {
                channel: MESSAGE_CHANNEL_ADMIN_DRIVER,
                title: `Private chat with ${request.assignedDriver || "driver"}`,
              })}
            </section>
            <section>
              <div class="message-section-heading">
                <strong>Message Customer</strong>
                <span>Private admin chat</span>
              </div>
              ${renderConversation(request, "admin", {
                channel: MESSAGE_CHANNEL_ADMIN_CUSTOMER,
                title: `Private chat with ${request.customer || "customer"}`,
              })}
            </section>
          </div>
        </article>
      `).join("")
    : `<div class="empty-state">No active or open driver conversations right now. Assigned requests will appear here automatically.</div>`;
  const archivedMarkup = archivedRequests.length
    ? archivedRequests.map(renderArchivedAdminConversation).join("")
    : `<div class="empty-state">No archived conversations yet.</div>`;
  board.innerHTML = `
    <section class="admin-message-section">
      <div class="message-section-heading"><strong>Active and Open</strong><span>${activeRequests.length} conversations</span></div>
      ${activeMarkup}
    </section>
    <section class="admin-message-section">
      <div class="message-section-heading"><strong>Archived Conversations</strong><span>Permanent read-only history</span></div>
      ${archivedMarkup}
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayValue(value, fallback = "Not provided") {
  return escapeHtml(value || fallback);
}

function formatDeliveryMethod(method) {
  return method === "hand_to_customer" ? "Hand to customer" : "Leave at door / no contact";
}

function renderDispatchDetailItem(label, value, extraClass = "") {
  return `
    <div class="dispatch-detail-item ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${displayValue(value)}</strong>
    </div>
  `;
}

function renderDispatchMoneyItem(label, value) {
  return renderDispatchDetailItem(label, money(Number(value || 0)));
}

function contactHref(type, value) {
  const clean = String(value || "").trim();
  if (!clean) return "#";
  if (type === "mail") return `mailto:${encodeURIComponent(clean)}`;
  if (type === "sms") return `sms:${clean}`;
  return `tel:${clean}`;
}

function renderDispatchActions(request) {
  const isReviewable = request.status === "Admin reviewing";
  const isWaitingOnCustomer = request.status === "Needs customer fix";

  if (isReviewable) {
    return `
      <label class="admin-reason-field">
        Send-back reason
        <input type="text" data-deny-reason="${escapeHtml(request.id)}" placeholder="Missing address, wrong service area, unclear request..." />
      </label>
      <div class="dispatch-actions">
        <button type="button" data-approve-request="${escapeHtml(request.id)}">Approve to drivers</button>
        <button type="button" data-deny-request="${escapeHtml(request.id)}">Send back to customer</button>
      </div>
    `;
  }

  return `
    <div class="dispatch-actions contact-actions">
      <span class="dispatch-waiting-note">Use request messages for customer-driver communication.</span>
      ${isWaitingOnCustomer ? `<span class="dispatch-waiting-note">Waiting on customer to fix and resubmit.</span>` : ""}
    </div>
  `;
}

function renderDispatchRequestCard(request) {
  const shoppingList = request.shoppingList?.length ? request.shoppingList.join(", ") : "";
  const shoppingPhotos = request.shoppingPhotos?.length ? request.shoppingPhotos.join(", ") : "";
  const completionRule =
    request.deliveryMethod === "hand_to_customer"
      ? `Customer must give driver code ${request.deliveryPin || "----"}`
      : "Driver must upload drop-off photo";

  return `
    <details class="alert-card dispatch-request-card">
      <summary class="dispatch-summary">
        <div>
          <strong>${displayValue(request.id)} - ${displayValue(request.customer, "Customer")}</strong>
          <p>${displayValue(request.items, "No services listed")}</p>
        </div>
        <span class="pill">${displayValue(request.status, "Status needed")}</span>
      </summary>

      <div class="dispatch-review-body">
        <div class="dispatch-detail-grid">
          ${renderDispatchDetailItem("Customer name", request.customer)}
          ${renderDispatchDetailItem("Customer contact", "Hidden - use request messages")}
          ${renderDispatchDetailItem("Created", request.createdAt)}
          ${renderDispatchDetailItem("Pickup", request.pickup, "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Pickup instructions", request.pickupInstructions || "None", "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Drop-off", request.dropoff, "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Drop-off instructions", request.dropoffInstructions || "None", "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Estimated mileage", request.distance)}
          ${renderDispatchDetailItem("Delivery method", formatDeliveryMethod(request.deliveryMethod))}
          ${renderDispatchDetailItem("Delivery proof", completionRule)}
          ${renderDispatchDetailItem("Additional stop", request.additionalStopAddress)}
          ${renderDispatchDetailItem("Additional stop details", request.additionalStopNotes)}
          ${renderDispatchDetailItem("Services selected", request.items, "dispatch-detail-wide")}
          ${renderDispatchMoneyItem("Service charge", request.serviceCharge || request.serviceFee)}
          ${renderDispatchMoneyItem("Add-on charges", request.addonCharges)}
          ${renderDispatchMoneyItem("Additional service area charge", request.serviceAreaCharge)}
          ${renderDispatchMoneyItem("Regular price before membership", request.regularSubtotal || request.serviceFee)}
          ${renderDispatchDetailItem("Membership", request.membershipName || "None")}
          ${renderDispatchMoneyItem("Membership savings", request.membershipSavings)}
          ${renderDispatchDetailItem("Discount code", request.discountCode || "None")}
          ${renderDispatchMoneyItem("Discount amount", request.discountAmount)}
          ${renderDispatchMoneyItem("Shopping estimate", request.shoppingEstimate)}
          ${renderDispatchDetailItem("Shopping likely range", request.shoppingEstimateLow || request.shoppingEstimateHigh ? `${money(request.shoppingEstimateLow)}-${money(request.shoppingEstimateHigh)}` : "Not available")}
          ${renderDispatchDetailItem("Shopping price review", Number(request.shoppingUnknownCount || 0) ? `${request.shoppingUnknownCount} item(s) need review` : "All listed items recognized or customer-priced")}
          ${renderDispatchMoneyItem("Shopping cushion", request.shoppingCushion)}
          ${renderDispatchMoneyItem("Shopping hold", request.shoppingHold)}
          ${renderDispatchMoneyItem("Tip", request.tip)}
          ${renderDispatchMoneyItem("Tax", request.tax)}
          ${renderDispatchMoneyItem("Customer checkout total", request.total)}
          ${renderDispatchDetailItem("Tax area", request.taxArea || "Burlington, IA / Des Moines County")}
          ${renderDispatchDetailItem("Shopping text list", shoppingList, "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Shopping store", request.shoppingRetailer || "Not specified")}
          ${renderDispatchDetailItem("Shopping photo uploads", shoppingPhotos, "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Customer notes", request.notes, "dispatch-detail-wide")}
          ${renderDispatchDetailItem("Assigned driver", request.assignedDriver || "Not assigned")}
          ${renderDispatchDetailItem("Approval decision", request.autoApprovalDecision || "Manual review")}
          ${renderDispatchDetailItem("Payment check", request.paymentValidation || "Not available")}
          ${renderDispatchDetailItem("Risk check", request.riskSummary || "Not available")}
          ${request.autoApprovalReason ? renderDispatchDetailItem("Approval reason", request.autoApprovalReason, "dispatch-detail-wide") : ""}
          ${request.adminReason ? renderDispatchDetailItem("Send-back reason", request.adminReason, "dispatch-detail-wide") : ""}
        </div>

        ${renderDispatchActions(request)}
        ${request.assignedDriver ? `<button class="secondary-admin-action" type="button" data-admin-shortcut="adminMessages">Open request messages</button>` : ""}
      </div>
    </details>
  `;
}

function renderCatalogLearningPanel() {
  if (!catalogLearningBoard || !catalogLearningSummary || !catalogLearningPendingCount) return;
  const data = catalogLearningData || { entries: [], pendingCount: 0, catalogProductCount: 0, catalogUpdatedAt: "", lastReviewedAt: "" };
  const pending = (data.entries || []).filter((entry) => entry.status === "pending");
  const recentlyResolved = (data.entries || []).filter((entry) => entry.status !== "pending").slice(0, 8);
  catalogLearningPendingCount.textContent = `${data.pendingCount || 0} Pending`;
  catalogLearningSummary.innerHTML = `
    <div class="alert-card">
      <p><strong>Catalog products:</strong> ${Number(data.catalogProductCount || 0)}</p>
      <p><strong>Catalog updated:</strong> ${escapeHtml(data.catalogUpdatedAt || "Not yet")}</p>
      <p><strong>Last completed-order review:</strong> ${escapeHtml(data.lastReviewedAt ? formatDateTime(data.lastReviewedAt) : "Not run yet")}</p>
    </div>
  `;
  catalogLearningBoard.innerHTML = pending.length
    ? pending.map((entry) => `
        <article class="alert-card">
          <div class="alert-top">
            <strong>${escapeHtml(entry.item)}</strong>
            <span class="pill">${Number(entry.occurrences || 1)} request${Number(entry.occurrences || 1) === 1 ? "" : "s"}</span>
          </div>
          <p><strong>Stores:</strong> ${escapeHtml((entry.storeNames || []).join(", ") || "Not specified")}</p>
          <p><strong>Last requested:</strong> ${escapeHtml(formatDateTime(entry.lastSeenAt))}</p>
          <p class="payment-note">Adding creates a searchable catalog entry. Price and stock will still require confirmation.</p>
          <div class="dispatch-actions">
            <button type="button" data-catalog-learning-action="add" data-catalog-learning-id="${escapeHtml(entry.id)}">Add to Catalog</button>
            <button type="button" data-catalog-learning-action="dismiss" data-catalog-learning-id="${escapeHtml(entry.id)}">Dismiss</button>
          </div>
        </article>
      `).join("")
    : `<div class="empty-state">No hand-typed products are waiting for review.</div>`;
  if (recentlyResolved.length) {
    catalogLearningBoard.insertAdjacentHTML("beforeend", `
      <div class="section-heading compact"><h3>Recently reviewed</h3><span>${recentlyResolved.length} shown</span></div>
      ${recentlyResolved.map((entry) => `
        <div class="alert-card">
          <div class="alert-top"><strong>${escapeHtml(entry.item)}</strong><span class="pill">${escapeHtml(String(entry.status || "reviewed").replace(/-/g, " "))}</span></div>
        </div>
      `).join("")}
    `);
  }
}

async function fetchCatalogLearning() {
  if (!catalogLearningBoard) return;
  try {
    const response = await fetch(apiUrl("/catalog-learning"), { cache: "no-store" });
    if (!response.ok) throw new Error("Catalog review unavailable");
    catalogLearningData = await response.json();
    renderCatalogLearningPanel();
  } catch {
    catalogLearningBoard.innerHTML = `<div class="empty-state">Catalog review is temporarily unavailable.</div>`;
  }
}

async function reviewCompletedOrderCatalogLearning() {
  if (!runCatalogLearningReview || !catalogLearningStatus) return;
  runCatalogLearningReview.disabled = true;
  catalogLearningStatus.textContent = "Reviewing completed orders for hand-typed products...";
  const completedRequests = requests.filter((request) => request.status === "Completed" && getCatalogLearningItemsFromRequest(request).length);
  const captured = await Promise.all(completedRequests.map(captureRequestCatalogLearning));
  try {
    await fetch(apiUrl("/catalog-learning/monthly-review"), { method: "POST" });
    await fetchCatalogLearning();
    catalogLearningStatus.textContent = `Review complete. Checked ${completedRequests.length} completed order${completedRequests.length === 1 ? "" : "s"} and found ${captured.reduce((sum, count) => sum + count, 0)} hand-typed item record${captured.reduce((sum, count) => sum + count, 0) === 1 ? "" : "s"}.`;
  } catch {
    catalogLearningStatus.textContent = "The completed-order review could not finish. Please try again.";
  } finally {
    runCatalogLearningReview.disabled = false;
  }
}

async function updateCatalogLearningEntry(id, action) {
  if (!catalogLearningStatus) return;
  catalogLearningStatus.textContent = action === "add" ? "Adding product to the catalog..." : "Dismissing review item...";
  try {
    const response = await fetch(apiUrl(`/catalog-learning/${encodeURIComponent(id)}/action`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Catalog update failed");
    await fetchCatalogLearning();
    catalogLearningStatus.textContent = action === "add" ? "Product added to customer search." : "Item dismissed from the review list.";
  } catch (error) {
    catalogLearningStatus.textContent = error.message || "Catalog update failed.";
  }
}

function toLocalDateTimeInput(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function renderAutoApprovalSettings() {
  const form = document.querySelector("#autoApprovalForm");
  if (!form || !autoApprovalEngine) return;
  if (autoApprovalSettings.away && Number(autoApprovalSettings.away.endMs) <= Date.now()) {
    autoApprovalSettings = { ...autoApprovalSettings, enabled: false, away: null };
    saveAutoApprovalSettings();
  }
  autoApprovalSettings = autoApprovalEngine.normalizeSettings(autoApprovalSettings);
  document.querySelector("#autoApprovalEnabled").checked = autoApprovalSettings.enabled;
  document.querySelector("#autoApprovalMaxAmount").value = autoApprovalSettings.maxAmount;
  document.querySelector("#autoApprovalTrustedPriority").checked = autoApprovalSettings.prioritizeTrustedCustomers;
  document.querySelector("#autoApprovalSchedule").innerHTML = autoApprovalSettings.schedule.map((entry) => `
    <div class="schedule-row">
      <label><input type="checkbox" data-auto-day-enabled="${escapeHtml(entry.day)}" ${entry.enabled ? "checked" : ""} /> ${escapeHtml(entry.day.slice(0, 3))}</label>
      <input type="time" data-auto-day-start="${escapeHtml(entry.day)}" value="${escapeHtml(entry.start)}" aria-label="${escapeHtml(entry.day)} start" />
      <span>to</span>
      <input type="time" data-auto-day-end="${escapeHtml(entry.day)}" value="${escapeHtml(entry.end)}" aria-label="${escapeHtml(entry.day)} end" />
    </div>`).join("");
  const activation = autoApprovalEngine.getActivation(autoApprovalSettings);
  const status = document.querySelector("#autoApprovalStatus");
  status.classList.toggle("active", activation.active);
  status.innerHTML = `<strong>${activation.active ? "Auto-approval active" : "Manual approval active"}</strong><span>${escapeHtml(activation.label)}</span>`;
  document.querySelector("#awayModeStatus").textContent = autoApprovalSettings.away
    ? `Away mode will end automatically ${new Date(autoApprovalSettings.away.endMs).toLocaleString()}.`
    : "No temporary Away timeframe is active.";
  document.querySelector("#autoApprovalLogCount").textContent = `${autoApprovalLog.length} ${autoApprovalLog.length === 1 ? "entry" : "entries"}`;
  document.querySelector("#autoApprovalLog").innerHTML = autoApprovalLog.length ? autoApprovalLog.map((entry) => `
    <article class="auto-approval-log-entry">
      <div><strong>${escapeHtml(entry.requestId)}</strong><span>${escapeHtml(entry.customer || "Customer")}</span></div>
      <div><span class="pill">${escapeHtml(entry.decision)}</span><small>${escapeHtml(formatDateTime(entry.timestamp))}</small></div>
      <div><strong>${escapeHtml(entry.reason)}</strong><small>Payment: ${escapeHtml(entry.payment)} · Risk: ${escapeHtml(entry.risk)}</small></div>
    </article>`).join("") : `<div class="empty-state">No automatic approval decisions have been recorded yet.</div>`;
}

function readAutoApprovalForm() {
  autoApprovalSettings = {
    ...autoApprovalSettings,
    enabled: Boolean(document.querySelector("#autoApprovalEnabled")?.checked),
    maxAmount: Number(document.querySelector("#autoApprovalMaxAmount")?.value || 75),
    requireValidPayment: true,
    prioritizeTrustedCustomers: Boolean(document.querySelector("#autoApprovalTrustedPriority")?.checked),
    schedule: autoApprovalEngine.DAYS.map((day) => ({
      day,
      enabled: Boolean(document.querySelector(`[data-auto-day-enabled="${day}"]`)?.checked),
      start: document.querySelector(`[data-auto-day-start="${day}"]`)?.value || "09:00",
      end: document.querySelector(`[data-auto-day-end="${day}"]`)?.value || "17:00",
    })),
  };
}

function activateAwayMode(start, end) {
  if (!(start instanceof Date) || !(end instanceof Date) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    document.querySelector("#autoApprovalSaveStatus").textContent = "Choose an end time after the start time.";
    return;
  }
  readAutoApprovalForm();
  autoApprovalSettings.enabled = true;
  autoApprovalSettings.away = { startMs: start.getTime(), endMs: end.getTime() };
  saveAutoApprovalSettings();
  renderAutoApprovalSettings();
}

function renderAdminBoards() {
  renderAutoApprovalSettings();
  const adminMetrics = document.querySelector("#adminMetrics");
  if (adminMetrics) {
    const metricPages = {
      Drivers: "adminDrivers",
      Customers: "adminCustomers",
      "Active Requests": "adminDispatch",
      "Completed Requests": "adminDispatch",
      "Mileage Records": "adminDrivers",
      "Payroll Records": "adminPay",
      Messages: "adminMessages",
    };
    adminMetrics.innerHTML = getDashboardStats()
      .map(
        ([label, count]) => `
          <button class="admin-metric-card" type="button" data-admin-shortcut="${metricPages[label] || "adminOverview"}"${label === "Completed Requests" ? ' data-dispatch-filter="completed"' : ""}>
            <span>${label}</span>
            <strong>${count}</strong>
            <small>${formatRecordCount(count)}</small>
          </button>
        `
      )
      .join("");
  }

  const dispatchBoard = document.querySelector("#dispatchBoard");
  const dispatchFilter = getDispatchFilterInfo();
  const visibleRequests = requests.filter(dispatchFilter.match);
  dispatchBoard.innerHTML = `
    <div class="dispatch-toolbar">
      <div>
        <strong>${dispatchFilter.label}</strong>
        <span>${dispatchFilter.description}</span>
      </div>
      <div class="dispatch-filter-actions">
        ${["all", "review", "ready", "completed"]
          .map((filter) => {
            const info = getDispatchFilterInfo(filter);
            return `<button type="button" class="${adminDispatchFilter === filter ? "active" : ""}" data-dispatch-filter="${filter}">${info.label}</button>`;
          })
          .join("")}
      </div>
    </div>
    ${
      visibleRequests.length
        ? visibleRequests.map(renderDispatchRequestCard).join("")
        : `<div class="empty-state">No requests are in this section right now.</div>`
    }
  `;

  document.querySelector("#discountBoard").innerHTML = discounts
    .map(
      (discount) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${discount.code}</strong>
            <span class="pill">${discount.status}</span>
          </div>
          <p>${discount.label} - ${formatDiscountValue(discount)}</p>
          <div class="dispatch-actions">
            <button type="button" data-toggle-discount="${discount.code}">
              ${discount.status === "Active" ? "Deactivate" : "Activate"}
            </button>
            <button type="button" data-delete-discount="${discount.code}">Delete</button>
          </div>
        </div>
      `
    )
    .join("") || `<div class="empty-state">No discount codes saved yet.</div>`;

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
    .join("") || `<div class="empty-state">No driver mileage records yet.</div>`;

  const totalMiles = driverTracking.reduce((sum, driver) => sum + driver.routeMiles, 0);
  document.querySelector("#mileageSummary").innerHTML = `
    <div class="integration-list">
      <div><strong>${totalMiles} miles logged</strong><span>Admin-visible total for current driver jobs.</span></div>
      <div><strong>Tax records</strong><span>Track driver, job ID, date, mileage, and pay details for Xero/accountant review.</span></div>
      <div><strong>Hire consent</strong><span>Driver GPS tracking consent is collected during hiring and onboarding.</span></div>
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
    .join("") || `<div class="empty-state">No completed driver pay records yet.</div>`;

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
    .join("") || `<div class="empty-state">No driver tip requests submitted yet.</div>`;

  document.querySelector("#payrollBoard").innerHTML = systemLinks
    .map(
      (system) => `
        <a class="alert-card system-link-card" href="${system.url}" target="_blank" rel="noreferrer">
          <div class="alert-top">
            <strong>${system.name}</strong>
            <span class="pill">Open</span>
          </div>
          <p>${system.use}</p>
        </a>
      `
    )
    .join("");

  document.querySelector("#communicationBoard").innerHTML = integrationSetupItems
    .map(
      ([title, text]) => `
        <div class="alert-card">
          <div class="alert-top">
            <strong>${title}</strong>
            <span class="pill">Setup</span>
          </div>
          <p>${text}</p>
        </div>
      `
    )
    .join("");
  renderExportCenter();
  renderArchiveLog();
  renderAdminCustomers();
  renderAdminMessages();
}

function setActiveView(viewId) {
  if (viewId !== "login" && !canAccessView(viewId)) {
    viewId = "login";
  }

  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === viewId));
  document.body.dataset.activeView = viewId;
  document
    .querySelectorAll("[data-view-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.viewLink === viewId));
  window.location.hash = viewId;
  renderRoleNavigation();
  if (viewId === "storefront" && !document.body.dataset.customerMode) {
    setCustomerMode("home");
  }
}

function canAccessView(viewId) {
  if (adminPreviewFrameMode && viewId === "storefront") return true;
  if (viewId === "storefront") return ["customer", "admin", "owner"].includes(currentRole);
  if (viewId === "employee") return currentRole === "driver" || currentRole === "owner";
  if (viewId === "admin") return currentRole === "admin" || currentRole === "owner";
  if (viewId === "restaurant") return ["restaurant", "admin", "owner"].includes(currentRole) && Boolean(restaurantAuthToken);
  return true;
}

function setRole(role) {
  currentRole = role;
  if (customerTestingMode && role === "customer") {
    sessionStorage.setItem("hopesGoCurrentRole", role);
    localStorage.removeItem("hopesGoCurrentRole");
  } else {
    localStorage.setItem("hopesGoCurrentRole", role);
    sessionStorage.removeItem("hopesGoCurrentRole");
  }
  renderRoleNavigation();
  if (latestOperationsStatus) renderOperationsStatus(latestOperationsStatus);
}

function renderRoleNavigation() {
  roleNavItems.forEach((item) => {
    item.classList.toggle("visible", item.dataset.roleNav === currentRole);
  });
  const hasAdminSiteAccess = !adminPreviewFrameMode && ["admin", "owner"].includes(currentRole) && document.body.dataset.activeView !== "login";
  ownerSiteSwitcher?.classList.toggle("active", hasAdminSiteAccess);
  ownerSiteSwitcher?.setAttribute("aria-hidden", String(!hasAdminSiteAccess));
  const driverSiteButton = ownerMenuPanel?.querySelector('[data-owner-view="employee"]');
  if (driverSiteButton) driverSiteButton.hidden = currentRole === "admin";
}

function setAdminPreviewSize(size) {
  const nextSize = size === "mobile" ? "mobile" : "website";
  adminPreviewStage?.setAttribute("data-preview-size", nextSize);
  adminPreviewSizeButtons.forEach((button) => button.classList.toggle("active", button.dataset.previewSize === nextSize));
  if (adminPreviewHelp) {
    adminPreviewHelp.textContent = nextSize === "mobile"
      ? "Mobile view is shown at 390 pixels wide, similar to a modern phone. Scroll inside the phone to review the full site."
      : "Website view uses the available laptop width.";
  }
}

function openAdminPreview() {
  if (!adminPreviewModal || !adminPreviewFrame) return;
  if (!adminPreviewFrame.src) {
    const previewUrl = new URL(window.location.href);
    previewUrl.search = "?admin-preview=1";
    previewUrl.hash = "storefront";
    adminPreviewFrame.src = previewUrl.toString();
  }
  setAdminPreviewSize("website");
  adminPreviewModal.hidden = false;
  document.body.classList.add("admin-preview-open");
  adminPreviewClose?.focus();
}

function closeAdminPreview() {
  if (!adminPreviewModal) return;
  adminPreviewModal.hidden = true;
  document.body.classList.remove("admin-preview-open");
  adminPreviewOpen?.focus();
}

function logoutToLogin() {
  currentEmployee = "";
  currentRole = "";
  localStorage.removeItem("hopesGoCurrentEmployee");
  localStorage.removeItem("hopesGoCurrentRole");
  localStorage.removeItem("hopesGoAdminName");
  sessionStorage.removeItem("hopesGoCurrentRole");
  sessionStorage.removeItem("hopesGoRestaurantToken");
  sessionStorage.removeItem("hopesGoRestaurantAdminToken");
  restaurantAuthToken = "";
  restaurantAdminToken = "";
  ownerMenuPanel?.classList.remove("active");
  customerMenuPanel?.classList.remove("active");
  driverMenuPanel?.classList.remove("active");
  adminMenuPanel?.classList.remove("active");
  ownerMenuToggle?.setAttribute("aria-expanded", "false");
  customerMenuToggle?.setAttribute("aria-expanded", "false");
  driverMenuToggle?.setAttribute("aria-expanded", "false");
  adminMenuToggle?.setAttribute("aria-expanded", "false");
  customerMenuPanel?.setAttribute("aria-hidden", "true");
  driverMenuPanel?.setAttribute("aria-hidden", "true");
  adminMenuPanel?.setAttribute("aria-hidden", "true");
  renderEmployeeViews();
  renderRoleNavigation();
  setActiveView("login");
}

function getSavedLandingView() {
  if (currentRole === "owner") return localStorage.getItem("hopesGoLastOwnerView") || "admin";
  if (currentRole === "admin") return "admin";
  if (currentRole === "driver") return "employee";
  if (currentRole === "customer") return "storefront";
  if (currentRole === "restaurant") return "restaurant";
  return "login";
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
  updateDriverPageTitle(pageId);
  if (driverMenuPanel) {
    driverMenuPanel.classList.remove("active");
    driverMenuPanel.setAttribute("aria-hidden", "true");
  }
  if (driverMenuToggle) {
    driverMenuToggle.setAttribute("aria-expanded", "false");
  }
}

const driverPageTitles = {
  driverHome: "Requests Waiting on Care",
  driverSchedule: "Schedule",
  driverCurrentJob: "Current Job",
  driverPastJobs: "Past Jobs",
  driverPay: "Pay",
  driverMessages: "Messages",
  driverAvailability: "Availability",
  driverDocuments: "Documents",
  driverProfile: "Profile",
};

function updateDriverPageTitle(pageId) {
  const page = document.getElementById(pageId);
  const title = page?.querySelector(".section-heading h2");
  const menuLink = document.querySelector(`[data-driver-page-link="${pageId}"]`);
  const fallbackTitle = menuLink?.textContent?.trim();
  const nextTitle = pageId === "driverHome" && !isCurrentDriverClockedIn()
    ? "Clock in to view requests"
    : driverPageTitles[pageId] || fallbackTitle;
  if (employeeTitle && nextTitle) {
    employeeTitle.textContent = nextTitle;
  }
  if (title && nextTitle) {
    title.textContent = nextTitle;
  }
}

function setCustomerPage(pageId) {
  currentCustomerPage = pageId;
  if (pageId !== "customerCheckout") {
    resetTestCheckoutState();
  }
  if (storeShell) {
    storeShell.dataset.customerPage = pageId;
  }
  const pageInfo = customerPageInfo[pageId] || customerPageInfo.customerServices;
  if (customerStepEyebrow) customerStepEyebrow.textContent = pageInfo.step || "";
  if (customerStepTitle) customerStepTitle.textContent = pageInfo.title || "";
  customerNextButtons.forEach((button) => {
    const serviceAreaRequirement = getDeliveryServiceAreaRequirement();
    const forcedServiceAreaChoice = pageId === "customerAreas" && serviceAreaReturnPage && serviceAreaRequirement.required;
    button.textContent =
      forcedServiceAreaChoice && serviceAreaRequirement.tier && getSelectedServiceAreaId() !== serviceAreaRequirement.tier.serviceId
        ? `Select Service Area Tier ${serviceAreaRequirement.tier.tier}`
        : forcedServiceAreaChoice && serviceAreaRequirement.customQuote
        ? "Custom quote required"
        : forcedServiceAreaChoice
        ? "Continue back to drop-off info"
        : pageId === "customerAreas" && hasServiceArea()
        ? "Continue with Additional Service Area"
        : pageId === "customerAreas"
        ? "No Additional Fee Needed"
        : pageInfo.next || "Continue";
    if (pageId === "pickupInfo" && !selectedRestaurantOrder && !customPickupDetailsCollected) {
      button.textContent = "Continue to delivery options";
    }
    button.disabled = false;
  });
  customerBackButtons.forEach((button) => {
    button.classList.toggle("hidden-field", pageId === "customerServices");
  });
  document
    .querySelectorAll("[data-customer-page-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.customerPageLink === pageId));
  renderServices();
  renderCart();
  renderTipChoice();
  updateCustomerHelpButton();
}

function setAdminPage(pageId) {
  document.querySelectorAll(".admin-page").forEach((page) => page.classList.toggle("active", page.id === pageId));
  document
    .querySelectorAll("[data-admin-page-link]")
    .forEach((link) => link.classList.toggle("active", link.dataset.adminPageLink === pageId));
  if (pageId === "adminSchedule") fetchOperationsStatus({ quiet: true });
  if (pageId === "adminCatalog") fetchCatalogLearning();
}

document.addEventListener("click", (event) => {
  const adminPreviewButton = event.target.closest("[data-admin-preview-open]");
  if (adminPreviewButton) {
    openAdminPreview();
    return;
  }

  const catalogLearningAction = event.target.closest("[data-catalog-learning-action]");
  if (catalogLearningAction) {
    void updateCatalogLearningEntry(
      catalogLearningAction.dataset.catalogLearningId,
      catalogLearningAction.dataset.catalogLearningAction
    );
    return;
  }

  const shoppingSuggestionButton = event.target.closest("[data-shopping-product-suggestion-id]");
  if (shoppingSuggestionButton) {
    const product = latestShoppingProductSuggestions.find(
      (item) => item.id === shoppingSuggestionButton.dataset.shoppingProductSuggestionId
    );
    if (product) addSelectedShoppingProduct(product);
    return;
  }

  const shoppingProductActionButton = event.target.closest("[data-shopping-product-action]");
  if (shoppingProductActionButton) {
    updateSelectedShoppingProduct(
      shoppingProductActionButton.dataset.shoppingProductId,
      shoppingProductActionButton.dataset.shoppingProductAction
    );
    return;
  }

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

  const tipChoiceButton = event.target.closest("[data-tip-choice]");
  if (tipChoiceButton) {
    tipChoiceMode = tipChoiceButton.dataset.tipChoice;
    if (tipChoiceMode === "skip") {
      tipInput.dataset.amount = "0";
      tipInput.value = money(0);
      tipStepSeen = true;
      checkoutStatus.textContent = "";
      renderCart();
      setCustomerPage("customerInfo");
      return;
    }
    renderTipChoice();
    setCustomerPage("customerTip");
    tipInput.focus();
  }

  const applyTipAction = event.target.closest("#applyTipButton");
  if (applyTipAction) {
    if (tipInput.value === "") {
      checkoutStatus.textContent = "Enter a tip amount, or choose Continue Without a Tip.";
      tipInput.focus();
      return;
    }
    formatTipAmountInput();
    tipStepSeen = true;
    checkoutStatus.textContent = "";
    renderCart();
    setCustomerPage("customerInfo");
  }

  const viewLink = event.target.closest("[data-view-link]");
  if (viewLink) {
    setActiveView(viewLink.dataset.viewLink);
  }

  const ownerViewButton = event.target.closest("[data-owner-view]");
  if (ownerViewButton) {
    localStorage.setItem("hopesGoLastOwnerView", ownerViewButton.dataset.ownerView);
    setActiveView(ownerViewButton.dataset.ownerView);
    ownerMenuPanel?.classList.remove("active");
    ownerMenuToggle?.setAttribute("aria-expanded", "false");
  }

  const ownerOperationsButton = event.target.closest("[data-owner-operations-status]");
  if (ownerOperationsButton) {
    updateOwnerOperationsStatus(ownerOperationsButton.dataset.ownerOperationsStatus);
  }

  const driverClockButton = event.target.closest("[data-driver-clock-status]");
  if (driverClockButton) {
    updateDriverClockStatus(driverClockButton.dataset.driverClockStatus);
  }

  const driverPageLink = event.target.closest("[data-driver-page-link]");
  if (driverPageLink) {
    setDriverPage(driverPageLink.dataset.driverPageLink);
  }

  const quickMessageButton = event.target.closest("[data-quick-message]");
  if (quickMessageButton) {
    addRequestMessage(
      quickMessageButton.dataset.requestId,
      "driver",
      quickMessageButton.dataset.quickMessage,
      quickMessageButton.dataset.messageChannel || MESSAGE_CHANNEL_CUSTOMER_DRIVER,
    );
  }

  const updateAvailabilityAction = event.target.closest("#updateAvailabilityButton");
  if (updateAvailabilityAction) {
    setDriverPage("driverSchedule");
    availabilityBuilder?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const customerNextButton = event.target.closest("[data-customer-next]");
  if (customerNextButton) {
    handleCustomerNext();
  }

  const customerBackButton = event.target.closest("[data-customer-back]");
  if (customerBackButton) {
    handleCustomerBack();
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
    adminMenuPanel?.classList.remove("active");
    adminMenuPanel?.setAttribute("aria-hidden", "true");
    adminMenuToggle?.setAttribute("aria-expanded", "false");
    if (adminPageLink.dataset.adminPageLink === "adminDaily") {
      renderDailyUpdate();
    }
  }

  const adminShortcut = event.target.closest("[data-admin-shortcut]");
  if (adminShortcut) {
    if (adminShortcut.dataset.dispatchFilter) {
      adminDispatchFilter = adminShortcut.dataset.dispatchFilter;
      renderAdminBoards();
    }
    setAdminPage(adminShortcut.dataset.adminShortcut);
    if (adminShortcut.dataset.adminShortcut === "adminDaily") {
      renderDailyUpdate();
    }
  }

  const dispatchFilterButton = event.target.closest("[data-dispatch-filter]");
  if (dispatchFilterButton && !dispatchFilterButton.dataset.adminShortcut) {
    adminDispatchFilter = dispatchFilterButton.dataset.dispatchFilter;
    renderAdminBoards();
  }

  const awayPreset = event.target.closest("[data-away-preset]");
  if (awayPreset) {
    const start = new Date();
    activateAwayMode(start, new Date(start.getTime() + Number(awayPreset.dataset.awayPreset) * 60000));
  }
  const awayUntil = event.target.closest("[data-away-until]");
  if (awayUntil) {
    const endInput = document.querySelector("#awayEnd");
    if (!endInput?.value) {
      if (endInput) { endInput.value = toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000)); endInput.focus(); }
    } else activateAwayMode(new Date(), new Date(endInput.value));
  }
  const awayCustom = event.target.closest("[data-away-custom]");
  if (awayCustom) {
    const startInput = document.querySelector("#awayStart");
    const endInput = document.querySelector("#awayEnd");
    if (!startInput?.value || !endInput?.value) {
      if (startInput && !startInput.value) startInput.value = toLocalDateTimeInput(new Date());
      if (endInput && !endInput.value) endInput.value = toLocalDateTimeInput(new Date(Date.now() + 2 * 60 * 60 * 1000));
      startInput?.focus();
    } else activateAwayMode(new Date(startInput.value), new Date(endInput.value));
  }
  if (event.target.closest("#cancelAwayMode")) {
    autoApprovalSettings.away = null;
    saveAutoApprovalSettings();
    renderAutoApprovalSettings();
  }

  const reportButton = event.target.closest("[data-download-report]");
  if (reportButton) {
    downloadDailyReport(reportButton.dataset.downloadReport, reportButton.dataset.exportFormat || "csv");
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

  const deleteDiscountButton = event.target.closest("[data-delete-discount]");
  if (deleteDiscountButton) {
    discounts = discounts.filter((discount) => discount.code !== deleteDiscountButton.dataset.deleteDiscount);
    saveDiscounts();
    renderAdminBoards();
    renderCart();
  }

  const approveRequestButton = event.target.closest("[data-approve-request]");
  if (approveRequestButton) {
    requests = requests.map((request) =>
      request.id === approveRequestButton.dataset.approveRequest
        ? { ...request, status: "Approved for drivers", adminReason: "" }
        : request
    );
    saveRequests();
    renderAdminBoards();
    renderEmployeeViews();
  }

  const denyRequestButton = event.target.closest("[data-deny-request]");
  if (denyRequestButton) {
    const id = denyRequestButton.dataset.denyRequest;
    const reason = document.querySelector(`[data-deny-reason="${id}"]`)?.value.trim() || "Please review and update your request.";
    requests = requests.map((request) =>
      request.id === id
        ? { ...request, status: "Needs customer fix", adminReason: reason, assignedDriver: "" }
        : request
    );
    saveRequests();
    renderAdminBoards();
    renderEmployeeViews();
  }

  const membershipPlanButton = event.target.closest("[data-membership-plan]");
  if (membershipPlanButton) {
    const plan = membershipPlans.find((item) => item.name === membershipPlanButton.dataset.membershipPlan);
    if (plan) {
      startMembershipCheckout(plan.id);
    }
  }

  const customerMenuAction = event.target.closest("[data-customer-menu-action]");
  if (customerMenuAction) {
    const action = customerMenuAction.dataset.customerMenuAction;
    customerMenuPanel?.classList.remove("active");
    customerMenuToggle?.setAttribute("aria-expanded", "false");
    if (action === "home") {
      saveCurrentRequestDraft();
      setCustomerMode("home");
    }
    if (action === "profile") {
      setCustomerMode("account");
    }
    if (action === "profile-edit") {
      customerInfoEditMode = true;
      setCustomerMode("request");
      setCustomerPage("customerInfo");
      renderProfile();
    }
    if (action === "orders") {
      setCustomerMode("orders");
    }
    if (action === "payments") {
      setCustomerMode("payments");
    }
    if (action === "memberships") {
      setCustomerMode("memberships");
    }
    if (action === "membership-dashboard") {
      setCustomerMode("memberships");
    }
  }

  const editCustomerInfoButton = event.target.closest("[data-edit-customer-info]");
  if (editCustomerInfoButton) {
    customerInfoEditMode = true;
    renderProfile();
    return;
  }

  const accountActionButton = event.target.closest("[data-account-action]");
  if (accountActionButton) {
    const accountStatus = document.querySelector("#customerAccountStatus");
    const paymentsStatus = document.querySelector("#customerPaymentsStatus");
    if (accountActionButton.dataset.accountAction === "payment-portal" && paymentsStatus) {
      paymentsStatus.textContent = "Stripe customer portal connection is ready to add when your live Stripe portal is enabled.";
    } else if (accountStatus) {
      accountStatus.textContent =
        accountActionButton.dataset.accountAction === "change-password"
          ? "Password changes are ready to connect to text verification."
          : "Phone and email verification is ready to connect to text verification.";
    }
  }

  const cancelMembershipButton = event.target.closest("[data-cancel-membership]");
  if (cancelMembershipButton) {
    if (currentMembership) {
      currentMembership = { ...currentMembership, active: false, cancelledAt: new Date().toISOString() };
      const storage = customerTestingMode ? sessionStorage : localStorage;
      storage.setItem("hopesGoMembership", JSON.stringify(currentMembership));
    }
    renderCart();
    renderCustomerMenuStatus();
    renderMembershipDashboard();
    if (membershipStatus) {
      membershipStatus.textContent = "Membership canceled for this account. Benefits no longer apply.";
    }
  }

  const acceptButton = event.target.closest("[data-accept-job]");
  if (acceptButton) {
    if (!isCurrentDriverClockedIn()) {
      setDriverPage("driverHome");
      renderDriverStatusSummary();
      renderDriverOfferQueue();
      return;
    }
    if (acceptedDriverJob) {
      setDriverPage("driverCurrentJob");
      return;
    }
    acceptedDriverJob = requests.find(
      (request) =>
        request.id === acceptButton.dataset.acceptJob &&
        request.status === "Approved for drivers" &&
        (!request.assignedDriver || request.assignedDriver.toLowerCase() === currentEmployee.toLowerCase())
    );
    if (!acceptedDriverJob) {
      renderDriverOfferQueue();
      return;
    }
    acceptedDriverJob.assignedDriver = currentEmployee;
    acceptedDriverJob.status = "Accepted by driver";
    requests = requests.map((request) =>
      request.id === acceptedDriverJob.id ? { ...acceptedDriverJob } : request
    );
    saveRequests();
    renderDriverDashboard();
    renderEmployeeViews();
    setDriverPage("driverCurrentJob");
    document.querySelector("#driverDashboard").scrollIntoView({ behavior: "smooth", block: "start" });
  }

});

document.addEventListener("submit", (event) => {
  const messageForm = event.target.closest("[data-message-form]");
  if (!messageForm) return;
  event.preventDefault();
  const requestId = messageForm.dataset.messageForm;
  const sender = messageForm.dataset.messageSender;
  const channel = messageForm.dataset.messageChannel || MESSAGE_CHANNEL_CUSTOMER_DRIVER;
  const input = messageForm.querySelector("[data-message-input]");
  if (addRequestMessage(requestId, sender, input?.value || "", channel)) {
    input.value = "";
  }
});

function handleCustomerNext() {
  const index = customerPages.indexOf(currentCustomerPage);
  if (currentCustomerPage === "customerServices" && !hasMainService()) {
    setCustomerStatus("Choose one main service first.");
    return;
  }
  if (currentCustomerPage === "customerAreas") {
    const serviceAreaRequirement = getDeliveryServiceAreaRequirement();
    if (serviceAreaReturnPage && serviceAreaRequirement.required) {
      const selectedServiceAreaId = getSelectedServiceAreaId();
      if (serviceAreaRequirement.customQuote || selectedServiceAreaId !== serviceAreaRequirement.tier.serviceId) {
        setCustomerStatus(getServiceAreaRequirementMessage(serviceAreaRequirement));
        return;
      }
      const returnPage = serviceAreaReturnPage;
      serviceAreaReturnPage = "";
      setCustomerStatus("");
      setCustomerPage(returnPage);
      return;
    }
    if (!hasServiceArea()) {
      serviceAreaNoFeeSelected = true;
      [...cart.values()]
        .filter((item) => item.service.category === "Service Areas")
        .forEach((item) => cart.delete(item.service.id));
      renderCart();
      renderServices();
    }
    setCustomerPage("customerTip");
    return;
  }
  if (currentCustomerPage === "customerTip") {
    if (tipInput.value === "") {
      setCustomerStatus("Choose Enter Tip Amount or Continue Without a Tip.");
      return;
    }
    formatTipAmountInput();
    tipStepSeen = true;
    setCustomerStatus("");
    setCustomerPage("customerInfo");
    return;
  }
  if (currentCustomerPage === "customerInfo") {
    setCustomerStatus("");
    setCustomerPage("serviceInfo");
    return;
  }
  if (currentCustomerPage === "serviceInfo") {
    setCustomerStatus("");
    setCustomerPage(selectedRestaurantOrder || customPickupDetailsCollected ? "dropoffInfo" : "pickupInfo");
    return;
  }
  if (currentCustomerPage === "pickupInfo") {
    if (!profileFields.pickupAddress.value.trim()) {
      setCustomerStatus("Enter the pickup location for this request.");
      profileFields.pickupAddress.focus();
      return;
    }
    setCustomerStatus("");
    if (!selectedRestaurantOrder && !customPickupDetailsCollected) {
      customPickupDetailsCollected = true;
      setCustomerPage("customerAddons");
    } else {
      setCustomerPage("dropoffInfo");
    }
    return;
  }
  if (currentCustomerPage === "dropoffInfo") {
    profileForm.requestSubmit();
    return;
  }
  if (currentCustomerPage === "customerCheckout") {
    startStripeCheckout();
    return;
  }
  setCustomerPage(customerPages[Math.min(index + 1, customerPages.length - 1)]);
}

function handleCustomerBack() {
  const index = customerPages.indexOf(currentCustomerPage);
  if (index > 0) {
    setCustomerPage(customerPages[index - 1]);
  }
}

completionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const error = validateCompletion();
  if (error) {
    completionStatus.textContent = error;
    return;
  }

  completeAcceptedJob();
  completionStatus.textContent = "Completion proof saved for admin review.";
  acceptedDriverJob = null;
  completionForm.reset();
  renderDriverDashboard();
  renderEmployeeViews();
  renderAdminBoards();
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

employeeLogout.addEventListener("click", logoutToLogin);

customerLogout?.addEventListener("click", logoutToLogin);

adminLogout?.addEventListener("click", logoutToLogin);

globalLogout?.addEventListener("click", logoutToLogin);

ownerMenuToggle?.addEventListener("click", () => {
  const isOpen = !ownerMenuPanel.classList.contains("active");
  ownerMenuPanel.classList.toggle("active", isOpen);
  ownerMenuToggle.setAttribute("aria-expanded", String(isOpen));
});
adminPreviewOpen?.addEventListener("click", openAdminPreview);
adminPreviewClose?.addEventListener("click", closeAdminPreview);
adminPreviewModal?.addEventListener("click", (event) => {
  if (event.target === adminPreviewModal) closeAdminPreview();
});
adminPreviewSizeButtons.forEach((button) => {
  button.addEventListener("click", () => setAdminPreviewSize(button.dataset.previewSize));
});

customerMenuToggle?.addEventListener("click", () => {
  const isOpen = !customerMenuPanel.classList.contains("active");
  customerMenuPanel.classList.toggle("active", isOpen);
  customerMenuPanel.setAttribute("aria-hidden", String(!isOpen));
  customerMenuToggle.setAttribute("aria-expanded", String(isOpen));
});

startRequestButton?.addEventListener("click", async () => {
  startRequestButton.disabled = true;
  startRequestButton.textContent = "Checking drivers...";
  const available = await ensureDriverAvailable();
  startRequestButton.disabled = false;
  startRequestButton.textContent = "Start a request";
  if (available) setCustomerMode("restaurants");
});

resumeCartButton?.addEventListener("click", async () => {
  if (currentCustomerMode === "request") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (await ensureDriverAvailable()) resumeSavedRequest();
});

availabilityGateClose?.addEventListener("click", closeAvailabilityGate);
availabilityGateModal?.addEventListener("click", (event) => {
  if (event.target === availabilityGateModal) closeAvailabilityGate();
});
shoppingPriceModalClose?.addEventListener("click", closeShoppingPriceModal);
shoppingPriceModalDone?.addEventListener("click", closeShoppingPriceModal);
shoppingPriceModal?.addEventListener("click", (event) => {
  if (event.target === shoppingPriceModal) closeShoppingPriceModal();
});
customerPageHelpButton?.addEventListener("click", openCustomerHelp);
customerHelpClose?.addEventListener("click", closeCustomerHelp);
customerHelpDone?.addEventListener("click", closeCustomerHelp);
customerHelpModal?.addEventListener("click", (event) => {
  if (event.target === customerHelpModal) closeCustomerHelp();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && shoppingPriceModal && !shoppingPriceModal.hidden) closeShoppingPriceModal();
  if (event.key === "Escape" && adminPreviewModal && !adminPreviewModal.hidden) closeAdminPreview();
  if (event.key === "Escape" && customerHelpModal && !customerHelpModal.hidden) closeCustomerHelp();
});

openMembershipsButton?.addEventListener("click", () => {
  setCustomerMode("memberships");
});

closeMembershipsButton?.addEventListener("click", () => {
  setCustomerMode("request");
});

staffLoginToggle.addEventListener("click", () => {
  const isOpen = !staffLoginPanel.classList.contains("active");
  loginHero.classList.toggle("staff-mode", isOpen);
  staffLoginPanel.classList.toggle("active", isOpen);
  staffLoginPanel.setAttribute("aria-hidden", String(!isOpen));
  staffLoginToggle.textContent = isOpen ? "Customer Login" : "Driver/Admin Login";
  driverRoleLoginStatus.textContent = "";
});

customerLoginModeToggle.addEventListener("click", () => {
  setCustomerLoginMode(customerLoginMode === "signup" ? "login" : "signup");
});

customerLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  customerLoginStatus.textContent = "";

  if (customerLoginMode === "login") {
    const lookup = customerLoginLookup.value.trim();
    const password = customerLoginContact.value;
    const account = customerAccounts.find(
      (item) => loginMatchesAccount(item, lookup) && item.password === password
    );

    if (!account) {
      customerLoginStatus.textContent = "We could not find that customer login.";
      return;
    }

    saveProfile({
      name: account.name,
      phone: account.phone,
      email: account.email,
      deliveryAddress: account.deliveryAddress || "",
      notes: account.notes || "",
    });
    if (saveCustomerLogin?.checked && !customerTestingMode) {
      localStorage.setItem("hopesGoSavedCustomerLogin", account.email || account.phone);
    }
    setRole("customer");
    setCustomerPage("customerServices");
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
      deliveryAddress: "",
      notes: "",
    });
    pendingCustomerVerification = null;
    setRole("customer");
    setCustomerPage("customerServices");
    setActiveView("storefront");
    return;
  }

  const password = customerLoginContact.value;
  const confirmPassword = customerLoginPasswordConfirm.value;
  if (!customerTestingMode && !isStrongPassword(password)) {
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
    (item) => item.email.toLowerCase() === account.email.toLowerCase() || normalizePhone(item.phone) === normalizePhone(account.phone)
  );

  if (accountExists) {
    customerLoginStatus.textContent = "That phone or email already has an account. Use Log in instead.";
    return;
  }

  if (customerTestingMode) {
    customerAccounts.push(account);
    saveCustomerAccounts();
    saveProfile({
      name: account.name,
      phone: account.phone,
      email: account.email,
      deliveryAddress: "",
      notes: "",
    });
    customerLoginStatus.textContent = "Testing mode: account created without sending a real verification text.";
    setRole("customer");
    setCustomerPage("customerServices");
    setActiveView("storefront");
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

restaurantLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  restaurantLoginStatus.textContent = "Opening restaurant dashboard…";
  try {
    const response = await fetch(apiUrl("/api/restaurant/login"), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: restaurantLoginName.value.trim(), password: restaurantLoginPassword.value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Restaurant login failed.");
    restaurantAuthToken = data.token;
    restaurantEditorData = data.restaurant;
    sessionStorage.setItem("hopesGoRestaurantToken", restaurantAuthToken);
    setRole("restaurant");
    renderRestaurantEditor();
    loadRestaurantOrders();
    restaurantLoginStatus.textContent = "";
    setActiveView("restaurant");
  } catch (error) { restaurantLoginStatus.textContent = error.message; }
});

restaurantEditorForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  restaurantEditorStatus.textContent = "Saving and publishing…";
  try {
    await captureRestaurantEditor();
    const response = await fetch(apiUrl("/api/restaurant/me"), { method: "PUT", headers: restaurantAuthHeaders(), body: JSON.stringify(restaurantEditorData) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Changes could not be saved.");
    restaurantEditorData = data.restaurant;
    renderRestaurantEditor();
    loadRestaurantOrders();
    restaurantEditorStatus.textContent = "Saved and published to the customer website.";
  } catch (error) { restaurantEditorStatus.textContent = error.message; }
});

document.querySelector("#addRestaurantMenuItem")?.addEventListener("click", async () => {
  if (!restaurantEditorData) return;
  try { await captureRestaurantEditor(); } catch {}
  restaurantEditorData.menu.push(blankRestaurantMenuItem());
  renderRestaurantEditor();
});
document.querySelector("#addRestaurantDeal")?.addEventListener("click", async () => {
  if (!restaurantEditorData) return;
  try { await captureRestaurantEditor(); } catch {}
  restaurantEditorData.weeklyDeals.push({ id: `deal-${Date.now()}`, title: "", description: "", active: true });
  renderRestaurantEditor();
});
restaurantMenuEditor?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-menu-item]"); if (!button) return;
  const id = button.closest("[data-menu-item]").dataset.menuItem;
  await captureRestaurantEditor(); restaurantEditorData.menu = restaurantEditorData.menu.filter((item) => item.id !== id); renderRestaurantEditor();
});
restaurantDealsEditor?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-remove-deal]"); if (!button) return;
  const id = button.closest("[data-deal]").dataset.deal;
  await captureRestaurantEditor(); restaurantEditorData.weeklyDeals = restaurantEditorData.weeklyDeals.filter((deal) => deal.id !== id); renderRestaurantEditor();
});
document.querySelector("#restaurantLogout")?.addEventListener("click", async () => {
  try { await fetch(apiUrl("/api/restaurant/logout"), { method: "POST", headers: restaurantAuthHeaders() }); } catch {}
  logoutToLogin();
});
document.querySelectorAll("[data-restaurant-page]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-restaurant-page]").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".restaurant-dashboard-page").forEach((page) => page.classList.toggle("active", page.id === button.dataset.restaurantPage));
    if (button.dataset.restaurantPage !== "restaurantEditorPage") loadRestaurantOrders();
  });
});
document.querySelector("#refreshRestaurantOrders")?.addEventListener("click", loadRestaurantOrders);
document.querySelector("#restaurantCurrentOrdersBoard")?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-order-status]");
  if (!button) return;
  const response = await fetch(apiUrl(`/api/restaurant/orders/${encodeURIComponent(button.dataset.orderId)}/status`), { method: "POST", headers: restaurantAuthHeaders(), body: JSON.stringify({ status: button.dataset.orderStatus }) });
  if (response.ok) loadRestaurantOrders();
});
document.querySelector("#restaurantBackToAdmin")?.addEventListener("click", () => setActiveView("admin"));
document.querySelector("#adminRestaurantSitesButton")?.addEventListener("click", async () => {
  const button = document.querySelector("#adminRestaurantSitesButton");
  button.textContent = "Opening restaurant site…";
  try {
    if (!restaurantAdminToken) throw new Error("Please log out and sign back in to refresh restaurant-site access.");
    const listResponse = await fetch(apiUrl("/api/admin/restaurants"), { headers: { Authorization: `Bearer ${restaurantAdminToken}` } });
    const listData = await listResponse.json();
    if (!listResponse.ok) throw new Error(listData.error || "Restaurant site could not be opened.");
    const restaurant = listData.restaurants[0];
    if (!restaurant) throw new Error("No restaurant site has been created yet.");
    const editResponse = await fetch(apiUrl(`/api/admin/restaurants/${encodeURIComponent(restaurant.id)}/edit-session`), { method: "POST", headers: { Authorization: `Bearer ${restaurantAdminToken}` } });
    const editData = await editResponse.json();
    if (!editResponse.ok) throw new Error(editData.error || "Restaurant editor could not be opened.");
    restaurantAuthToken = editData.token;
    restaurantEditorData = editData.restaurant;
    sessionStorage.setItem("hopesGoRestaurantToken", restaurantAuthToken);
    renderRestaurantEditor();
    document.querySelector("#restaurantLogout").hidden = true;
    document.querySelector("#restaurantBackToAdmin").hidden = false;
    setActiveView("restaurant");
  } catch (error) {
    button.textContent = "Restaurant sites";
    window.alert(error.message);
  }
  button.textContent = "Restaurant sites";
});
document.querySelector("#openRestaurantsButton")?.addEventListener("click", () => setCustomerMode("restaurants"));
document.querySelector("#closeRestaurantsButton")?.addEventListener("click", () => setCustomerMode("home"));
document.querySelector("#differentPickupLocationButton")?.addEventListener("click", () => {
  startFreshRequest();
  const pickupService = services.find((service) => service.id === 1);
  cart.set(pickupService.id, { service: pickupService, quantity: 1 });
  customPickupDetailsCollected = false;
  setCustomerPage("pickupInfo");
  renderCart();
  profileFields.pickupAddress.focus();
});
restaurantStoreGrid?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-open-restaurant]"); if (!button) return;
  openRestaurantMenu(button.dataset.openRestaurant).catch((error) => { restaurantStoreGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`; });
});
restaurantPublicMenu?.addEventListener("click", (event) => {
  if (event.target.closest("[data-back-to-restaurants]")) { selectedRestaurantOrder = null; restaurantStoreGrid.hidden = false; restaurantPublicMenu.hidden = true; return; }
  const add = event.target.closest("[data-add-food]");
  if (add && selectedRestaurantOrder) {
    const item = selectedRestaurantOrder.restaurant.menu.find((entry) => entry.id === add.dataset.addFood);
    const current = selectedRestaurantOrder.items.get(item.id) || { item, quantity: 0 };
    current.quantity += 1; selectedRestaurantOrder.items.set(item.id, current); renderPublicRestaurantMenu(); return;
  }
  const remove = event.target.closest("[data-remove-food]");
  if (remove && selectedRestaurantOrder) {
    const current = selectedRestaurantOrder.items.get(remove.dataset.removeFood);
    if (current?.quantity > 1) current.quantity -= 1; else selectedRestaurantOrder.items.delete(remove.dataset.removeFood);
    renderPublicRestaurantMenu(); return;
  }
  if (event.target.closest("[data-restaurant-continue]") && selectedRestaurantOrder?.items.size) {
    const deliveryService = services.find((service) => service.id === 1);
    cart.set(deliveryService.id, { service: deliveryService, quantity: 1 });
    profileFields.pickupAddress.value = selectedRestaurantOrder.restaurant.address || selectedRestaurantOrder.restaurant.storeName;
    profileFields.pickupInstructions.value = `Restaurant order from ${selectedRestaurantOrder.restaurant.storeName}`;
    setCustomerMode("request"); setCustomerPage("customerAddons"); renderCart(); saveCurrentRequestDraft();
  }
});

driverRoleLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = driverRoleLoginName.value.trim().toLowerCase();
  const code = driverRoleAccessCode.value.trim();

  // Admin and owner credentials are verified server-side so live secrets are
  // never shipped in the browser bundle.
  try {
    const adminResponse = await fetch(apiUrl("/api/admin/restaurant-login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, accessCode: code }) });
    const adminData = await adminResponse.json();
    if (adminResponse.ok) {
      restaurantAdminToken = adminData.token;
      sessionStorage.setItem("hopesGoRestaurantAdminToken", adminData.token);
      localStorage.setItem("hopesGoAdminName", adminData.name || "Hope");
      if (adminData.role === "owner") {
        currentEmployee = adminData.name || "Hope";
        localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
        setRole("owner");
        loadOwnerMockCustomer();
        setCustomerPage("customerServices");
        renderEmployeeViews();
        renderAvailability();
      } else {
        setRole("admin");
      }
      driverRoleLoginStatus.textContent = "";
      setActiveView("admin");
      return;
    }
  } catch {}

  try {
    const driverResponse = await fetch(apiUrl("/api/driver/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password: code }) });
    const driverData = await driverResponse.json();
    if (driverResponse.ok) {
      currentEmployee = driverData.driver.name;
      sessionStorage.setItem("hopesGoDriverToken", driverData.token);
      localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
      driverRoleLoginStatus.textContent = "";
      setRole("driver");
      renderEmployeeViews();
      renderAvailability();
      setActiveView("employee");
      return;
    }
  } catch {}

  const staffLogin = [...approvedDriverLogins, ...approvedAdminLogins].find(
    (login) =>
      login.username.toLowerCase() === username &&
      login.code === code
  );

  if (!staffLogin) {
    driverRoleLoginStatus.textContent = "Staff account not approved.";
    return;
  }

  driverRoleLoginStatus.textContent = "";
  if (staffLogin.role === "owner") {
    try {
      const response = await fetch(apiUrl("/api/admin/restaurant-login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, accessCode: code }) });
      const data = await response.json();
      if (response.ok) { restaurantAdminToken = data.token; sessionStorage.setItem("hopesGoRestaurantAdminToken", data.token); }
    } catch {}
    currentEmployee = staffLogin.name;
    localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
    localStorage.setItem("hopesGoAdminName", staffLogin.name);
    setRole("owner");
    loadOwnerMockCustomer();
    setCustomerPage("customerServices");
    renderEmployeeViews();
    renderAvailability();
    setActiveView("admin");
    return;
  }

  currentEmployee = staffLogin.name;
  localStorage.setItem("hopesGoCurrentEmployee", currentEmployee);
  setRole("driver");
  renderEmployeeViews();
  renderAvailability();
  setActiveView("employee");
});

window.addEventListener("hashchange", () => {
  const id = window.location.hash.replace("#", "");
  if (["login", "storefront", "employee", "admin", "restaurant"].includes(id)) {
    setActiveView(id);
  }
});

searchInput.addEventListener("input", renderServices);
categoryFilter.addEventListener("change", renderServices);
tipInput.addEventListener("input", () => {
  syncTipAmountInput();
  renderCart();
});
tipInput.addEventListener("blur", formatTipAmountInput);
discountInput.addEventListener("input", renderCart);
checkoutButton.addEventListener("click", startStripeCheckout);
deliveryMethodInputs.forEach((input) => input.addEventListener("change", renderCart));
[
  ...Object.values(profileFields),
  additionalStopAddress,
  additionalStopNotes,
  termsAccepted,
].filter(Boolean).forEach((field) => {
  field.addEventListener("input", saveCurrentRequestDraft);
  field.addEventListener("change", saveCurrentRequestDraft);
});
window.setInterval(() => {
  const before = requests.length;
  requests = pruneExpiredTestRequests(requests);
  if (requests.length !== before) {
    saveRequests();
    renderAdminBoards();
    renderEmployeeViews();
  }
}, 60 * 1000);
window.setInterval(() => {
  if (autoApprovalSettings.away && Number(autoApprovalSettings.away.endMs) <= Date.now()) {
    autoApprovalSettings = { ...autoApprovalSettings, enabled: false, away: null };
    saveAutoApprovalSettings();
    renderAutoApprovalSettings();
  }
}, 30 * 1000);
socialLoginButtons.forEach((button) => {
  button.addEventListener("click", () => {
    customerLoginStatus.textContent =
      "Google, Apple, and Face ID login are ready to connect after the app is live in Supabase Auth.";
  });
});
runDailyUpdateButton?.addEventListener("click", () => renderDailyUpdate(true));
runCatalogLearningReview?.addEventListener("click", reviewCompletedOrderCatalogLearning);
document.querySelector("#autoApprovalForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  readAutoApprovalForm();
  saveAutoApprovalSettings();
  renderAutoApprovalSettings();
  document.querySelector("#autoApprovalSaveStatus").textContent = "Settings saved.";
});
driverMenuToggle?.addEventListener("click", () => {
  const isOpen = !driverMenuPanel.classList.contains("active");
  driverMenuPanel.classList.toggle("active", isOpen);
  driverMenuPanel.setAttribute("aria-hidden", String(!isOpen));
  driverMenuToggle.setAttribute("aria-expanded", String(isOpen));
});
adminMenuToggle?.addEventListener("click", () => {
  const isOpen = !adminMenuPanel.classList.contains("active");
  adminMenuPanel.classList.toggle("active", isOpen);
  adminMenuPanel.setAttribute("aria-hidden", String(!isOpen));
  adminMenuToggle.setAttribute("aria-expanded", String(isOpen));
});
if (enableNotifications) {
  enableNotifications.addEventListener("click", async () => {
    enableNotifications.textContent = await enableAppNotifications();
  });
}
shoppingListInput.addEventListener("input", renderShoppingEstimate);
shoppingPhotoInput.addEventListener("change", renderShoppingEstimate);
estimateShoppingButton.addEventListener("click", openShoppingPriceModal);
shoppingProductSearch.addEventListener("input", scheduleShoppingProductSearch);
shoppingStoreInput.addEventListener("input", handleShoppingStoreInput);
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
  const customer = getCurrentCustomer();
  if (!customer.pickupAddress) {
    setCustomerStatus("Enter the pickup address for this request.");
    profileFields.pickupAddress.focus();
    return;
  }
  if (!customer.deliveryAddress) {
    setCustomerStatus("Enter the delivery address.");
    profileFields.deliveryAddress.focus();
    return;
  }
  const validationMessage = getRequestValidationMessage();
  if (validationMessage) {
    setCustomerStatus(validationMessage);
    const serviceAreaRequirement = getDeliveryServiceAreaRequirement();
    if (serviceAreaRequirement.required) {
      serviceAreaReturnPage = "dropoffInfo";
      setCustomerPage("customerAreas");
    }
    return;
  }
  saveProfile({
    name: profileFields.name.value.trim(),
    phone: profileFields.phone.value.trim(),
    email: profileFields.email.value.trim(),
    deliveryAddress: profileFields.deliveryAddress.value.trim(),
    notes: profileFields.notes.value.trim(),
  });
  customerInfoEditMode = false;
  renderCustomerAccountPage();
  setCustomerStatus("");
  setCustomerPage("customerCheckout");
});
availabilityBuilder.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-exact-time]");
  if (addButton) {
    const day = addButton.dataset.addExactTime;
    availabilityBuilder.querySelector(`[data-exact-time-list="${day}"]`)?.insertAdjacentHTML("beforeend", renderExactTimeRow(day));
    return;
  }
  const removeButton = event.target.closest("[data-remove-exact-time]");
  if (removeButton) {
    const row = removeButton.closest("[data-exact-time-row]");
    const list = row?.parentElement;
    row?.remove();
    if (list && !list.querySelector("[data-exact-time-row]")) {
      const day = list.dataset.exactTimeList;
      list.insertAdjacentHTML("beforeend", renderExactTimeRow(day));
    }
  }
});

availabilityForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const selections = getSelectedAvailability();
  const exactTimes = getSelectedExactTimes();
  if (!Object.keys(selections).length && !Object.keys(exactTimes).length) {
    driverAvailabilitySummary.innerHTML = `<div class="empty-state">Choose a shift block or add at least one specific start and end time.</div>`;
    return;
  }
  const name = availabilityFields.name.value.trim();
  try {
    const response = await fetch(apiUrl("/operations-schedule"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, days: buildWeeklyScheduleDays(selections, exactTimes) }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "The schedule could not be saved.");
    latestOperationsStatus = result;
    renderOperationsStatus(result);
  } catch (error) {
    driverAvailabilitySummary.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    return;
  }
  upsertAvailability({
    name,
    selections,
    exactTimes,
    notes: availabilityFields.notes.value.trim(),
    updatedAt: new Date().toISOString(),
    history: [],
  });
});

async function restoreRestaurantSession() {
  if (!restaurantAuthToken || currentRole !== "restaurant") return;
  try {
    const response = await fetch(apiUrl("/api/restaurant/me"), { headers: restaurantAuthHeaders() });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Restaurant login expired.");
    restaurantEditorData = data.restaurant;
    renderRestaurantEditor();
    setActiveView("restaurant");
  } catch {
    sessionStorage.removeItem("hopesGoRestaurantToken");
    restaurantAuthToken = "";
    if (currentRole === "restaurant") logoutToLogin();
  }
}

renderCategories();
renderProfile();
renderEmployeeViews();
renderAdminBoards();
renderAvailability();
renderRoleNavigation();
setCustomerLoginMode("signup");
setupPasswordToggles();
renderCustomerMenuStatus();
updateLocationDatalist();
wireAddressAutocomplete(profileFields.pickupAddress, pickupAddressSuggestions);
wireAddressAutocomplete(profileFields.deliveryAddress, deliveryAddressSuggestions);
wireAddressAutocomplete(additionalStopAddress, additionalStopAddressSuggestions);
syncRequestLocationFromField(profileFields.pickupAddress);
syncRequestLocationFromField(profileFields.deliveryAddress);
renderDailyUpdate();
renderSelectedShoppingProducts();
fetchOperationsStatus({ quiet: true });
resetTestCheckoutState();
setCustomerPage("customerServices");
setCustomerMode("home");
updateResumeCartButton();
setActiveView(window.location.hash.replace("#", "") || getSavedLandingView());
restoreRestaurantSession();
handleCheckoutReturnStatus();
messageCountdownTimer = window.setInterval(updateMessageCountdowns, 30000);
driverDemandTimer = window.setInterval(() => {
  renderServices();
  if (currentEmployee) {
    renderDriverStatusSummary();
    renderMonthlyScheduleActivity();
  }
}, 60000);
operationsStatusTimer = window.setInterval(() => {
  fetchOperationsStatus({ quiet: true });
}, 30000);
