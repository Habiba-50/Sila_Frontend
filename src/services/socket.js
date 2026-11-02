import { io } from "socket.io-client";
import { BASE_URL } from "./apiClient";

let socket = null;
let socketToken = null;

export function connectSocket(token) {
  if (socket) {
    if (token && token !== socketToken) {
      socket.auth = { authorization: token };
      socketToken = token;
      if (socket.connected) socket.disconnect();
    }
    if (!socket.connected && !socket.active) socket.connect();
    return socket;
  }
  socketToken = token;
  socket = io(BASE_URL, {
    auth: { authorization: token },
    autoConnect: true,
  });
  return socket;
}

export function waitForSocketConnection(socket, timeoutMs = 12000) {
  if (socket?.connected) return Promise.resolve();
  if (!socket) return Promise.reject(new Error("Chat connection is unavailable."));

  return new Promise((resolve, reject) => {
    let lastError;
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };
    const handleConnect = () => {
      cleanup();
      resolve();
    };
    const handleConnectError = (error) => {
      lastError = error;
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(lastError || new Error("Chat connection timed out."));
    }, timeoutMs);

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    if (!socket.active) socket.connect();
  });
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
