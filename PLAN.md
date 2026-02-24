# Stickee Major Improvements Plan

## Shared Notes & Collaboration Features

### 1. Shared Tab
- **Shared Notes View**: New tab showing all notes shared to you
- **User Dropdown**: Dropdown menu of all users you can share notes with
- **Share Management**: Interface to manage sharing permissions and recipients

### 2. User Profile System
- **Custom Names**: Users can change their names (instead of "User 3056cb79")
- **User Avatars**: Profile pictures for users
- **User Profiles**: Basic profile information and settings

### 3. Enhanced Note Features
- **Due Dates**: Replace or supplement status system with deadline functionality
- **Deadline Management**: Set and track due dates for notes/tasks
- **Calendar Integration**: Visual calendar view of upcoming deadlines

### 4. Notification System
- **Email Notifications**: Add email in settings to receive deadline alerts
- **SMS Notifications**: Add phone number for text message notifications
- **Custom Timing**: Set when you want notifications (e.g., 1 day before, 1 hour before)
- **Notification Types**: 
  - Deadline reminders
  - Shared note updates
  - Chat messages

### 5. Chat System
- **User ID Chat**: Input user ID to start conversations
- **Chat Tab**: New dedicated chat tab/interface
- **Real-time Messaging**: Live chat functionality with other users
- **Chat Views**: Different view modes for chat interface
- **Message History**: Persistent chat history

### 6. Account Sync
- **Multi-device Sync**: Connect phone and laptop accounts
- **Cross-platform**: Seamless experience across devices
- **Account Linking**: Method to link multiple devices to same user account

## Technical Implementation Notes

### Database Schema Changes
- Users table expansion (names, avatars, emails, phones)
- Shared notes relationships
- Chat messages storage
- Notification preferences
- Due date tracking

### New UI Components
- Shared notes interface
- User profile editor
- Chat interface
- Notification settings
- Due date picker
- User selection dropdown

### Integration Points
- Email service integration
- SMS service integration
- Real-time chat backend
- File upload for avatars
- Push notifications

## Related Issues (Duplicated/Merged)
- #10: Make users able to change their names
- #11: Make sharing notes
- #15: Email notifications
- #19: Chat functionality
- #58: Multi-device account sync

## Project Status
- **Status**: In Progress
- **Priority**: Major Improvement
- **Assigned**: slammers001
- **Project**: Issues Project (Todo → In Progress)

## Dependencies
- Achievements and Streaks (#23) - mentioned for potential integration
- User authentication system
- Real-time communication infrastructure
- Notification delivery services

## Implementation Order (Suggested)
1. User profile system (names, avatars)
2. Shared notes functionality
3. Due dates system
4. Notification system
5. Chat system
6. Multi-device sync
