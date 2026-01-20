# Milestone Archiving Analysis

## Overview
TicketMilestone is a critical entity that tracks the lifecycle/workflow stages of a ticket. It represents the service workflow from ticket creation to closure.

---

## Database Schema (TicketMilestone Model)

```prisma
model TicketMilestone {
  id            Int             @id @default(autoincrement())
  ticketId      Int
  stage         ServiceStage    // TICKET_RAISED, SERVICE_CENTER_ASSIGNED, etc.
  order         Int
  description   String?
  allowedRoles  String?
  status        MilestoneStatus // PENDING, IN_PROGRESS, DONE, BLOCKED
  startedAt     DateTime?
  completedAt   DateTime?
  eta           DateTime?
  slaDueAt      DateTime?
  photoRequired Boolean
  changedBy     Int?
  notes         String?
  createdAt     DateTime
  updatedAt     DateTime
  
  // Relations
  ticket      Ticket        @relation(fields: [ticketId], references: [id])
  changer     User?         @relation(fields: [changedBy], references: [id])
  attachments Attachments[] // Photos/documents attached to milestones
}
```

### Related Relations:
- **Attachments**: Photos uploaded at specific milestone stages (e.g., SUBMITTED_TO_SERVICE_CENTER, RECEIVED_AT_SERVICE_CENTER)
- **User (changer)**: Who updated/transitioned the milestone
- **Ticket**: Parent ticket

---

## Server-Side Usage

### 1. **Milestone Service** (`server/service/milestones.js`)
   - **createMilestone()** - Create new milestone
   - **updateMilestone()** - Update milestone status/notes
   - **transitionMilestone()** - Transition to next stage
   - **getTicketMilestones()** - Fetch all milestones for a ticket
   - **addPhotosToMilestone()** - Upload photos to milestone

### 2. **Ticket Service** (`server/service/tickets.js`)
   - **Lines 244, 586, 656, 708, 1027, 1538, 1590, 1655, 1711**: Include `ticketMilestones` when fetching tickets
   - **Line 322**: Filter tickets by milestone stage
   - **Line 733**: Check if ticket has final milestone (TICKET_CLOSED)
   - **getTicketById()**: Returns ticket with all milestones included

### 3. **Spare Request Service** (`server/service/spareRequests.js`)
   - Uses milestones to validate spare requests can only be created at specific stages
   - Updates milestone status when spare requests are approved/rejected
   - Lines 32, 127, 348, 355-356, 789, 796-797, 994, 1001-1002: All reference `ticketMilestones`

### 4. **Controllers & Routes**
   - **GET** `/api/milestones/:ticketId` - Get all milestones for ticket
   - **GET** `/api/milestones/ticket/:ticketId` - Alternative endpoint
   - **POST** `/api/tickets/:ticketId/milestones/:milestoneId/notes` - Update milestone notes
   - **POST** `/api/milestones/transition` - Transition milestone to next stage
   - **POST** `/api/milestones/:milestoneId/photos` - Add photos to milestone

### 5. **Socket Events**
   - `milestone-updated` - Emitted when milestone is updated
   - `milestone-created` - Emitted when new milestone is created
   - `milestone-transitioned` - Emitted when milestone transitions to next stage

---

## Client-Side Usage

### 1. **TicketDashboard** (`client/src/pages/ticket/TicketDashboard.jsx`)
   - **Line 295**: `updateMilestone` hook from `useTickets()`
   - **Lines 479, 483**: Updates milestone when spare request is submitted
   - **Lines 496-515**: `handleUpdateNotes()` - Update milestone notes
   - **Lines 531-640**: `handleMilestoneAction()` - Handle milestone transitions and actions
   - Displays milestone timeline for ticket workflow visualization

### 2. **MilestoneTimeline Component** (`client/src/components/MilestoneTimeline.jsx`)
   - Renders visual timeline of all milestone stages
   - Shows status (PENDING, IN_PROGRESS, DONE, BLOCKED)
   - Displays photos attached to each milestone
   - Allows role-based transitions between stages
   - Shows ETA, SLA due dates, notes for each milestone

### 3. **Socket Context** (`client/src/lib/contexts/SocketContext.jsx`)
   - Lines 93-106: `hasAccessToMilestone()` - RBAC helper for milestone events
   - Listens to socket events: `milestone-updated`, `milestone-created`, `milestone-transitioned`

### 4. **Socket Handler** (`client/src/lib/socket/socket.js`)
   - Lines 100-121: Dispatches custom events for milestone updates:
     - `socketMilestone` (milestone updated)
     - `socketMilestoneCreated` (new milestone created)
     - `socketMilestoneTransitioned` (milestone transitioned)

