# Topbar Components

This folder contains the individual components that make up the Topbar navigation.

## Components

### `NotificationBell.jsx`
- Handles real-time notifications display
- Manages socket connections for live updates
- Handles notification interactions and navigation
- Features unread count badge and dropdown list

### `UserMenu.jsx`
- User profile dropdown menu
- Logout functionality
- Account settings and preferences navigation
- User avatar and basic info display

### `LogoSection.jsx`
- Company logo and branding
- Sidebar toggle functionality
- Responsive logo display based on sidebar state

### `index.js`
- Barrel export file for all components
- Simplifies imports in the main Topbar component

## Usage

```jsx
import { NotificationBell, UserMenu, LogoSection } from './components';

// Or import individually
import NotificationBell from './components/NotificationBell';
```

## Structure Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Maintainability**: Easier to modify individual features
3. **Reusability**: Components can be reused in other parts of the application
4. **Testing**: Each component can be tested independently
5. **Performance**: Better code splitting and lazy loading opportunities