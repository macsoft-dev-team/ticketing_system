// src/middleware/notification.middleware.js
const { notifyCRUD } = require("../service/universal-notifier");

// --- METHOD → ACTION MAP ---
const METHOD_ACTION_MAP = {
  POST: "created",
  PUT: "updated",
  PATCH: "updated",
  DELETE: "deleted",
};

// --- ENTITY DETECTION MAP ---
// Adjust prefixes to match your API routes
const ENTITY_MAP = [
  { prefix: "/api/tickets", entity: "ticket" },
  { prefix: "/api/messages", entity: "message" },
  { prefix: "/api/attachments", entity: "attachment" },
  { prefix: "/api/spare-requests", entity: "spare_request" },
  { prefix: "/api/products", entity: "product" },
  { prefix: "/api/inventory", entity: "inventory" },
  { prefix: "/api/users", entity: "user" },
  { prefix: "/api/organisations", entity: "organisation" },
  { prefix: "/api/service-centers", entity: "service_center" },
];

// --- helper to find which entity the route belongs to ---
function getEntityType(baseUrl) {
  const found = ENTITY_MAP.find((e) => baseUrl.startsWith(e.prefix));
  return found ? found.entity : null;
}

/**
 * Notification Middleware
 * Detects CRUD actions automatically and fires notifyCRUD after success.
 */
function notificationMiddleware(ctx) {
  const { prisma, io } = ctx;

  return async (req, res, next) => {
    const entityType = getEntityType(req.baseUrl || "");
    const action = METHOD_ACTION_MAP[req.method];
    const actorId = req.user?.id || req.auth?.id || req.body.userId || null;

    // skip if not a CRUD-modifying route
    if (!entityType || !action) return next();

    // only notify after the response succeeds
    res.on("finish", async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          const entity = extractEntityData(req);
          await notifyCRUD(
            { prisma, io },
            {
              entityType,
              action,
              actorId,
              entity,
              options: buildOptions(req, entityType, action),
            }
          );
        }
      } catch (err) {
        console.error("[Notification Middleware Error]", err.message);
      }
    });

    next();
  };
}

// --- extract minimal entity data from request ---
function extractEntityData(req) {
  // Try to capture key identifiers for notifications
  const possibleIds = [
    "ticketId",
    "id",
    "messageId",
    "attachmentId",
    "userId",
    "spareRequestId",
  ];

  const entity = {};
  for (const key of possibleIds) {
    if (req.params[key]) entity[key] = req.params[key];
    else if (req.body[key]) entity[key] = req.body[key];
  }

  // Include names or codes for better notifications
  if (req.body.name) entity.name = req.body.name;
  if (req.body.ticketCode) entity.ticketCode = req.body.ticketCode;
  if (req.body.fileName) entity.fileName = req.body.fileName;

  return entity;
}

// --- optional: add contextual info ---
function buildOptions(req, entityType, action) {
  const options = {};
  // For updates, append what changed
  if (["PUT", "PATCH"].includes(req.method) && req.body) {
    if (req.body.status) options.extra = `Status → ${req.body.status}`;
    if (req.body.stage) options.extra = `Stage → ${req.body.stage}`;
  }

  // For bulk upload endpoints
  if (
    req.originalUrl.includes("/bulk") ||
    req.originalUrl.includes("/import")
  ) {
    options.extra = `Bulk ${entityType} ${action}`;
  }

  return options;
}

module.exports = { notificationMiddleware };