---

## Business Logic & Importance

### Why Milestones Are Critical:
1. **Workflow Tracking**: Tracks the entire service lifecycle (15+ stages)
2. **Role-Based Actions**: Each stage has specific allowed roles
3. **Photo Requirements**: Certain stages require photo proof (SUBMITTED_TO_SERVICE_CENTER, RECEIVED_AT_SERVICE_CENTER, etc.)
4. **Spare Request Integration**: Spare requests are tied to specific milestone stages
5. **SLA Tracking**: Each milestone has ETA and SLA due dates
6. **Audit Trail**: Tracks who changed what and when (changedBy, startedAt, completedAt)
7. **Real-time Updates**: Socket events keep all users updated on milestone changes

### Milestone Stages Flow:
```
TICKET_RAISED 
  → SERVICE_CENTER_ASSIGNED 
  → REQUEST_CLEARED_AT_FIELD (optional)
  → SENT_TO_SERVICE_CENTER 
  → SUBMITTED_TO_SERVICE_CENTER (photo required)
  → RECEIVED_AT_SERVICE_CENTER (photo required)
  → DIAGNOSIS_IN_PROGRESS 
  → SPARE_REQUESTED (optional)
  → SPARE_APPROVED (optional)
  → REPAIR_IN_PROGRESS / REPLACEMENT_IN_PROGRESS
  → REPAIRED 
  → READY_FOR_DISPATCH (photo required)
  → DELIVERED_TO_FIELD 
  → FIELD_CLEARANCE_APPROVED 
  → TICKET_CLOSED
```

---

## Archiving Requirements

### What Needs to Be Archived:
1. **All milestone records** for the ticket
2. **Milestone attachments** (photos/documents)
3. **Milestone history** (who changed, when, status transitions)
4. **Notes** added to each milestone
5. **ETA and SLA data**

### Why Archive Milestones:
- **Historical record**: Need to know what stages the ticket went through
- **Audit compliance**: Who did what and when
- **Photo evidence**: Photos taken at various stages (service center receipt, dispatch, etc.)
- **Performance analysis**: How long each stage took
- **Spare request correlation**: Which milestones triggered spare requests

