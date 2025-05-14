# Workflow Documentation

## Overview
This document outlines the workflow for the ticketing system, including user roles, ticket management, notifications, and reporting.

---

## User Roles
1. **Technical User**: Responsible for managing tickets, responding to messages, and closing tickets with appropriate tags.
2. **Admin**: Manages user roles, configures working hours, sets holidays, and oversees ticketing operations.
3. user  - like custmoer care
---

## Ticket Management Workflow
1. **Ticket Creation**:
   - Users can create tickets via the homepage.
   - IMEI number and HP motortype details are fetched from LMS and displayed as non-editable fields.
   - Status dropdown is hidden for "user" role during ticket creation.

2. **Ticket Updates**:
   - Display the username of the last updater in the conversation popup.
   - Show images and audio files in the conversation view.
   - Track first response time using a socket server and display it on the ticket card.

3. **Ticket Closure**:
   - Technical users can map closure reasons using tags.
   - Tags can be created and managed by technical users.
   - Maintain a table to track tickets closed due to inactivity or by an admin.

---

## Notifications
1. **Audio Alerts**:
   - Triggered only for technical users when a message is not responded to within a threshold.
   - Alerts stop once the message is responded to.

2. **Auto-Responses**:
   - Sent for messages received outside working hours or on holidays.
   - Working hours: 9:32 AM to 1:00 PM, 2:00 PM to 5:30 PM (Monday to Saturday).
   - Holidays can be set manually by admins.

---

## Reporting
1. **Daily Reports**:
   - Sent to admins via WhatsApp, including user ticket counts and first response times.

2. **End-of-Day Summary**:
   - Includes tickets created, tickets not responded to, average first response time, tickets closed by users, tickets automatically closed, and WhatsApp notifications sent.

3. **Dashboard**:
   - Displays statistics for the past 7 days, including state-wise HP and type-based ticket statistics.
   - Provides month-to-date (MTD) statistics.

---

## Additional Features
1. **Calendar Management**:
   - Maintain a calendar for working hours and holidays.
   - Calculate first response time based on working hours.

2. **User Interface Enhancements**:
   - Add a "Create Ticket" button on the homepage.
   - Display IMEI number and first response time on ticket cards.

---

## Technical Details
1. **Backend**:
   - APIs for ticket management, notifications, and reporting are implemented in the `backend/controllers` directory.
   - Role-based access control is enforced using middleware in `backend/middlewares`.

2. **Frontend**:
   - User interface components are located in `frontend/src/components`.
   - Dashboard and ticket-related views are implemented in `Dashboard.jsx`.

3. **Database**:
   - Schema updates include tables for tracking closed tickets, tags, and holidays.

---

## Future Enhancements
1. Implement advanced analytics for ticket trends.
2. Add multi-language support for notifications and reports.
3. Integrate with third-party tools for enhanced reporting.