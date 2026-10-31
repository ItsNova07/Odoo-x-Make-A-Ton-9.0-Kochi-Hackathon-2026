// ------------------------------------------------------------------
// api.js — the ONLY file that talks to the backend.
// Every page imports functions from here. Pages never call fetch().
//
// HOW PLACEHOLDERS WORK
// Each backend area has its own mock switch below. While a switch is
// true, functions return fake data from mockData.js. When Member 2's
// endpoint for that area is live, set its switch to false. Pages don't
// change at all.
// ------------------------------------------------------------------
import * as mock from "./mockData.js";
import { ApiError } from "./ApiError.js";

export const MOCK = {
  auth: true, // backend/app/modules/auth
  users: true, // backend/app/modules/users
  customers: true, // backend/app/modules/customers
  invoices: true, // billing backend (Member 4's routes)
  subscriptions: true, // subscriptions backend
  plans: true, // plans catalogue
  payments: true, // customer's saved payment methods
};

// In dev, Vite forwards /api/* to http://localhost:8000 (see vite.config.js).
// For a deployed backend, set VITE_API_URL in a .env file.
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// FastAPI's OAuth2PasswordRequestForm expects form data with
// "username" + "password". If Member 2 used a JSON body instead
// ({ email, password }), set this to false.
const LOGIN_USES_FORM = true;

// All backend paths in one place. Ask Member 2 if any differ.
const ENDPOINTS = {
  login: "/auth/login",
  signup: "/auth/signup",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  me: "/users/me",
  users: "/users",
  createStaff: "/users/staff",
  customers: "/customers",
  customerMe: "/customers/me",
  invoices: "/invoices",
  invoiceSummary: "/invoices/summary",
  subscriptionSummary: "/subscriptions/summary",
  plans: "/plans",
  mySubscription: "/subscriptions/me",
  changeMyPlan: "/subscriptions/me/change-plan",
  myPaymentMethods: "/payment-methods/me",
};

const TOKEN_KEY = "brightloop_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export { ApiError };

// FastAPI errors look like { detail: "text" } or
// { detail: [{ loc: [...], msg: "text" }, ...] } for validation.
function readErrorMessage(body, status) {
  if (body && typeof body.detail === "string") return body.detail;
  if (body && Array.isArray(body.detail) && body.detail.length > 0) {
    return body.detail.map((item) => item.msg).join(". ");
  }
  if (status === 0) return "Can't reach the server. Check that the backend is running.";
  if (status >= 500) return "The server hit an error. Try again in a moment.";
  return `Request failed (${status}).`;
}

