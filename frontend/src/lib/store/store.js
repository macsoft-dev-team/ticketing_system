 import { configureStore } from '@reduxjs/toolkit';
import crudSlice from '../features/crudSlice';
import authSlice from '../features/authSlice';
import conversationSlice from '../features/conversationSlice';
import ticketSlice from '../features/ticketsSlice';
import notificationSlice from '../features/notificationSlice';
 
 const makeStore =  configureStore({
    reducer: {
      crud: crudSlice,
      conversation: conversationSlice,
      auth: authSlice,
      ticket: ticketSlice,
      notification: notificationSlice,
    },
  });


 
export default makeStore;