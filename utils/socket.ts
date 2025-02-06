import { io } from "socket.io-client";

export const socket = io(
  process.env.NODE_ENV === "development"
    ? "ws://localhost:8000"
    : "wss://elevateglobal.app",
  {
    withCredentials: true,
    reconnectionDelayMax: 10000,
    transports: ["websocket"],
    path: "/socket.io/", // Ensure the path matches your backend
  }
);
