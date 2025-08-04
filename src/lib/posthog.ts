import posthog from 'posthog-js'

export const initPostHog = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'
  
  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: false, // Disable automatic pageview capture since it's a SPA
      capture_pageleave: true,
    })
  } else {
    console.warn('PostHog key not found. Analytics will not be enabled.')
  }
  
  return posthog
}

export { posthog }