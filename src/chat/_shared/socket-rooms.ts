export const SocketRooms = {
  user(userId: string): string {
    return `user:${userId}`;
  },

  conversation(
    conversationId: string,
  ): string {
    return `conversation:${conversationId}`;
  },

  team(teamId: string): string {
    return `team:${teamId}`;
  },
} as const;