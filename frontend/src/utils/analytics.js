import mixpanel from "mixpanel-browser";

let analyticsEnabled = false;

export function initAnalytics() {
  const token = import.meta.env.VITE_MIXPANEL_PROJECT_TOKEN;
  const hasValidToken = typeof token === "string" && token.trim().length > 0;

  if (!hasValidToken) {
    analyticsEnabled = false;
    console.warn("Mixpanel is disabled: missing VITE_MIXPANEL_PROJECT_TOKEN");
    return;
  }

  mixpanel.init(token, {
    track_pageview: true,
    autocapture: true,
    record_sessions_percent: 100,
    record_heatmap_data: true,
    api_host: import.meta.env.DEV ? "/mixpanel" : "https://api-js.mixpanel.com",
  });

  analyticsEnabled = true;
  trackEvent("App Loaded");
}

export function trackEvent(name, properties = {}) {
  if (!analyticsEnabled) return;

  try {
    mixpanel.track(name, properties);
  } catch (error) {
    console.warn(`Mixpanel track failed for ${name}`, error);
  }
}
