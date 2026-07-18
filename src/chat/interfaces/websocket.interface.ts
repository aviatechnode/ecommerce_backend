export interface IWebSocketService {
  emitToUser(
    userId: string,
    event: string,
    payload: unknown,
  ): void;

  emitToConversation(
    conversationId: string,
    event: string,
    payload: unknown,
  ): void;

  emitToTeam(
    teamId: string,
    event: string,
    payload: unknown,
  ): void;

  broadcast(
    event: string,
    payload: unknown,
  ): void;

  joinConversation(
    socketId: string,
    conversationId: string,
  ): Promise<void>;

  leaveConversation(
    socketId: string,
    conversationId: string,
  ): Promise<void>;
}