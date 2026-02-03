import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:4000";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
