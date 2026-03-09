import { baseApi } from "../service/api";

const ANON_ID_KEY = "analyticsAnonymousId";
let analyticsEnabled = false;

function generateAnonymousId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function getAnonymousId() {
  let anonymousId = localStorage.getItem(ANON_ID_KEY);
  if (!anonymousId) {
    anonymousId = generateAnonymousId();
    localStorage.setItem(ANON_ID_KEY, anonymousId);
  }
  return anonymousId;
}

function getAuthHeaders() {
  const token = localStorage.getItem("accessToken");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function initAnalytics() {
  getAnonymousId();
  analyticsEnabled = true;
  trackEvent("App Loaded");
}

export async function identifyAuthenticatedUser() {
  if (!analyticsEnabled) return;

  try {
    await baseApi.post(
      "analytics/identify/",
      { anonymousId: getAnonymousId() },
      { headers: getAuthHeaders() },
    );
  } catch (error) {
    console.warn("Analytics identify failed", error);
  }
}

export async function trackEvent(name, properties = {}) {
  if (!analyticsEnabled) return;

  try {
    await baseApi.post(
      "analytics/track/",
      {
        event: name,
        anonymousId: getAnonymousId(),
        properties,
      },
      { headers: getAuthHeaders() },
    );
  } catch (error) {
    console.warn(`Analytics track failed for ${name}`, error);
  }
}
