/* import moment from "moment";
 */
import { Ticket, Users2, Combine, BoxIcon, Settings, PackagePlus, Boxes, Package2, LayoutDashboard } from "lucide-react";

export const initialState = {
  ticket: {
    tickets: [],
    currentTicket: null,
    deviceDetails: null,
    searchResults: [],
    searching: false,
    loading: false,
    statusCount: {},
    error: null,
    filters: {
      status: "",
      stage: "",
      priority: "all",
      category: "all",
      search: "",
    },
    currentPage: 0,
    totalPages: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  },
};

export const dashboardState = {
  dashboard: {
    totalDevices: 0,
    onlineDevices: 0,
    faultDevices: 0,
    offlineDevices: 0,
    activeManufacturers: 0,
    todaysComplaints: 0,
    deviceLocations: [],
    recentActivity: [],
  },
  lastUpdated: null,
  loading: false,
  error: null,
};

export const mappingsState = {
  mappings: [],
  mapping: null,
  mappingId: null,
  mode: "",
  filter: {
    search: "",
    status: "",
    manufacturer: "",
  },
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
  upload: {
    inProgress: false,
    progress: 0,
    currentBatch: null,
    totalBatches: null,
    error: null,
    success: false,
  },
};

export const usersState = {
  users: [],
  user: null,
  filter: {
    search: "",
    status: "",
    role: "",
  },
  mode: null, // null | 'create' | 'edit' | 'delete' | 'upload'
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
};

export const notificationsState = {
  notifications: [],
  notification: null,
  counts: {
    all: 0,
    unread: 0,
    discussable: 0,
    priority: 0,
  },
  unreadCount: 0,
  totalCount: 0,
  currentFilter: "all",
  filter: {
    search: "",
    status: "",
    role: "",
    fromDate: "",
    toDate: "",
  },
  mode: {
    create: false,
    edit: false,
    view: false,
    confirmDelete: false,
  },
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
};

export const dateF = (date) => {
  return moment(date).format("DD/MM/YYYY HH:mm:ss");
};

export const menu = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Tickets", path: "/tickets", icon: Ticket },
  { name: "Users", path: "/users", icon: Users2 },
  { name: "Service Center", path: "/service-center", icon: Combine },
  { name: "Spare Request", path: "/spare-request", icon: PackagePlus },
  { name: "Inventory", path: "/inventory", icon: Boxes },
  { name: "Products", path: "/products", icon: Package2 },
];

export const organisationsState = {
  organisations: [],
  organisation: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  mode: null, // null | 'create' | 'edit' | 'delete' | 'upload'
  filter: {
    search: "",
    status: "",
  },
  statusCounts: {
    ALL: 0,
    ACTIVE: 0,
    INACTIVE: 0,
  },
};
export const projectsState = {
  projects: [],
  project: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  statusCount: { ALL: 0, ACTIVE: 0, INACTIVE: 0 },
  mode: null, // null | 'create' | 'edit' | 'delete' | 'upload'
  filter: {
    search: "",
    status: "",
  },
};

export const productsState = {
  products: [],
  product: null,
  filter: {
    search: "",
    status: "",
  },
  mode: null, // null | 'create' | 'edit' | 'delete' | 'upload'
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
};

export const templatesState = {
  templates: [],
  template: null,
  filter: {
    search: "",
    customerId: "",
    status: "",
  },
  mode: {} ,
  totalPages: 0,
  currentPage: 0,
  loading: false,
  error: null,
};