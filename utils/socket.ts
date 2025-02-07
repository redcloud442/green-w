// import { io } from "socket.io-client";

// // Set the URL dynamically based on the environment and testing needs
// const socketUrl =
//   process.env.NODE_ENV === "development"
//     ? window.location.hostname === "localhost"
//       ? "ws://localhost:8000"
//       : "ws://192.168.1.56:8000"
//     : "wss://elevateglobal.app";

// export const socket = io(socketUrl, {
//   withCredentials: true,
//   reconnectionDelayMax: 10000,
//   transports: ["websocket"],
//   path: "/socket.io/",
// });
