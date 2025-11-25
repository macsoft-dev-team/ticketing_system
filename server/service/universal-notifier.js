// src/services/universal-notifier.js
const { PrismaClient } = require("../generated/prisma/client");
const prisma = new PrismaClient();

/**
 * notifyCRUD — single reusable notification handler for all entities & CRUD actions
 *
 * @param {Object} ctx - { prisma, io }
 * @param {Object} input - { entityType, action, actorId, entity, options }
 *
 * @example
 * await notifyCRUD({ prisma, io }, {
 *   entityType: "ticket",
 *   action: "updated",
 *   actorId: 12,
 *   entity: { id: 45, ticketCode: "TKT-2025-001" },
 *   options: { extra: "Status → IN_PROGRESS", targetRoles: ["MACSOFT_ADMIN"] }
 * });
 */
async function notifyCRUD(ctx, input) {
  const { prisma, io } = ctx;
  const { entityType, action, actorId, entity = {}, options = {} } = input;

  try {
    // --------------------------------------------
    // 1️⃣ Build a human-readable title & description
    // --------------------------------------------
    const title = buildTitle(entityType, action, entity);
    const description = buildDescription(
      entityType,
      action,
      entity,
      options.extra
    );

    // --------------------------------------------
    // 2️⃣ Create notification record in DB
    // --------------------------------------------
    const notification = await prisma.notification.create({
      data: {
        type: `${entityType}_${action}`,
        title,
        description,
        createdById: actorId || 0,
        ticketId: entity.ticketId || null,
        messageId: entity.messageId || null,
      },
    });

    // --------------------------------------------
    // 3️⃣ Determine recipients
    // --------------------------------------------
    const recipients = await getRecipients(prisma, {
      actorId,
      entityType,
      entity,
      targetRoles: options.targetRoles,
    });

    // Save recipients to DB
    const recipientRecords = [];
    for (const user of recipients) {
      const rec = await prisma.notificationRecipient.create({
        data: {
          userId: user.id,
          notificationId: notification.id,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
          notification: true,
        },
      });
      recipientRecords.push(rec);
    }

    // --------------------------------------------
    // 4️⃣ Emit Socket.IO broadcast
    // --------------------------------------------
    if (io && recipientRecords.length > 0) {
      for (const rec of recipientRecords) {
        io.to(`notifications-${rec.userId}`).emit(
          "notification",
          rec.notification
        );
      } 
    }

    return { notification, recipients: recipientRecords };
  } catch (err) {
    console.error("❌ notifyCRUD error:", err);
    throw err;
  }
}

/**
 * Build human-friendly notification title
 */
function buildTitle(entityType, action, entity) {
  const names = {
    ticket: "Ticket",
    user: "User",
    attachment: "Attachment",
    message: "Message",
    product: "Product",
    spare_request: "Spare Request",
    inventory: "Inventory",
    organisation: "Organisation",
    service_center: "Service Center",
  };

  const label = names[entityType] || entityType;
  return `${label} ${capitalize(action)}`;
}

/**
 * Build a contextual description line
 */
function buildDescription(entityType, action, entity, extra) {
  let base = "";

  switch (entityType) {
    case "ticket":
      base = `Ticket ${entity.ticketCode || entity.id} has been ${action}`;
      break;
    case "user":
      base = `User ${entity.name || entity.id} has been ${action}`;
      break;
    case "attachment":
      base = `Attachment ${entity.fileName || ""} added for Ticket ${
        entity.ticketCode || entity.ticketId
      }`;
      break;
    case "message":
      base = `New message in Ticket ${entity.ticketCode || entity.ticketId}`;
      break;
    case "spare_request":
      base = `Spare request #${entity.id} has been ${action}`;
      break;
    case "product":
      base = `Product ${entity.name || entity.id} has been ${action}`;
      break;
    default:
      base = `${capitalize(entityType)} ${entity.id || ""} has been ${action}`;
  }

  if (extra) base += ` (${extra})`;
  return base;
}

/**
 * Determine who should receive notifications based on roles and context
 */
async function getRecipients(
  prisma,
  { actorId, entityType, entity, targetRoles }
) {
  let recipients = [];

  if (Array.isArray(targetRoles) && targetRoles.length) {
    recipients = await prisma.user.findMany({
      where: { role: { in: targetRoles } },
      select: { id: true, name: true, role: true },
    });
  } else {
    // Default fallback rules (like your role logic)
    recipients = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: actorId } },
          {
            role: {
              in: ["MACSOFT_ADMIN", "MACSOFT_HEAD", "CUSTOMER_SERVICE_HEAD", "MACSOFT_SUPPORT"],
            },
          },
        ],
      },
      select: { id: true, name: true, role: true },
    });
  }

  return recipients;
}

/**
 * Capitalize helper
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { notifyCRUD };