async function request(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(BASE_URL + path, { method, headers, body: payload });
  } catch {
    throw new ApiError(readErrorMessage(null, 0), 0);
  }

  const text = await response.text();
  const data = text ? safeJson(text) : null;

  if (response.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event("brightloop:logged-out"));
  }
  if (!response.ok) {
    throw new ApiError(readErrorMessage(data, response.status), response.status);
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

// ---------------- Auth ----------------

export async function login(email, password) {
  if (MOCK.auth) return mock.login(email, password);
  const result = LOGIN_USES_FORM
    ? await request(ENDPOINTS.login, { method: "POST", form: { username: email, password } })
    : await request(ENDPOINTS.login, { method: "POST", body: { email, password } });
  return { token: result.access_token };
}

export function signup(details) {
  if (MOCK.auth) return mock.signup(details);
  return request(ENDPOINTS.signup, { method: "POST", body: details });
}

export function forgotPassword(email) {
  if (MOCK.auth) return mock.forgotPassword(email);
  return request(ENDPOINTS.forgotPassword, { method: "POST", body: { email } });
}

export function resetPassword(token, newPassword) {
  if (MOCK.auth) return mock.resetPassword(token, newPassword);
  return request(ENDPOINTS.resetPassword, {
    method: "POST",
    body: { token, new_password: newPassword },
  });
}

// Returns { id, name, email, role } where role is admin | staff | customer
export async function getCurrentUser() {
  if (MOCK.auth) return mock.getCurrentUser(tokenStore.get());
  const user = await request(ENDPOINTS.me);
  return normaliseUser(user);
}

// Update the logged-in user's own details. Returns the updated user.
export async function updateMe(details) {
  if (MOCK.auth) return mock.updateMe(tokenStore.get(), details);
  const user = await request(ENDPOINTS.me, { method: "PATCH", body: details });
  return normaliseUser(user);
}

// Backends often call the name field full_name; accept either.
function normaliseUser(user) {
  return { ...user, name: user.name || user.full_name || user.email };
}

// ---------------- Users (admin) ----------------

export async function getUsers() {
  if (MOCK.users) return mock.getUsers();
  const users = await request(ENDPOINTS.users);
  return users.map(normaliseUser);
}

export function createStaff(details) {
  if (MOCK.users) return mock.createStaff(details);
  return request(ENDPOINTS.createStaff, { method: "POST", body: details });
}

// ---------------- Customers ----------------

export function getCustomers() {
  if (MOCK.customers) return mock.getCustomers();
  return request(ENDPOINTS.customers);
}

export function createCustomer(details) {
  if (MOCK.customers) return mock.createCustomer(details);
  return request(ENDPOINTS.customers, { method: "POST", body: details });
}

export function updateCustomer(id, details) {
  if (MOCK.customers) return mock.updateCustomer(id, details);
  return request(`${ENDPOINTS.customers}/${id}`, { method: "PUT", body: details });
}

export function deleteCustomer(id) {
  if (MOCK.customers) return mock.deleteCustomer(id);
  return request(`${ENDPOINTS.customers}/${id}`, { method: "DELETE" });
}

export function getMyCustomerProfile() {
  if (MOCK.customers) return mock.getMyCustomerProfile();
  return request(ENDPOINTS.customerMe);
}

export function updateMyCustomerProfile(details) {
  if (MOCK.customers) return mock.updateMyCustomerProfile(details);
  return request(ENDPOINTS.customerMe, { method: "PUT", body: details });
}

// ---------------- Invoices ----------------
// Lists come back as { items, total, page, page_size }.
// filters: { status, customer_id, from_date, to_date, overdue, page, page_size }

export function getInvoices(filters = {}) {
  if (MOCK.invoices) return mock.getInvoices(filters);
  return request(`${ENDPOINTS.invoices}${toQuery(filters)}`);
}

// { revenue, outstanding, overdue_count, overdue_amount, overdue_invoices[],
//   months: [{ month: "2026-10", revenue, outstanding, overdue_amount }]   (last 6 months up to to_date, oldest first)
//   collection: { paid, unpaid, overdue } }                                (invoices issued between the dates)
export function getInvoiceSummary({ from_date, to_date } = {}) {
  if (MOCK.invoices) return mock.getInvoiceSummary({ from_date, to_date });
  return request(`${ENDPOINTS.invoiceSummary}${toQuery({ from_date, to_date })}`);
}

// ---------------- Subscriptions ----------------

// { active_count, active_by_month: [{ month, count }],
//   mrr, mrr_by_month: [{ month, mrr }],
//   mrr_movement: { month, start, new_mrr, new_count, expansion_mrr, expansion_count,
//                   contraction_mrr, contraction_count, churn_mrr, churn_count, end },
//   plans: [{ plan_name, subscribers, mrr }],
//   renewing_soon[], renewals_next_30_days: [{ id, date, customer_name, plan_name, billing_cycle, amount }] }
export function getSubscriptionSummary({ to_date } = {}) {
  if (MOCK.subscriptions) return mock.getSubscriptionSummary({ to_date });
  return request(`${ENDPOINTS.subscriptionSummary}${toQuery({ to_date })}`);
}

// ---------------- Plans ----------------
// Plan: { id, name, description, price, billing_cycle: "monthly" | "quarterly" | "yearly",
//         features: string[], trial_days, is_public, subscriber_count }

// public_only: true for the customer view (only plans customers can choose)
export function getPlans({ public_only = false } = {}) {
  if (MOCK.plans) return mock.getPlans({ public_only });
  return request(`${ENDPOINTS.plans}${toQuery({ public_only: public_only || undefined })}`);
}

export function createPlan(details) {
  if (MOCK.plans) return mock.createPlan(details);
  return request(ENDPOINTS.plans, { method: "POST", body: details });
}

export function updatePlan(id, changes) {
  if (MOCK.plans) return mock.updatePlan(id, changes);
  return request(`${ENDPOINTS.plans}/${id}`, { method: "PATCH", body: changes });
}

// ---------------- Customer: my subscription & payment methods ----------------

// { plan_id, plan_name, status, next_billing_date, scheduled_plan_id, scheduled_plan_name }
// scheduled_* is a switch the customer chose that starts on next_billing_date.
export function getMySubscription() {
  if (MOCK.subscriptions) return mock.getMySubscription();
  return request(ENDPOINTS.mySubscription);
}

// Schedules a switch for the next billing date. Choosing the current plan
// again cancels a scheduled switch.
export function changeMyPlan(planId) {
  if (MOCK.subscriptions) return mock.changeMyPlan(planId);
  return request(ENDPOINTS.changeMyPlan, { method: "POST", body: { plan_id: planId } });
}

// [{ id, type: "card" | "upi" | "netbanking", brand?, last4?, expiry?, upi_id?, bank_name?, is_default }]
// Card numbers never pass through this app: cards are added in the payment
// gateway's own secure window, which returns only brand and last 4 digits.
export function getMyPaymentMethods() {
  if (MOCK.payments) return mock.getMyPaymentMethods();
  return request(ENDPOINTS.myPaymentMethods);
}

export function setDefaultPaymentMethod(id) {
  if (MOCK.payments) return mock.setDefaultPaymentMethod(id);
  return request(`${ENDPOINTS.myPaymentMethods}/${id}/default`, { method: "POST" });
}

export function removePaymentMethod(id) {
  if (MOCK.payments) return mock.removePaymentMethod(id);
  return request(`${ENDPOINTS.myPaymentMethods}/${id}`, { method: "DELETE" });
}

// Builds "?a=1&b=2", skipping empty values so the backend never sees status=""
function toQuery(params) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
}
