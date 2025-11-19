import {
  LayoutDashboard,
  Settings,
  FileText,
  Monitor,
  Network,
  UsersRound,
  CircleUserRound,
} from 'lucide-react';

import Dashboard from '../../pages/dashboard/dashboard';
import UsersPage from '../../pages/users/users';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../../pages/login/login';
import Signup from '../../pages/signup/signup';
import NotFound from '../../pages/NotFound';
import ProtectedRoute from '../../components/ProtectedRoute';
import Layout from '../../components/layout/layout';
import TicketForm from '../../pages/tickets/components/ticketForm';
import ServiceCenters from '../../pages/serviceCenters/serviceCenters';
import { Tickets, TicketDashboard, SpareRequest, Inventory } from '../../pages';
import Products from '../../pages/products/products';
import OrganisationPage from '../../pages/organisation/organisation';
import ProfilePage from '../../pages/profile/Profile';
import SettingsPage from '../../pages/settings';
import Projects from '../../pages/projects/projects';

const BASE_ITEMS = {
  dashboard: {
    path: '/dashboard',
    icon: Monitor,
    label: 'dashboard',
    category: 'main',
    element: <Dashboard />,
  },
  tickets: {
    path: '/tickets',
    icon: Monitor,
    label: 'Tickets',
    category: 'main',
    element: <Tickets />,
  },
  ticketDetails: {
    path: '/tickets/:ticketId',
    icon: Monitor,
    label: 'ticket Details',
    hidden: true,
    category: 'main',
    element: <TicketDashboard />,
  },
  ticketNew: {
    path: '/tickets/new',
    icon: Monitor,
    label: 'New Ticket',
    hidden: true,
    category: 'main',
    element: <TicketForm />,
  },
  users: {
    path: '/users',
    icon: UsersRound,
    label: 'Users',
    category: 'management',
    element: <UsersPage />,
  },
  serviceCenter: {
    path: '/service-center',
    icon: Network,
    label: 'Service Center',
    category: 'technical',
    element: <ServiceCenters />,
  },
  spareRequest: {
    path: '/spare-request',
    icon: Settings,
    label: 'Spare Request',
    category: 'management',
    element: <SpareRequest />,
  },
  inventory: {
    path: '/inventory',
    icon: FileText,
    label: 'Inventory',
    category: 'main',
    element: <Inventory />,
  },
  products: {
    path: '/products',
    icon: FileText,
    label: 'Products',
    category: 'main',
    element: <Products />,
  },
  settings: {
    path: '/settings',
    icon: Settings,
    label: 'Settings',
    category: 'management',
    element: <SettingsPage />,
  },
  organisation: {
    path: '/customers',
    icon: UsersRound,
    label: 'Customers',
    category: 'management',
    element: <OrganisationPage />,
  },
  profile: {
    path: '/profile',
    icon: CircleUserRound,
    label: 'Profile',
    category: 'management',
    element: <ProfilePage />,
    hidden: true
  },
  project:{
    path: '/projects',
    icon: UsersRound,
    label: 'Projects',
    category: 'management',
    element: <Projects />,
  }
};

const ROLE_ITEMS = {
  MACSOFT_ADMIN: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.spareRequest,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.organisation,
    BASE_ITEMS.project,
    BASE_ITEMS.serviceCenter,
    BASE_ITEMS.users,
    BASE_ITEMS.products,
    BASE_ITEMS.inventory,
    BASE_ITEMS.settings,
    BASE_ITEMS.profile,
  ],
  MACSOFT_HEAD: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.spareRequest,
    BASE_ITEMS.products,
    BASE_ITEMS.serviceCenter, 
    BASE_ITEMS.profile,
  ],
  MACSOFT_SUPPORT: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.spareRequest,
    BASE_ITEMS.products,
    BASE_ITEMS.serviceCenter,
    BASE_ITEMS.profile,
  ],
  CUSTOMER_SERVICE_HEAD: [
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.inventory, 
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.spareRequest,
    BASE_ITEMS.profile,
  ],
  SERVICE_CENTER_TECHNICIAN: [ 
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.spareRequest,
    BASE_ITEMS.profile,
  ],
  CUSTOMER_FIELD_ENGINEER: [
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.profile,
  ],
};

export const switchMenuItems = (role) => (ROLE_ITEMS[role] || ROLE_ITEMS.CUSTOMER_FIELD_ENGINEER).filter(item => item && item.path);


// Define role-based access for specific routes
const getRouteProtection = (item, role) => {
  const routeProtections = {
    '/users': ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'CUSTOMER_SERVICE_HEAD'],
    '/service-center': ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT', 'CUSTOMER_SERVICE_HEAD'],
    '/inventory': ['MACSOFT_ADMIN', 'MACSOFT_HEAD'],
    '/settings': ['MACSOFT_ADMIN'], // Only MACSOFT_ADMIN can access settings
  };

  const requiredRoles = routeProtections[item.path];
  if (requiredRoles) {
    return <ProtectedRoute requiredRoles={requiredRoles}>{item.element}</ProtectedRoute>;
  }

  return <ProtectedRoute>{item.element}</ProtectedRoute>;
};

export const switchRoutes = (role) =>
  createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/signup', element: <Signup /> },
    {
      path: '/',
      errorElement: <NotFound />,
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      children: [
        // Add explicit index route that redirects to tickets
        { index: true, element: <Navigate to="/tickets" replace /> },
        ...(ROLE_ITEMS[role] || ROLE_ITEMS.CUSTOMER_FIELD_ENGINEER)
          .filter(item => item && item.path && item.path !== '/') // Filter out root path
          .map((item) => ({
            path: item.path.replace(/^\//, ''),
            element: getRouteProtection(item, role),
          })),
      ],
    },
  ]);
