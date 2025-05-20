import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTickets,
  fetchTicket as fetchSingleTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  setCurrentTicket,
  setData as setTicketData,
  setFilter as setTicketFilter,
  setShow as setModalShow,
  updateStatus as updateTicketStatus,
  addConversationMessage,
} from "../features/ticketsSlice";
import socket from "../socket/socket";

export default function useTicket() {
  const dispatch = useDispatch();
  const {
    data,
    currentData,
    loading,
    error,
    filter,
    show,
    currentPage,
    totalPages,
  } = useSelector((state) => state.ticket);
  const { user } = useSelector((state) => state.auth);

  const refetch = () => {
    dispatch(fetchTickets({ page: currentPage, size: 10, filter }));
  };

  const fetchTicket = (id) => {
    dispatch(fetchSingleTicket(id));
  };

  const createItem = (ticketData) => {
    dispatch(createTicket(ticketData));
  };

  const updateItem = (id, ticketData) => {
    dispatch(updateTicket({ id, ticketData }));
  };

  const deleteItem = (id) => {
    dispatch(deleteTicket(id));
  };

  const setCurrentData = (ticket) => {
    dispatch(setCurrentTicket(ticket));
  };

  const setData = (tickets) => {
    dispatch(setTicketData(tickets));
  };

  const setFilter = (filter) => {
    dispatch(setTicketFilter(filter));
  };

  const setShow = (show) => {
    dispatch(setModalShow(show));
  };

  const updateStatus = (id, status) => {
    dispatch(updateTicketStatus({ id, status }));
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("connect", () => {
      console.log("Connected for conversation:", socket.id);
    });

    socket.on("conversation", (newConversation) => {
      if (currentData && currentData.id === newConversation.ticketId) {
        dispatch(addConversationMessage(newConversation));
      }
    });
    socket.on("ticket", (newTicket) => {
       const _ticket = data.find((ticket) => ticket.id === newTicket.id);
       if (user.id !== newTicket.createdBy && user.role !== "USER") {
        if (_ticket) {
          let _tickets = [];
          _tickets = data.filter((id) => id !== _ticket.id);
          _tickets.push(newTicket);
          setData(_tickets);
        } else {
          let tickets = [];
          tickets = [...data];
          tickets.push(newTicket);
           setData(tickets);
        }
      }
    });

    return () => {
      socket.disconnect();
      socket.off("conversation");
      socket.off("ticket");
    };
  }, []);

  useEffect(() => {
    if (!data.length) {
      refetch();
    }
  }, []);

  useEffect(() => {
    if (filter) {
      console.log(filter, "filter");
      
      dispatch(fetchTickets({ page: currentPage, size: 10, filter: filter }));
    }
  }, [filter]);

  return {
    data,
    currentData,
    show,
    filter,
    loading,
    error,
    currentPage,
    totalPages,
    refetch,
    fetchTicket,
    createItem,
    updateItem,
    updateStatus,
    deleteItem,
    setCurrentData,
    setData,
    setFilter,
    setShow,
  };
}
