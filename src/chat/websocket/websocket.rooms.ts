import type { Socket } from "socket.io";

export async function joinUserRoom(
  socket: Socket,
) {
  socket.join(
    `user:${socket.data.user.id}`,
  );
}

export async function joinConversation(
  socket: Socket,
  conversationId: string,
) {
  socket.join(
    `conversation:${conversationId}`,
  );
}

export async function leaveConversation(
  socket: Socket,
  conversationId: string,
) {
  socket.leave(
    `conversation:${conversationId}`,
  );
}