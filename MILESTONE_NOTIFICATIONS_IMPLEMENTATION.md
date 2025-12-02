# Milestone Stage Update Notifications Implementation

## Overview
This implementation adds comprehensive notification functionality for milestone stage updates in the ticketing system. Users will now receive notifications whenever:
- Milestone stages are transitioned/changed
- New milestones are created
- Milestone notes are updated
- Photos are added to milestones

## Features Added

### 1. Milestone Notification Types
Added new notification types to `server/lib/notificationUtils.js`:
- `MILESTONE_CREATED`: When a new milestone is created
- `MILESTONE_UPDATED`: When milestone details are updated
- `MILESTONE_STAGE_CHANGED`: When milestone stage transitions occur
- `MILESTONE_COMPLETED`: When a milestone is completed (especially final stages)

### 2. Smart Role-Based Notifications
The system intelligently determines which users should receive notifications based on:

#### Default Notification Recipients:
- `MACSOFT_ADMIN`
- `MACSOFT_HEAD`
- `MACSOFT_SUPPORT`
- `CUSTOMER_SERVICE_HEAD`

#### Stage-Specific Recipients:
- **Field-related stages** (`REQUEST_CLEARED_AT_FIELD`, `FIELD_CLEARANCE_APPROVED`):
  - Also notifies `CUSTOMER_FIELD_ENGINEER`
  
- **Service center stages** (`RECEIVED_AT_SERVICE_CENTER`, `DIAGNOSIS_IN_PROGRESS`, `REPAIR_IN_PROGRESS`, `REPLACEMENT_IN_PROGRESS`, `REPAIRED`, `READY_FOR_DISPATCH`):
  - Also notifies `SERVICE_CENTER_TECHNICIAN`

### 3. Notification Scenarios

#### Stage Transitions
When a milestone stage is changed via `transitionMilestone()`:
- Notification title: "🎯 Milestone Stage Updated"
- Message includes previous and new stage information
- Shows if ticket is closed (for final stages)
- Includes spare request approval information when applicable

#### Milestone Creation
When a new milestone is created via `createMilestone()`:
- Notification title: "📍 New Milestone Created"
- Message includes milestone stage and ticket information

#### Note Updates
When milestone notes are updated via `updateMilestoneNotes()`:
- Notification title: "📝 Milestone Updated"
- Message indicates notes were updated for the milestone

#### Photo Additions
When photos are added to milestones via `addPhotosToCurrentMilestone()`:
- Notification title: "📝 Milestone Updated"
- Message indicates photos were added to the milestone

### 4. Implementation Details

#### Files Modified:
1. **`server/lib/notificationUtils.js`**:
   - Added milestone notification types
   - Added `createMilestoneNotification()` helper function
   - Exported the new function

2. **`server/service/milestones.js`**:
   - Added notification creation in `transitionMilestone()`
   - Added notification creation in `createMilestone()`
   - Added notification creation in `updateMilestoneNotes()`
   - Added notification creation in `addPhotosToCurrentMilestone()`

#### Notification Content:
- **Rich Context**: Notifications include ticket code, customer name, milestone labels, and relevant stage information
- **Emojis**: User-friendly emoji indicators for different types of notifications
- **Previous Stage Info**: For transitions, shows both previous and new stages
- **Closure Indicators**: Clearly indicates when a ticket is closed due to milestone completion

#### Error Handling:
- Notifications are handled in try-catch blocks
- Notification failures don't prevent milestone operations from succeeding
- Comprehensive logging for debugging

### 5. Real-Time Features

#### Socket.IO Integration:
- Notifications are broadcasted via WebSocket for real-time updates
- Saves to database for persistent notification history
- Users can see notifications immediately without page refresh

#### Database Storage:
- All notifications are saved to the `Notification` and `NotificationRecipient` tables
- Maintains notification read/unread status
- Preserves notification history for auditing

### 6. User Experience

#### Notification Messages Examples:
- **Stage Change**: "Ticket TKT-2024-001 milestone updated to 'Diagnosis in Progress'. Previous: 'Received at Service Center'"
- **Ticket Completion**: "Milestone 'Delivered to Field' completed for ticket TKT-2024-001 - Ticket Closed"
- **Spare Approval**: "Ticket TKT-2024-001 milestone updated to 'Spare Approved'"

#### Visual Indicators:
- 🎯 Milestone Stage Updated
- 📍 New Milestone Created  
- 📝 Milestone Updated
- ✅ Milestone Completed / Ticket Completed

### 7. Configuration

#### Target User Selection:
The notification system excludes the user who performed the action to avoid self-notifications and targets relevant roles based on the milestone stage and context.

#### Extensibility:
The implementation is designed to be easily extended:
- Add new milestone stages to notification logic
- Modify role-based targeting rules
- Add new notification types for different milestone events

## Testing

To test the implementation:

1. **Create a milestone transition**: Change a milestone stage and verify notifications are sent
2. **Add milestone notes**: Update notes and check for notifications
3. **Add photos**: Upload photos to a milestone and verify notifications
4. **Check notification recipients**: Ensure only appropriate roles receive notifications
5. **Verify real-time updates**: Check that notifications appear immediately via WebSocket

## Benefits

1. **Improved Visibility**: All stakeholders are notified of milestone progress
2. **Real-Time Updates**: Immediate notification of changes
3. **Role-Based Targeting**: Only relevant users receive notifications
4. **Rich Context**: Notifications include all necessary information
5. **Audit Trail**: All milestone changes are tracked via notifications
6. **Better Coordination**: Teams stay synchronized on ticket progress

The implementation ensures that milestone stage updates are communicated effectively across the organization, improving workflow coordination and reducing the need for manual status checks.