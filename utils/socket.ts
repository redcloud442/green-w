import { io, Socket } from "socket.io-client";

let socket: Socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(
      process.env.NODE_ENV === "development"
        ? "http://localhost:8000"
        : "https://loadbalancer.elevateglobal.app",
      {
        transports: ["websocket"], // Ensure WebSocket transport is used
        secure: true, // Use secure connection if on production (HTTPS)
        reconnection: true, // Ensure reconnections in case of disconnection
        reconnectionAttempts: 5,
      }
    );
  }
  return socket;
};
