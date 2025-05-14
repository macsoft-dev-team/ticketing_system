# Prisma Schema Documentation

## Overview
This document provides an overview of the Prisma schema for the ticketing system, including the relationships between models.

---

## Models and Relationships

### User
Represents a user in the system.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  role      String   // "Technical User" or "Admin"
  tickets   Ticket[] // Relationship: A user can create multiple tickets
}
```

### Ticket
Represents a ticket created in the system.

```prisma
model Ticket {
  id              Int       @id @default(autoincrement())
  title           String
  description     String
  status          String    // e.g., "Open", "Closed"
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  createdBy       Int
  user            User      @relation(fields: [createdBy], references: [id]) // Relationship: A ticket is created by a user
  closureReasons  Tag[]     // Relationship: A ticket can have multiple closure reasons (tags)
}
```

### Tag
Represents a tag used for mapping closure reasons.

```prisma
model Tag {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  tickets  Ticket[]  @relation(references: [id]) // Relationship: A tag can be associated with multiple tickets
}
```

### Conversation
Represents a conversation related to a ticket.

```prisma
model Conversation {
  id          Int       @id @default(autoincrement())
  message     String
  createdAt   DateTime  @default(now())
  ticketId    Int
  ticket      Ticket    @relation(fields: [ticketId], references: [id]) // Relationship: A conversation belongs to a ticket
  updatedBy   Int
  user        User      @relation(fields: [updatedBy], references: [id]) // Relationship: A conversation is updated by a user
}
```

### Holiday
Represents holidays for auto-responses and working hours.

```prisma
model Holiday {
  id        Int       @id @default(autoincrement())
  date      DateTime  @unique
  reason    String
}
```

---

## Relationships Summary
1. **User ↔ Ticket**: One-to-Many relationship. A user can create multiple tickets.
2. **Ticket ↔ Tag**: Many-to-Many relationship. A ticket can have multiple tags, and a tag can be associated with multiple tickets.
3. **Ticket ↔ Conversation**: One-to-Many relationship. A ticket can have multiple conversations.
4. **User ↔ Conversation**: One-to-Many relationship. A user can update multiple conversations.

---

## Future Enhancements
1. Add a model for notifications to track audio alerts and auto-responses.
2. Include a model for reporting to store daily and monthly statistics.
3. Extend the schema to support multi-language tags and notifications.