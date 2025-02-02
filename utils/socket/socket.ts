import { io } from "socket.io-client";
import { createClientSide } from "../supabase/client";

const supabase = createClientSide();

async function initializeSocket() {
  const { data, error } = await supabase.auth.getUser();
  console.log("TEST", data);
  if (error || !data?.user) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }

  // Initialize the socket connection with the user ID
  const socket = io(
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://primepinas.com",
    {
      transports: ["websocket"],
      reconnection: true,
    }
  );

  return socket;
}

export default initializeSocket;
