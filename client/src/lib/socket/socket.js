import { io } from "socket.io-client";
import { APP_WS_URL } from "../constants/api";
import SessionManager from "../utils/sessionManager";
const socket = io(APP_WS_URL, {
  withCredentials: true,
  autoConnect: true,
  auth: {
    token: SessionManager.getToken() || null, // optional
  },
});

export default socket;
