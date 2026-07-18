import { getSocketServer } from "../websocket/websocket.instance.js";

import type {
  IWebSocketService,
} from "../interfaces/websocket.interface.js";

import { SocketRooms } from "../_shared/socket-rooms.js";

export class WebSocketService
  implements IWebSocketService
{
  ////////////////////////////////////////////////////////////
  // EMIT
  ////////////////////////////////////////////////////////////

  emitToUser(
    userId: string,
    event: string,
    payload: unknown,
  ): void {
    getSocketServer()
      .to(
        SocketRooms.user(userId),
      )
      .emit(
        event,
        payload,
      );
  }

  emitToConversation(
    conversationId: string,
    event: string,
    payload: unknown,
  ): void {
    getSocketServer()
      .to(
        SocketRooms.conversation(
          conversationId,
        ),
      )
      .emit(
        event,
        payload,
      );
  }

  emitToTeam(
    teamId: string,
    event: string,
    payload: unknown,
  ): void {
    getSocketServer()
      .to(
        SocketRooms.team(teamId),
      )
      .emit(
        event,
        payload,
      );
  }

  broadcast(
    event: string,
    payload: unknown,
  ): void {
    getSocketServer().emit(
      event,
      payload,
    );
  }

  ////////////////////////////////////////////////////////////
  // CONVERSATION ROOMS
  ////////////////////////////////////////////////////////////

  async joinConversation(
    socketId: string,
    conversationId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.join(
      SocketRooms.conversation(
        conversationId,
      ),
    );
  }

  async leaveConversation(
    socketId: string,
    conversationId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.leave(
      SocketRooms.conversation(
        conversationId,
      ),
    );
  }

  ////////////////////////////////////////////////////////////
  // USER ROOMS
  ////////////////////////////////////////////////////////////

  async joinUser(
    socketId: string,
    userId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.join(
      SocketRooms.user(userId),
    );
  }

  async leaveUser(
    socketId: string,
    userId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.leave(
      SocketRooms.user(userId),
    );
  }

  ////////////////////////////////////////////////////////////
  // TEAM ROOMS
  ////////////////////////////////////////////////////////////

  async joinTeam(
    socketId: string,
    teamId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.join(
      SocketRooms.team(teamId),
    );
  }

  async leaveTeam(
    socketId: string,
    teamId: string,
  ): Promise<void> {
    const socket =
      this.getSocket(socketId);

    if (!socket) {
      return;
    }

    await socket.leave(
      SocketRooms.team(teamId),
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private getSocket(
    socketId: string,
  ) {
    return getSocketServer()
      .sockets
      .sockets
      .get(socketId);
  }
}