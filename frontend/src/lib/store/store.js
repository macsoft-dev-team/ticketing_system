 import { configureStore } from '@reduxjs/toolkit';
import crudSlice from '../features/crudSlice';
import authSlice from '../features/authSlice';
 const makeStore =  configureStore({
    reducer: {
      crud: crudSlice,
      auth: authSlice,
    },
  });


 
export default makeStore;