import { configureStore } from "@reduxjs/toolkit";
import uiSlice from "../features/uiSlice";
import authSlice from "../features/authSlice";
import userSlice from "../features/users"
/* 
import devicesSlice from "../features/devices";
import manufacturersSlice from "../features/manufacturers";
import commandSlice from "../features/commands";
import templatesSlice from "../features/template";
import dashboardSlice from "../features/dashboard";
import mappingsSlice from "../features/mappings";
import userSlice from "../features/users"; */
import notificationSlice from "../features/notifications";
import ticketSlice from "../features/tickets";
import organisationSlice from "../features/organisations";
import serviceCenterSlice from "../features/serviceCenters";
import projectsSlice from "../features/projects";
import productSlice from "../features/products";
import notificationSocketMiddleware from "../services/notificationSocketMiddleware";
export const store = configureStore({
  reducer: {
    ui: uiSlice,
    auth: authSlice,
    notification: notificationSlice,
    user: userSlice,
    ticket: ticketSlice,
    organisation: organisationSlice,
    servicecenter: serviceCenterSlice,
    project: projectsSlice,
    product: productSlice,
  },/* 
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(notificationSocketMiddleware), */
});

export default store;
