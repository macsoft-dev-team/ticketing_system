# Receive Controller at Service Center

## Overview
This feature provides a dedicated page for service center staff to quickly receive controllers without having to search through tickets. It's optimized for high-volume reception scenarios where 10+ controllers need to be received daily.

## Features

### Quick Search
- **Scan or enter controller serial number** - Supports barcode scanning and manual entry
- **Instant ticket lookup** - Finds ticket by controller number immediately
- **Ticket information display** - Shows ticket code, customer name, description, and current status

### Mandatory Photo Upload
- **4 required photos** for RECEIVED_AT_SERVICE_CENTER milestone:
  1. Controller Front
  2. Controller Bottom
  3. Full View Open
  4. MCB Close Up
- Photo labeling system for organization
- Visual preview of uploaded photos
- Individual photo removal capability

### Optional Attachments
- **Video upload** - Capture video documentation (optional)
- **Voice recording** - Record audio notes directly in the browser (optional)
- Support for multiple videos
- Browser-based audio recording with start/stop controls

## User Roles with Access
- `MACSOFT_ADMIN`
- `MACSOFT_HEAD`
- `MACSOFT_SUPPORT`
- `CUSTOMER_SERVICE_HEAD`
- `SERVICE_CENTER_TECHNICIAN`

## Technical Implementation

### Backend Endpoints

#### Search Ticket by Controller Number
```
GET /api/tickets/search/controller/:controllerNo
Authorization: Bearer {token}
```
**Response:**
```json
{
  "id": 123,
  "ticketCode": "TKT-2024-001",
  "controllerNo": "CTRL-12345",
  "customerName": "John Doe",
  "description": "Controller malfunction",
  "status": "OPEN",
  ...
}
```

#### Receive Controller
```
POST /api/milestones/receive-controller
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- controllerNo: string (required)
- photos: File[] (required, min 4)
- videos: File[] (optional)
- audio: File (optional)
```

**Response:**
```json
{
  "message": "Controller received at service center successfully",
  "ticket": {
    "id": 123,
    "ticketCode": "TKT-2024-001",
    "controllerNo": "CTRL-12345",
    "status": "IN_PROGRESS"
  },
  "milestone": {
    "id": 456,
    "stage": "RECEIVED_AT_SERVICE_CENTER",
    "status": "IN_PROGRESS",
    ...
  }
}
```

### Frontend Component
**Location:** `client/src/pages/receiveController/ReceiveController.jsx`

**Key Features:**
- Real-time controller search
- Image preview and management
- Audio recording with MediaRecorder API
- Video file handling
- Form validation
- Toast notifications for user feedback
- Clean form reset after successful submission

### File Upload Handling
- Files are initially uploaded to a `temp` directory
- Backend moves files to proper location: `uploads/{ticketCode}/milestones/`
- Supports images (JPEG, PNG, GIF), videos (MP4, MOV, AVI, WEBM), and audio (MP3, WAV, OGG)
- Maximum file size: 10MB per file
- Maximum 10 files per submission

### Validation
- **Controller number** must be provided
- **Ticket must exist** with the given controller number
- **Role-based access** - Only authorized roles can receive controllers
- **Service center assignment** - Technicians can only receive controllers assigned to their center
- **Minimum 4 photos** required (as per RECEIVED_AT_SERVICE_CENTER milestone configuration)

## Workflow

1. **Service center staff opens** "Receive Controller" page
2. **Scan or enter** controller serial number
3. **System searches** for ticket with matching controller number
4. **Ticket information displays** if found
5. **Upload 4 mandatory photos** with appropriate labels
6. **Optionally add** videos or voice notes
7. **Click "Receive Controller"** to submit
8. **System transitions** milestone to RECEIVED_AT_SERVICE_CENTER
9. **Ticket status updates** to IN_PROGRESS
10. **Notifications sent** to relevant stakeholders
11. **Form resets** for next controller

## Error Handling

### Common Errors
- **"No ticket found with this controller number"** - Invalid or non-existent controller number
- **"Photos are mandatory"** - Less than 4 photos uploaded
- **"Access denied"** - User doesn't have permission or ticket not assigned to their service center
- **"This ticket is not assigned to your service center"** - Service center mismatch

### File Upload Errors
- **"Invalid file type"** - Unsupported file format
- **"File size too large"** - File exceeds 10MB limit
- **"Could not access microphone"** - Audio recording permission denied

## Navigation
The page is accessible from the main navigation menu for authorized roles under "Receive Controller".

## Mobile Responsiveness
- Responsive grid layout for photos (2 columns on mobile, 4 on desktop)
- Touch-friendly controls
- Camera access for mobile photo capture
- Voice recording support on mobile devices

## Performance Considerations
- Object URLs are properly cleaned up to prevent memory leaks
- File uploads are processed efficiently with FormData
- Async file operations with proper error handling
- Loading states during search and submission

## Future Enhancements
- Barcode scanner integration for faster input
- Batch processing for multiple controllers
- QR code generation for controller tracking
- Photo comparison with original ticket photos
- OCR for automatic controller number extraction from photos
