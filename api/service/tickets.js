const { prisma } = require("../lib/clients");

const getTickets = async (skip, take, filter, userId, role) => {
  try {
    const params = {
      include: {
        createdByUser: true,
        updatedByUser: true,
        messages: {
          include: {
            sender: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };
    if (filter && filter.search) {
      params.where.OR = [
        { ticketCode: { contains: filter.search } },
        { description: { contains: filter.search } },
        { customerName: { contains: filter.search } },
        { controllerNo: { contains: filter.search } },
        { head: { contains: filter.search } },
        { imei: { contains: filter.search } },
        { hp: { contains: filter.search } },
        { motorType: { contains: filter.search } },
        { state: { contains: filter.search } },
        { district: { contains: filter.search } },
        { village: { contains: filter.search } },
        { block: { contains: filter.search } },
        { complaintType: { contains: filter.search } },
        { faultCode: { contains: filter.search } },
      ];
    }
    if (filter && filter.status) {
      params.where = {
        ...params.where,
        status: filter.status,
      };
    }
    if (role === "USER") {
      params.where = {
        ...params.where,
        createdBy: userId,
      };
    }

    const tickets = await prisma.ticket.findMany(params);
    return tickets;
  } catch (error) {
    throw error;
  }
};

const getTicketById = async (ticketId, userId) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdByUser: true,
        updatedByUser: true,
        messages: {
          include: {
            sender: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
      },
    });
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    return ticket;
  } catch (error) {
    throw error;
  }
};

const createTicket = async (ticket, userId, io) => {
  const {
    ticketCode,
    description,
    customerName,
    controllerNo,
    head,
    imei,
    hp,
    motorType,
    state,
    district,
    village,
    block,
    complaintType,
    faultCode,
  } = ticket;
  try {
    const newTicket = await prisma.ticket.create({
      data: {
        ticketCode: ticketCode,
        description: description,
        customerName: customerName,
        controllerNo: controllerNo,
        head: head,
        imei: imei,
        hp: hp,
        motorType: motorType,
        state: state,
        district: district,
        village: village,
        block: block,
        complaintType: complaintType,
        faultCode: faultCode,
        createdBy: userId,
      },
      include: {
        createdByUser: true,
        updatedByUser: true,
        messages: {
          include: {
            sender: true,
          },
        },
        notifications: {
          include: {
            recipients: true,
          },
        },
      },
    });
    const notification = await prisma.notification.create({
      data: {
        type: "TICKET_CREATED",
        title: `New ticket created: ${newTicket.ticketCode}`,
        description: `New ticket created: ${newTicket.ticketCode}`,
        createdById: userId,
        ticketId: ticket.id,
      },
    });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: userId,
            },
          },
          {
            role: {
              in: ["ADMIN", "TECHNICAL_USER"],
            },
          },
        ],
      },
    });
    let notificationRecipients = [];
    for (const user of users) {
      const _notificationRecipients = await prisma.notificationRecipient.create(
        {
          data: {
            userId: user.id,
            notificationId: notification.id,
          },
          include: {
            notification: {
              include: {
                createdBy: true,
                ticket: true,
                message: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
          },
        }
      );
      notificationRecipients.push(_notificationRecipients);
    }

    const conversation = await prisma.message.create({
      data: {
        content: ticket.description,
        senderId: userId,
        ticketId: newTicket.id,
      },
    });

    if (io) {
      io.emit("ticket", newTicket);
      io.emit("conversation", conversation);
      io.emit("notification", notificationRecipients);
    }
    return newTicket;
  } catch (error) {
    throw error;
  }
};

const updateTicket = async (ticketId, ticketData, userId, io) => {
  try {
    const {
      ticketCode,
      description,
      customerName,
      controllerNo,
      head,
      imei,
      hp,
      motorType,
      state,
      district,
      village,
      block,
      complaintType,
      faultCode,
      status,
    } = ticketData;
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ticketCode: ticketCode,
        description: description,
        customerName: customerName,
        controllerNo: controllerNo,
        head: head,
        imei: imei,
        hp: hp,
        motorType: motorType,
        state: state,
        district: district,
        village: village,
        block: block,
        complaintType: complaintType,
        faultCode: faultCode,
        status: status,
      },
    });
    const notification = await prisma.notification.create({
      data: {
        type: "TICKET_CREATED",
        title: `New ticket created: ${updatedTicket.ticketCode}`,
        description: `New ticket created: ${updatedTicket.ticketCode}`,
        createdById: userId,
        ticketId: ticketData.id,
      },
    });

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: userId,
            },
          },
          {
            role: {
              in: ["ADMIN", "TECHNICAL_USER"],
            },
          },
        ],
      },
    });

    for (const user of users) {
      await prisma.notificationRecipient.create({
        data: {
          userId: user.id,
          notificationId: notification.id,
        },
      });
    }

    const conversation = await prisma.message.create({
      data: {
        content: ticketData.description,
        senderId: userId,
        ticketId: updatedTicket.id,
      },
    });
    if (io) {
      io.emit("ticket", updatedTicket);
      io.emit("notification", notification);
      io.emit("conversation", conversation);
    }
    if (io) {
      io.emit("ticket", updatedTicket);
      io.emit("notification", notification);
    }
    return updatedTicket;
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (ticketId, status, userId, io) => {
  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: status },
    });
    const notification = await prisma.notification.create({
      data: {
        type: "TICKET_STATUS_UPDATED",
        title: `Ticket status updated: ${updatedTicket.ticketCode}`,
        description: `Ticket status updated: ${updatedTicket.status}`,
        createdById: userId,
        ticketId: updatedTicket.id,
      },
    });

    const users = await prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
      },
    });

    for (const user of users) {
      await prisma.notificationRecipient.create({
        data: {
          userId: user.id,
          notificationId: notification.id,
        },
      });
    }

    if (io) {
      io.emit("ticket", updatedTicket);
      io.emit("notification", notification);
    }
    return updatedTicket;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateStatus,
};
