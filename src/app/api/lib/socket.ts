import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
}
