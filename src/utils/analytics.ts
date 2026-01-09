// PostHog analytics utility
declare global {
  interface Window {
    posthog: any;
  }
}

export const analytics = {
  // Track custom events
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventName, properties);
    }
  },

  // Identify users
  identify: (userId: string, traits?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, traits);
    }
  },

  // Track page views
  page: (pageName?: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('$pageview', {
        ...(pageName && { $current_url: pageName }),
        ...properties
      });
    }
  },

  // Reset user identification
  reset: () => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.reset();
    }
  },

  // Check if PostHog is available
  isReady: () => {
    return typeof window !== 'undefined' && !!window.posthog;
  },

  // Get current user distinct ID
  getDistinctId: () => {
    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.get_distinct_id();
    }
    return null;
  },

  // Alias user ID (useful for cross-subdomain tracking)
  alias: (aliasId: string, previousId?: string) => {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.alias(aliasId, previousId);
    }
  }
};

// Common event names for the app
export const AnalyticsEvents = {
  NOTE_CREATED: 'note_created',
  NOTE_UPDATED: 'note_updated',
  NOTE_DELETED: 'note_deleted',
  NOTE_PINNED: 'note_pinned',
  NOTE_UNPINNED: 'note_unpinned',
  SEARCH_PERFORMED: 'search_performed',
  VIEW_MODE_CHANGED: 'view_mode_changed',
  SETTINGS_OPENED: 'settings_opened',
  TERMS_AGREED: 'terms_agreed',
  STICKY_NOTE_CREATED: 'sticky_note_created',
  CHECKLIST_ITEM_ADDED: 'checklist_item_added',
  CHECKLIST_ITEM_COMPLETED: 'checklist_item_completed'
} as const;
