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
} from "../features/ticketsSlice";

export default function useTicket() {
  const dispatch = useDispatch();
  const { data, currentData, loading, error, filter,show} = useSelector(
    (state) => state.ticket
  );

  const refetch = () => {
    dispatch(fetchTickets());
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

  useEffect(() => {
    if (!data.length) {
      refetch();
    }
  }, []);

  useEffect(() => {
    if (filter) {
      dispatch(fetchTickets(filter));
    }
  }, [filter]);

  return {
    data,
    currentData,
    show,
    loading,
    error,
    refetch,
    fetchTicket,
    createItem,
    updateItem,
    deleteItem,
    setCurrentData,
    setData,
    setFilter,
    setShow,
  };
}
