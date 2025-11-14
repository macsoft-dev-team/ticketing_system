import {
  fetchTickets,
  fetchTicketById,
  createNewTicket,
  updateTicketById,
  updateTicketStatusAPI,
  deleteTicketById,
  setFilters,
  clearError,
  updateMilestone as updateMilestoneAction,
} from "../features/tickets";
import { useDispatch, useSelector } from "react-redux";

function useTickets() {
  const dispatch = useDispatch();
  const {
    tickets,
    currentPage,
    totalPages,
    currentTicket,
    deviceDetails,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    statusCount,
  } = useSelector((state) => state.ticket);

  const loadTickets = (params = {}) => {
    dispatch(fetchTickets(params));
  };

  const getTicketById = (ticketId) => {
    dispatch(fetchTicketById(ticketId));
  };

  const createTicket = (ticketData) => {
    return dispatch(createNewTicket(ticketData));
  };

  const updateTicket = (ticketId, ticketData) => {
    return dispatch(updateTicketById({ ticketId, ticketData }));
  };

  const updateStatus = (ticketId, status) => {
    return dispatch(updateTicketStatusAPI({ ticketId, status }));
  };

  const deleteTicket = (ticketId) => {
    return dispatch(deleteTicketById(ticketId));
  };

  const setTicketFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const clearErrors = () => {
    dispatch(clearError());
  };

  const updateMilestone = ({ ticketId, milestoneData }) => {
    return dispatch(updateMilestoneAction({ ticketId, milestoneData }));
  };

  return {
    tickets,
    currentPage,
    totalPages,
    ticket: currentTicket,
    deviceDetails,
    loading,
    error,
    filters,
    sortBy,
    sortOrder,
    statusCount,
    // Actions
    fetchTickets: loadTickets,
    fetchTicketById: getTicketById,
    createTicket,
    updateTicket,
    updateStatus,
    deleteTicket,
    setFilters: setTicketFilters,
    clearError: clearErrors,
    updateMilestone,
  };
}
export default useTickets;
