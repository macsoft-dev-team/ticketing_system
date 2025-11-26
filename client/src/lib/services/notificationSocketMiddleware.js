// notificationSocketMiddleware.js
import { addNotification } from '../features/notifications';
import socketService from '../services/socketService';

const notificationSocketMiddleware = store => next => action => {
  // Connect socket on login or app start
  if (action.type === 'auth/loginSuccess') {
    const token = action.payload.token;
    const socket = socketService.connect(token);

    socket.on('notification:new', (data) => {
      store.dispatch(addNotification(data));
    });
  }
  // Optionally handle disconnect, etc.
  return next(action);
};

export default notificationSocketMiddleware;