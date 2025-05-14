 import { configureStore } from '@reduxjs/toolkit';
import crudSlice from '../features/crudSlice';
import authSlice from '../features/authSlice';
import conversationSlice from '../features/conversationSlice';
import ticketSlice from '../features/ticketsSlice';
 
 const makeStore =  configureStore({
    reducer: {
      crud: crudSlice,
      conversation: conversationSlice,
      auth: authSlice,
      ticket:ticketSlice,
    },
  });


 
export default makeStore;