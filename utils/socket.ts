import { io } from "socket.io-client";

// Set the URL dynamically based on the environment and testing needs
const socketUrl =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://loadbalancer.elevateglobal.app";

export const socket = io(socketUrl, {
  withCredentials: true,
  reconnectionDelayMax: 10000,
  transports: ["websocket"],
  upgrade: true,
  path: "/socket.io/",
});
