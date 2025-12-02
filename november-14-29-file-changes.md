# File Changes Analysis: November 14-29, 2025

## Summary Statistics

- **Period**: November 14, 2025 to November 29, 2025
- **Total Commits**: 42 commits
- **Files Changed**: 445+ unique files

## Complete File Changes List

### CLIENT SIDE CHANGES

| File Path                                                             | Lines Added | Lines Deleted | Net Change | Type         |
| --------------------------------------------------------------------- | ----------- | ------------- | ---------- | ------------ |
| **client/src/components/**                                            |             |               |            |              |
| client/src/components/MilestoneTimeline.jsx                           | 376         | 258           | +118       | Component    |
| client/src/components/PhotoUploadModal.jsx                            | 137         | 24            | +113       | Component    |
| client/src/components/CommonHeader.jsx                                | 346         | 0             | +346       | Component    |
| client/src/components/receiveController/BatchManagerComponent.jsx     | 193         | 0             | +193       | Component    |
| client/src/components/receiveController/MediaCaptureComponent.jsx     | 351         | 0             | +351       | Component    |
| client/src/components/receiveController/TicketSearchComponent.jsx     | 155         | 0             | +155       | Component    |
| client/src/components/receiveController/CompletedBatchesComponent.jsx | 146         | 0             | +146       | Component    |
| client/src/components/receiveController/ImageViewerComponent.jsx      | 131         | 0             | +131       | Component    |
| client/src/components/receiveController/ScannerComponent.jsx          | 98          | 0             | +98        | Component    |
| client/src/components/UserFormModal.jsx                               | 204         | 39            | +165       | Component    |
| client/src/components/ui/multi-select.jsx                             | 424         | 0             | +424       | UI Component |
| client/src/components/ui/password-input.jsx                           | 46          | 0             | +46        | UI Component |
| client/src/components/ui/toast.jsx                                    | 17          | 6             | +11        | UI Component |
| client/src/components/ui/chat.jsx                                     | 47          | 57            | -10        | UI Component |
| client/src/components/ui/spareRequestForm.jsx                         | 9           | 23            | -14        | UI Component |
| client/src/components/ui/button.jsx                                   | 2           | 1             | +1         | UI Component |
| client/src/components/ui/card.jsx                                     | 3           | 3             | 0          | UI Component |
| client/src/components/ui/reusableTable.jsx                            | 4           | 4             | 0          | UI Component |
| client/src/components/ui/DocumentModal.jsx                            | 9           | 22            | -13        | UI Component |
| client/src/components/ui/NotificationBell.jsx                         | 4           | 12            | -8         | UI Component |
| client/src/components/ui/dropdown-menu.jsx                            | 3           | 6             | -3         | UI Component |
| client/src/components/ui/select.jsx                                   | 1           | 1             | 0          | UI Component |
| client/src/components/ProjectFormModal.jsx                            | 44          | 8             | +36        | Component    |
| client/src/components/OrganisationFormModal.jsx                       | 42          | 20            | +22        | Component    |
| client/src/components/MilestoneActionButton.jsx                       | 13          | 57            | -44        | Component    |
| client/src/components/layout/Sidebar.jsx                              | 2           | 5             | -3         | Layout       |
| client/src/components/layout/topbar/Topbar.jsx                        | 4           | 4             | 0          | Layout       |
| client/src/components/layout/topbar/components/NotificationBell.jsx   | 7           | 116           | -109       | Layout       |
| client/src/components/layout/topbar/components/UserMenu.jsx           | 2           | 6             | -4         | Layout       |
| client/src/components/layout/topbar/components/LogoSection.jsx        | 1           | 1             | 0          | Layout       |
| **client/src/pages/**                                                 |             |               |            |              |
| client/src/pages/receiveController/ReceiveController.jsx              | 2759        | 775           | +1984      | Page         |
| client/src/pages/delivery/DeliveryPage.jsx                            | 1537        | 346           | +1191      | Page         |
| client/src/pages/signup/signup.jsx                                    | 577         | 474           | +103       | Page         |
| client/src/pages/tickets/components/ticketForm.jsx                    | 292         | 240           | +52        | Component    |
| client/src/pages/tickets/components/header.jsx                        | 167         | 185           | -18        | Component    |
| client/src/pages/tickets/components/ticketCard.jsx                    | 34          | 66            | -32        | Component    |
| client/src/pages/users/components/header.jsx                          | 192         | 43            | +149       | Component    |
| client/src/pages/users/users.jsx                                      | 47          | 27            | +20        | Page         |
| client/src/pages/projects/components/header.jsx                       | 86          | 32            | +54        | Component    |
| client/src/pages/projects/projects.jsx                                | 47          | 42            | +5         | Page         |
| client/src/pages/organisation/components/header.jsx                   | 17          | 11            | +6         | Component    |
| client/src/pages/organisation/organisation.jsx                        | 69          | 44            | +25        | Page         |
| client/src/pages/ticket/TicketDashboard.jsx                           | 23          | 42            | -19        | Page         |
| client/src/pages/spareRequest/spareRequest.jsx                        | 90          | 16            | +74        | Page         |
| client/src/pages/spareRequest/spareReqForm.jsx                        | 4           | 6             | -2         | Page         |
| client/src/pages/products/products.jsx                                | 25          | 18            | +7         | Page         |
| client/src/pages/inventory/inventory.jsx                              | 9           | 10            | -1         | Page         |
| client/src/pages/serviceCenters/serviceCenters.jsx                    | 60          | 20            | +40        | Page         |
| client/src/pages/login/login.jsx                                      | 1           | 19            | -18        | Page         |
| **client/src/lib/**                                                   |             |               |            |              |
| client/src/lib/hooks/SoundManager.jsx                                 | 131         | 0             | +131       | Hook         |
| client/src/lib/hooks/useBatch.js                                      | 265         | 5             | +260       | Hook         |
| client/src/lib/hooks/useConversation.js                               | 150         | 159           | -9         | Hook         |
| client/src/lib/hooks/useTickets.js                                    | 10          | 0             | +10        | Hook         |
| client/src/lib/hooks/useProject.js                                    | 24          | 1             | +23        | Hook         |
| client/src/lib/hooks/useServiceCenter.js                              | 5           | 0             | +5         | Hook         |
| client/src/lib/hooks/useUser.js                                       | 12          | 2             | +10        | Hook         |
| client/src/lib/hooks/useOrganisation.js                               | 2           | 1             | +1         | Hook         |
| client/src/lib/hooks/useNotifications.js                              | 1           | 2             | -1         | Hook         |
| client/src/lib/features/tickets.js                                    | 81          | 26            | +55        | Feature      |
| client/src/lib/features/organisations.js                              | 52          | 38            | +14        | Feature      |
| client/src/lib/features/projects.js                                   | 18          | 12            | +6         | Feature      |
| client/src/lib/features/serviceCenters.js                             | 20          | 5             | +15        | Feature      |
| client/src/lib/features/authSlice.js                                  | 2           | 4             | -2         | Feature      |
| client/src/lib/features/notifications.js                              | 3           | 7             | -4         | Feature      |
| client/src/lib/services/api.js                                        | 42          | 7             | +35        | Service      |
| client/src/lib/services/socketService.js                              | 9           | 22            | -13        | Service      |
| client/src/lib/services/notificationSocketMiddleware.js               | 19          | 0             | +19        | Service      |
| client/src/lib/services/apiInterceptor.js                             | 1           | 13            | -12        | Service      |
| client/src/lib/constants/routes.jsx                                   | 72          | 18            | +54        | Config       |
| client/src/lib/constants/variables.js                                 | 10          | 2             | +8         | Config       |
| client/src/lib/constants/api.js                                       | 3           | 2             | +1         | Config       |
| client/src/lib/contexts/AuthContext.jsx                               | 0           | 75            | -75        | Context      |
| client/src/lib/contexts/SocketContext.jsx                             | 2           | 5             | -3         | Context      |
| client/src/lib/socket/socket.js                                       | 12          | 0             | +12        | Socket       |
| client/src/lib/store/index.js                                         | 6           | 1             | +5         | Store        |
| **client/src/utils/**                                                 |             |               |            |              |
| client/src/utils/debounce.js                                          | 52          | 0             | +52        | Utility      |
| client/src/utils/states.js                                            | 43          | 0             | +43        | Utility      |
| **client/src/**                                                       |             |               |            |              |
| client/src/App.jsx                                                    | 15          | 13            | +2         | App          |
| client/src/App.css                                                    | 39          | 2             | +37        | Style        |

### SERVER SIDE CHANGES

| File Path                                                             | Lines Added | Lines Deleted | Net Change | Type       |
| --------------------------------------------------------------------- | ----------- | ------------- | ---------- | ---------- |
| **server/controller/**                                                |             |               |            |            |
| server/controller/batch.js                                            | 168         | 14            | +154       | Controller |
| server/controller/tickets.js                                          | 179         | 32            | +147       | Controller |
| server/controller/milestones.js                                       | 156         | 160           | -4         | Controller |
| server/controller/organisations.js                                    | 120         | 0             | +120       | Controller |
| server/controller/projects.js                                         | 27          | 14            | +13        | Controller |
| server/controller/users.js                                            | 16          | 8             | +8         | Controller |
| server/controller/serviceCenter.js                                    | 32          | 13            | +19        | Controller |
| server/controller/spareRequests.js                                    | 19          | 12            | +7         | Controller |
| server/controller/notification.js                                     | 7           | 23            | -16        | Controller |
| **server/service/**                                                   |             |               |            |            |
| server/service/batch.js                                               | 359         | 14            | +345       | Service    |
| server/service/tickets.js                                             | 588         | 209           | +379       | Service    |
| server/service/organisations.js                                       | 167         | 2             | +165       | Service    |
| server/service/milestones.js                                          | 119         | 25            | +94        | Service    |
| server/service/users.js                                               | 96          | 33            | +63        | Service    |
| server/service/projects.js                                            | 69          | 39            | +30        | Service    |
| server/service/serviceCenter.js                                       | 85          | 55            | +30        | Service    |
| server/service/spareRequests.js                                       | 63          | 46            | +17        | Service    |
| server/service/conversation.js                                        | 71          | 49            | +22        | Service    |
| server/service/serviceCenterAssignment.js                             | 9           | 36            | -27        | Service    |
| server/service/notification.js                                        | 4           | 17            | -13        | Service    |
| server/service/universal-notifier.js                                  | 1           | 4             | -3         | Service    |
| **server/routes/**                                                    |             |               |            |            |
| server/routes/milestones.js                                           | 60          | 0             | +60        | Route      |
| server/routes/organisationWA.js                                       | 20          | 0             | +20        | Route      |
| server/routes/projectsWA.js                                           | 43          | 1             | +42        | Route      |
| server/routes/statesWA.js                                             | 34          | 0             | +34        | Route      |
| server/routes/batch.js                                                | 16          | 0             | +16        | Route      |
| server/routes/index.js                                                | 10          | 1             | +9         | Route      |
| server/routes/organisations.js                                        | 6           | 2             | +4         | Route      |
| server/routes/ticket.js                                               | 3           | 0             | +3         | Route      |
| server/routes/states.js                                               | 1           | 0             | +1         | Route      |
| server/routes/settings.js                                             | 1           | 4             | -3         | Route      |
| **server/prisma/**                                                    |             |               |            |            |
| server/prisma/schema.prisma                                           | 78          | 33            | +45        | Schema     |
| server/prisma/migrations/20251122095155_project_changes/migration.sql | 82          | 0             | +82        | Migration  |
| server/prisma/seeders/user.json                                       | 132         | 131           | +1         | Seed       |
| server/prisma/seeders/organisation.json                               | 25          | 27            | -2         | Seed       |
| server/prisma/seed.js                                                 | 1           | 2             | -1         | Seed       |
| **server/lib/**                                                       |             |               |            |            |
| server/lib/notificationUtils.js                                       | 1           | 4             | -3         | Utility    |
| server/lib/milestoneConfig.js                                         | 2           | 2             | 0          | Config     |
| **server/**                                                           |             |               |            |            |
| server/app.js                                                         | 52          | 37            | +15        | App        |
| server/middleware/register.js                                         | 7           | 2             | +5         | Middleware |

### CONFIGURATION & BUILD FILES

| File Path                | Lines Added | Lines Deleted | Net Change | Type    |
| ------------------------ | ----------- | ------------- | ---------- | ------- |
| client/package-lock.json | 7423        | 3217          | +4206      | Package |
| client/package.json      | 3           | 1             | +2         | Package |
| client/vite.config.js    | 200         | 156           | +44        | Config  |
| client/.env              | 18          | 18            | 0          | Config  |
| client/index.html        | 12          | 10            | +2         | Config  |
| .gitignore               | 3           | 0             | +3         | Config  |
| server/.gitignore        | 1           | 2             | -1         | Config  |

### DOCUMENTATION & ASSETS

| File Path                     | Lines Added | Lines Deleted | Net Change | Type          |
| ----------------------------- | ----------- | ------------- | ---------- | ------------- |
| RECEIVE_CONTROLLER_FEATURE.md | 163         | 0             | +163       | Documentation |
| tasks-2025-11-22.md           | 102         | 0             | +102       | Documentation |
| client/env.production         | 5           | 0             | +5         | Config        |

### DELETED FILES (Complete Removals)

**API Directory (Complete Removal)**

- api/\* - Complete directory removed (15,000+ lines)

**Backend Directory (Complete Removal)**

- backend/\* - Complete directory removed (3,500+ lines)

**Frontend Directory (Complete Removal)**

- frontend/\* - Complete directory removed (12,000+ lines)

**Asset Files Removed**

- Multiple icon files (PNG format)
- Audio files (MP3 format)
- Manifest files
- Various build artifacts

### GENERATED FILES (Prisma Client)

| File Path                                        | Lines Added | Lines Deleted | Net Change | Type      |
| ------------------------------------------------ | ----------- | ------------- | ---------- | --------- |
| server/prisma/generated/prisma/client/index.d.ts | 28,578      | 9,261         | +19,317    | Generated |
| server/prisma/generated/prisma/client/\*         | 1000+       | 500+          | +500+      | Generated |

## Key Insights

### Major Changes by Category:

1. **Component Development**: 2,800+ net lines added
2. **Page Development**: 2,200+ net lines added
3. **Service Layer**: 1,100+ net lines added
4. **Controller Layer**: 650+ net lines added
5. **Configuration**: 4,200+ net lines added (mostly package-lock)

### Top 10 Files by Net Change:

1. `server/prisma/generated/prisma/client/index.d.ts`: +19,317 lines
2. `client/package-lock.json`: +4,206 lines
3. `client/src/pages/receiveController/ReceiveController.jsx`: +1,984 lines
4. `client/src/pages/delivery/DeliveryPage.jsx`: +1,191 lines
5. `server/service/tickets.js`: +379 lines
6. `client/src/components/ui/multi-select.jsx`: +424 lines
7. `server/service/batch.js`: +345 lines
8. `client/src/components/CommonHeader.jsx`: +346 lines
9. `client/src/components/receiveController/MediaCaptureComponent.jsx`: +351 lines
10. `server/service/organisations.js`: +165 lines

### Development Focus Areas:

- **Receive Controller System**: Major new feature implementation
- **Batch Management**: Complete new functionality
- **Organization Management**: Enhanced capabilities
- **User Interface**: Significant component additions
- **Database Schema**: Multiple migrations and updates
- **Build System**: Package updates and configuration changes
