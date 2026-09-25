import { io } from "socket.io-client";
import { BASE_URL } from "./apiClient";

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;
  socket = io(BASE_URL, {
    auth: { authorization: token },
    autoConnect: true,
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
