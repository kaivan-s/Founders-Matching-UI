// PostHog Analytics Configuration
import posthog from 'posthog-js';

// Initialize PostHog
// Get your API key from: https://app.posthog.com/project/settings
const POSTHOG_KEY = process.env.REACT_APP_POSTHOG_KEY;
const POSTHOG_HOST = process.env.REACT_APP_POSTHOG_HOST || 'https://us.i.posthog.com';

export const initPostHog = () => {
  if (POSTHOG_KEY) {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      session_recording: {
        maskAllInputs: false,
        maskInputOptions: {
          password: true,
        },
      },
    });
  }
};

// Identify user (call after login)
export const identifyUser = (userId, properties = {}) => {
  if (POSTHOG_KEY && userId) {
    posthog.identify(userId, properties);
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (POSTHOG_KEY) {
    posthog.capture(eventName, properties);
  }
};

// Reset user on logout
export const resetUser = () => {
  if (POSTHOG_KEY) {
    posthog.reset();
  }
};

export default posthog;
