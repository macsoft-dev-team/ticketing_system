const { prisma } = require("../lib/clients");

const getTickets = async () => {
  try {
    const tickets = await prisma.ticket.findMany({
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
    });
    return tickets;
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
    });
    const notification = await prisma.notification.create({
      data: {
        createdById: userId,
        ticketId: ticket.id,  
      },
    });

    const users = await prisma.user.findMany({
      where:{
        id:{
          not: userId
        }
      }
    });

    for(const user of users) {
      await prisma.notificationRecipient.create({
        data: {
          userId: user.id,
          notificationId: notification.id,
        },
      });
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
      io.emit("notification", notification);
      io.emit("conversation", conversation);
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
        type: "ticket_updated",
        message: `Ticket updated: ${updatedTicket.ticketCode}`,
        createdById: userId,
        ticketId: updatedTicket.id,
        receivers: {
          create: [{ userId: adminId }, { userId: technicalUserId }],
        },
      },
    });
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
        type: "ticket_status_updated",
        message: `Ticket status updated: ${updatedTicket.ticketCode}`,
        createdById: userId,
        ticketId: updatedTicket.id,
        receivers: {
          create: [{ userId: adminId }, { userId: technicalUserId }],
        },
      },
    });
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
  createTicket,
  updateTicket,
  updateStatus,
};
