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
  setCurrentPage,
  searchTickets,
  updateTicketLastMessage,
  addNewTicketFromSocket,
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
    searchResults,
    searching,
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

  const setCurrentPageNumber = (pageNumber) => {
    dispatch(setCurrentPage(pageNumber));
  }

  const searchTicketsAPI = (keyword) => {
    return dispatch(searchTickets(keyword));
  };

  const updateLastMessage = (ticketId, messageData, ticketUpdates = {}) => {
    dispatch(updateTicketLastMessage({ ticketId, messageData, ticketUpdates }));
  };

  const updateTicketWithMessage = (ticketId, messageData, additionalUpdates = {}) => {
    // Enhanced function to update both message and ticket data
    const ticketUpdates = {
      lastActivity: new Date().toISOString(),
      hasUnreadMessages: messageData.senderId !== undefined, // Simplified check
      ...additionalUpdates
    };
    
    dispatch(updateTicketLastMessage({ ticketId, messageData, ticketUpdates }));
  };

  const addNewTicket = (ticketData) => {
    dispatch(addNewTicketFromSocket(ticketData));
  };

  return {
    tickets,
    currentPage,
    totalPages,
    ticket: currentTicket,
    deviceDetails,
    searchResults,
    searching,
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
    setCurrentPage: setCurrentPageNumber,
    searchTickets: searchTicketsAPI,
    updateLastMessage,
    updateTicketWithMessage,
    addNewTicket,
  };
}
export default useTickets;
