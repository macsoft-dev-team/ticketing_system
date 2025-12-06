// notificationSocketMiddleware.js
import { addNotification } from '../features/notifications';
import socketService from '../services/socketService';

const notificationSocketMiddleware = store => next => action => {
  // Connect socket on login or app start
  if (action.type === 'auth/loginSuccess') {
    const token = action.payload.token;
    const socket = socketService.connect(token);

    socket.on('notification:new', (data) => {
      console.log('🔔 [NOTIFICATION_MIDDLEWARE] Received notification:', data);
      
      // Check if this is a message notification and user is in the same ticket
      const currentTicketId = window.currentTicketId;
      
      if (data.type === 'message' && data.ticketId && currentTicketId) {
        // Handle both string and number comparisons
        const dataTicketId = parseInt(data.ticketId);
        const currTicketId = parseInt(currentTicketId);
        if (dataTicketId === currTicketId) {
          console.log(`🔕 [NOTIFICATION_MIDDLEWARE] User in same ticket ${currTicketId} - suppressing Redux notification (affects notification list only)`);
          return; // Don't add to Redux notifications (suppresses notification list/badge, but sounds are handled elsewhere)
        }
      }
      
      console.log('📨 [NOTIFICATION_MIDDLEWARE] Adding notification to Redux store');
      store.dispatch(addNotification(data));
    });
  }
  // Optionally handle disconnect, etc.
  return next(action);
};

export default notificationSocketMiddleware;