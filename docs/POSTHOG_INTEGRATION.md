# PostHog Analytics Integration

This document explains how PostHog analytics is integrated into the Stickee application.

## Setup

PostHog is integrated using the CDN approach in `index.html` and a utility wrapper in `src/utils/analytics.ts`.

## Configuration

### HTML Setup
- PostHog CDN script is loaded in `index.html`
- Initialized with your API key: `phc_dOBViKPhL2wwSDvkWprVr9vmD5L5303U10sVxcqda3T`
- API host: `https://us.posthog.com`
- Autocapture and pageview tracking enabled

### Analytics Utility
The `src/utils/analytics.ts` file provides a simple interface for tracking events:

```typescript
import { analytics, AnalyticsEvents } from "@/utils/analytics";

// Track custom events
analytics.track('event_name', { property: 'value' });

// Identify users
analytics.identify('user_id', { name: 'John', email: 'john@example.com' });

// Track page views
analytics.page('page_name');

// Reset user identification
analytics.reset();
```

## Tracked Events

The following events are automatically tracked:

### User Actions
- `note_created` - When a user creates a new note
- `note_updated` - When a user updates an existing note
- `note_deleted` - When a user deletes a note
- `note_pinned` - When a user pins a note
- `note_unpinned` - When a user unpins a note
- `search_performed` - When a user performs a search
- `view_mode_changed` - When a user changes view mode
- `settings_opened` - When a user opens settings
- `terms_agreed` - When a user agrees to terms
- `sticky_note_created` - When a user creates a sticky note
- `checklist_item_added` - When a user adds a checklist item
- `checklist_item_completed` - When a user completes a checklist item

### Event Properties

Each event includes relevant properties:

#### Note Events
- `note_id` - Unique identifier of the note
- `color` - Note color
- `status` - Note status (To-Do, Doing, Done, Backlog)
- `has_title` - Whether the note has a title
- `content_length` - Length of the note content

#### Search Events
- `query_length` - Length of the search query
- `query_type` - Type of search (text_search)

#### Terms Agreement
- `source` - Source of the agreement (terms_popup)

## Usage Examples

### Adding Custom Events

```typescript
// In any component
import { analytics } from "@/utils/analytics";

const handleCustomAction = () => {
  analytics.track('custom_event', {
    button_clicked: 'save',
    user_level: 'premium'
  });
};
```

### User Identification

```typescript
// When user logs in or signs up
analytics.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan
});
```

### Page Tracking

```typescript
// Manual page tracking (automatic pageview tracking is enabled)
analytics.page('Dashboard', {
  user_type: 'premium'
});
```

## Privacy

- No personal data is tracked unless explicitly identified
- Autocapture is enabled to track clicks, form submissions, and page views
- Users can opt out by blocking PostHog scripts or using privacy settings

## Development

During development, PostHog events are sent to your PostHog dashboard. You can:

1. View real-time events in your PostHog dashboard
2. Create funnels to track user journeys
3. Set up cohorts for user segmentation
4. Create dashboards for key metrics

## Debugging

To debug PostHog tracking:

1. Open browser developer tools
2. Check the Network tab for PostHog requests
3. Use the PostHog debugger in your dashboard
4. Set `debug: true` in the PostHog initialization for console logs

## Data Schema

Refer to the `AnalyticsEvents` constant in `src/utils/analytics.ts` for the complete list of standardized event names and their expected properties.
