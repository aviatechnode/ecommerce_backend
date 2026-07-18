import type {
  Server,
  Socket,
} from "socket.io";

import {
  joinConversation,
  leaveConversation,
  joinUserRoom,
} from "../websocket/websocket.rooms.js";

export function registerSocketEvents(
  io: Server,
  socket: Socket,
) {
  joinUserRoom(socket);

  socket.on(
    "conversation:join",
    async (conversationId: string) => {
      await joinConversation(
        socket,
        conversationId,
      );
    },
  );

  socket.on(
    "conversation:leave",
    async (conversationId: string) => {
      await leaveConversation(
        socket,
        conversationId,
      );
    },
  );

  socket.on(
    "disconnect",
    () => {},
  );
}