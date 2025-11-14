export const TICKET_STATUS = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  CLOSED: "CLOSED",
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const TICKET_CATEGORIES = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  MAINTENANCE: 'Maintenance',
  INSTALLATION: 'Installation',
  TROUBLESHOOTING: 'Troubleshooting'
};

export const USER_ROLES = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  USER: 'user'
};

export const STATUS_COLORS = {
  [TICKET_STATUS.OPEN]: '!bg-red-100 !text-red-800 border-red-200',
  [TICKET_STATUS.IN_PROGRESS]: '!bg-yellow-100 !text-yellow-800 border-yellow-200',
  [TICKET_STATUS.CLOSED]: '!bg-green-100 !text-green-800 border-green-200'
};

export const PRIORITY_COLORS = {
  [TICKET_PRIORITY.LOW]: '!bg-blue-100 !text-blue-800 border-blue-200',
  [TICKET_PRIORITY.MEDIUM]: '!bg-orange-100 !text-orange-800 border-orange-200',
  [TICKET_PRIORITY.HIGH]: 'bg-red-100 text-red-800 border-red-200'
};

 