### Data to Include in Archive JSON:
```json
{
  "milestones": [
    {
      "id": 123,
      "stage": "SUBMITTED_TO_SERVICE_CENTER",
      "status": "DONE",
      "order": 4,
      "description": "Controller submitted to service center",
      "startedAt": "2025-01-01T10:00:00Z",
      "completedAt": "2025-01-01T10:30:00Z",
      "eta": "2025-01-01T12:00:00Z",
      "slaDueAt": "2025-01-02T10:00:00Z",
      "photoRequired": true,
      "notes": "Controller received in good condition",
      "changedBy": {
        "id": 5,
        "name": "John Doe",
        "phone": "1234567890",
        "role": "SERVICE_CENTER_TECHNICIAN"
      },
      "attachments": [
        {
          "id": 456,
          "fileName": "controller-receipt.jpg",
          "fileType": "image/jpeg",
          "fileSize": 245678,
          "fileUrl": "/uploads/TKT-2026-014/milestones/controller-receipt.jpg",
          "createdAt": "2025-01-01T10:30:00Z"
        }
      ]
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Update Archive Function
**File**: `server/service/tickets.js` → `archiveTicketData()`

Add milestone fetching to the archive query:
```javascript
const ticketData = await prisma.ticket.findUnique({
  where: { id: ticketId },
  include: {
    messages: { /* existing */ },
    notifications: { /* existing */ },
    ticketMilestones: {
      include: {
        changer: {
          select: {
            id: true,
            name: true,
            phone: true,
            role: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        order: 'asc',
      },
    },
  },
});
```

Add milestones to archive data structure:
```javascript
const archiveData = {
  archivedAt: new Date().toISOString(),
  ticketId: ticketData.id,
  ticketCode: ticketData.ticketCode,
  messages: [ /* existing */ ],
  notifications: [ /* existing */ ],
  milestones: ticketData.ticketMilestones.map((milestone) => ({
    id: milestone.id,
    stage: milestone.stage,
    status: milestone.status,
    order: milestone.order,
    description: milestone.description,
    allowedRoles: milestone.allowedRoles,
    startedAt: milestone.startedAt,
    completedAt: milestone.completedAt,
    eta: milestone.eta,
    slaDueAt: milestone.slaDueAt,
    photoRequired: milestone.photoRequired,
    notes: milestone.notes,
    createdAt: milestone.createdAt,
    updatedAt: milestone.updatedAt,
    changedBy: milestone.changer,
    attachments: milestone.attachments.map((att) => ({
      id: att.id,
      fileName: att.fileName,
      fileType: att.fileType,
      fileSize: att.fileSize,
      fileUrl: att.fileUrl,
      createdAt: att.createdAt,
    })),
  })),
};
```

### Phase 2: Delete Milestone Records After Archiving

After saving the JSON and updating the ticket, delete:
```javascript
// Delete milestone attachments first (foreign key constraint)
const milestoneIds = ticketData.ticketMilestones.map(m => m.id);
if (milestoneIds.length > 0) {
  await prisma.attachments.deleteMany({
    where: {
      milestoneId: { in: milestoneIds },
    },
  });
}

// Delete all milestones for the ticket
await prisma.ticketMilestone.deleteMany({
  where: { ticketId: ticketId },
});
```

### Phase 3: Update getTicketById() to Return Archived Milestones

When ticket is CLOSED and has backupjson, include milestones:
```javascript
return {
  ...basicTicket,
  messages: archivedData.messages || [],
  notifications: archivedData.notifications || [],
  ticketMilestones: archivedData.milestones || [],  // ADD THIS
  isArchived: true,
  archivedAt: archivedData.archivedAt,
};
```

### Phase 4: Update Milestone Service

**File**: `server/service/milestones.js` → `getTicketMilestones()`

Check if ticket is archived before querying:
```javascript
const getTicketMilestones = async (ticketId) => {
  // Check if ticket is archived
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      status: true,
      backupjson: true,
    },
  });

  // If archived, return milestones from JSON
  if (ticket && ticket.status === "CLOSED" && ticket.backupjson) {
    try {
      const archivedData = JSON.parse(ticket.backupjson);
      return archivedData.milestones || [];
    } catch (parseError) {
      console.error("Error parsing archived milestones:", parseError);
      // Fall through to database query
    }
  }

  // For non-archived tickets, fetch from database
  return await prisma.ticketMilestone.findMany({
    where: { ticketId },
    include: {
      changer: {
        select: { id: true, name: true, role: true },
      },
      attachments: true,
    },
    orderBy: { order: 'asc' },
  });
};
```

### Phase 5: Client-Side Handling

**No changes needed!** The client already:
- Fetches milestones via API which will now return archived data
- Displays milestone timeline from ticket data
- Shows photos and attachments from milestone data

The MilestoneTimeline component should automatically work with archived data.

### Phase 6: Prevent Milestone Updates on Archived Tickets

Add validation in milestone controllers:
```javascript
// In updateMilestone, transitionMilestone, etc.
const ticket = await prisma.ticket.findUnique({
  where: { id: ticketId },
  select: { status: true, isArchived: true },
});

if (ticket.status === 'CLOSED' || ticket.isArchived) {
  return res.status(400).json({ 
    error: 'Cannot update milestones on closed/archived tickets' 
  });
}
```

---

## Testing Checklist

- [ ] Archive ticket with milestones
- [ ] Verify milestone data in backupjson
- [ ] Verify milestone records deleted from database
- [ ] Verify milestone attachments deleted
- [ ] View archived ticket - check milestone timeline displays correctly
- [ ] Download archive JSON - verify milestones included
- [ ] Try to update milestone on archived ticket - should fail
- [ ] Try to transition milestone on archived ticket - should fail
- [ ] Check socket events don't fire for archived milestones

---

## Risk Assessment

### High Impact:
- Milestones are essential for workflow tracking
- Deleting without proper archiving would lose critical audit trail
- Photos attached to milestones are evidence of work completed

### Medium Risk:
- Complex relations: Milestone → Attachments → Files on disk
- Multiple services depend on milestone data (tickets, spare requests)
- Real-time socket events need to be handled

### Mitigation:
- Thorough testing before production deployment
- Ensure JSON structure preserves all milestone data
- Keep file attachments on disk (don't delete files, just records)
- Add validation to prevent updates on archived tickets

---

## Summary

**YES, TicketMilestone is definitely a "junk" that must be archived!**

It's actually one of the MOST IMPORTANT pieces to archive because:
1. Contains the complete workflow history
2. Has photo attachments as proof of work
3. Tracks who did what and when (audit trail)
4. Critical for performance analysis and reporting

The implementation should follow the same pattern as messages and notifications:
1. Fetch all milestone data with relations
2. Store in JSON with complete structure
3. Delete database records after archiving
4. Return archived data when ticket is viewed
5. Prevent updates to archived milestones
