import {
  LayoutDashboard,
  Settings,
  FileText,
  Monitor,
  Network,
  UsersRound,
  CircleUserRound,
  Package,
  Boxes,
  NotebookText,
  FilePlus,
  Ticket,
  Truck,
  Building2,
  FolderKanban,
  Wrench,
  ClipboardList,
  Building,
  ScanLine,
  PackageSearch
} from 'lucide-react';

import Dashboard from '../../pages/dashboard/dashboard';
import UsersPage from '../../pages/users/users';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../../pages/login/login';
import Signup from '../../pages/signup/signup';
import ForgotPassword from '../../pages/forgot-password/ForgotPassword';
import NotFound from '../../pages/NotFound';
import ProtectedRoute from '../../components/ProtectedRoute';
import Layout from '../../components/layout/layout';
import TicketForm from '../../pages/tickets/components/ticketForm';
import ServiceCenters from '../../pages/serviceCenters/serviceCenters';
import { Tickets, TicketDashboard, SpareRequest, SpareRequestApproval, Inventory, ReceiveController } from '../../pages';
import Products from '../../pages/products/products';
import OrganisationPage from '../../pages/organisation/organisation';
import ProfilePage from '../../pages/profile/Profile';
import SettingsPage from '../../pages/settings';
import Projects from '../../pages/projects/projects';
import DeliveryPage from '../../pages/delivery/DeliveryPage';


const BASE_ITEMS = {
  dashboard: {
    path: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    category: 'main',
    element: <Dashboard />,
  },

  tickets: {
    path: '/tickets',
    icon: Ticket,
    label: 'Tickets',
    category: 'main',
    element: <Tickets />,
  },

  ticketDetails: {
    path: '/tickets/:ticketId',
    icon: NotebookText,
    label: 'Ticket Details',
    hidden: true,
    category: 'main',
    element: <TicketDashboard />,
  },

  ticketNew: {
    path: '/tickets/new',
    icon: FilePlus,
    label: 'New Ticket',
    hidden: true,
    category: 'main',
    element: <TicketForm />,
  },

  receiveController: {
    path: '/receive-controller',
    icon: ScanLine,
    label: 'Receive Controller',
    category: 'technical',
    element: <ReceiveController />,
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
    icon: Building2,
    label: 'Service Center',
    category: 'technical',
    element: <ServiceCenters />,
  },

  spareRequest: {
    path: '/spare-request',
    icon: Wrench,
    label: 'Spare Request',
    category: 'management',
    element: <SpareRequest />,
  },

  spareRequestApproval: {
    path: '/spare-request-approval',
    icon: ClipboardList,
    label: 'Spare Approval',
    category: 'management',
    element: <SpareRequestApproval />,
  },

  inventory: {
    path: '/inventory',
    icon: Boxes,
    label: 'Inventory',
    category: 'main',
    element: <Inventory />,
  },

  products: {
    path: '/products',
    icon: PackageSearch,
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
    icon: Building,
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
    hidden: true,
  },

  project: {
    path: '/projects',
    icon: FolderKanban,
    label: 'Projects',
    category: 'management',
    element: <Projects />,
  },

  deliver: {
    path: '/deliver',
    icon: Truck,
    label: 'Deliver',
    category: 'technical',
    element: <DeliveryPage />,
  },
};

const ROLE_ITEMS = {
  MACSOFT_ADMIN: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.spareRequestApproval,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.receiveController,
    BASE_ITEMS.organisation,
    BASE_ITEMS.project,
    BASE_ITEMS.serviceCenter,
    BASE_ITEMS.users,
    BASE_ITEMS.products,
    BASE_ITEMS.inventory,
    BASE_ITEMS.settings,
    BASE_ITEMS.profile,
    BASE_ITEMS.deliver,
  ],
  MACSOFT_HEAD: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.receiveController,
    BASE_ITEMS.spareRequestApproval,
    BASE_ITEMS.products,
    BASE_ITEMS.serviceCenter,
    BASE_ITEMS.profile,
    BASE_ITEMS.deliver,

  ],
  MACSOFT_SUPPORT: [
    BASE_ITEMS.dashboard,
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.receiveController,
    BASE_ITEMS.products,
    BASE_ITEMS.serviceCenter,
    BASE_ITEMS.profile,
    BASE_ITEMS.deliver,

  ],
  CUSTOMER_SERVICE_HEAD: [
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.inventory,
    BASE_ITEMS.receiveController,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.profile,

  ],
  SERVICE_CENTER_TECHNICIAN: [
    BASE_ITEMS.tickets,
    BASE_ITEMS.ticketDetails,
    BASE_ITEMS.receiveController,
    BASE_ITEMS.ticketNew,
    BASE_ITEMS.profile,
    BASE_ITEMS.deliver,
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
    '/spare-request-approval': ['MACSOFT_ADMIN', 'MACSOFT_HEAD'], // Only these roles can approve spare requests
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
    { path: '/forgot-password', element: <ForgotPassword /> },
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
