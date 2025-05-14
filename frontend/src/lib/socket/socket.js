import { io } from "socket.io-client";

const URL = import.meta.env.VITE_APP_URL;

export const socket = io("http://localhost:8080", {
  transports: ["websocket"], // Optional, but ensures direct WebSocket
});
export default socket;
