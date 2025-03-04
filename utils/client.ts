export const socket = new WebSocket("ws://localhost:8000/ws");

socket.onopen = (event) => {
  console.log("WebSocket client opened", event);
};

socket.onclose = (event) => {
  console.log("WebSocket client closed", event);
};

socket.onmessage = (event) => {
  console.log("WebSocket client message", event);
};
