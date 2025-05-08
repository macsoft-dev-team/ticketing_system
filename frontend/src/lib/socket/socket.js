import { io } from "socket.io-client";

const URL = import.meta.env.VITE_APP_URL;

const socket = io(URL, {
  autoConnect: false,
  transports: ["websocket"],
});

export default socket;
