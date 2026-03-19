import { io } from "socket.io-client";
import { store } from "./store";

const SOCKET_URL = "http://localhost:9999";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    const user = store.getCurrentUser();
    if (!user) return null;

    if (!this.socket || !this.socket.connected) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
        // Join room riêng bằng user id
        this.socket.emit("join", user.id || user._id);
      });

      this.socket.on("disconnect", () => {
        console.log("WebSocket disconnected");
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(eventName, callback) {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  off(eventName, callback) {
    if (this.socket) {
      this.socket.off(eventName, callback);
    }
  }
}

export const socketService = new SocketService();
