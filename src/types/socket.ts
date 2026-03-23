export interface JoinPayload {
  userId: string;
}

export interface JoinConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: any;
}

export interface MarkReadPayload {
  conversationId: string;
  userId: string;
}
export interface TypingPayload {
  conversationId: string;
  userId: string;
}

export interface DeliveryPayload {
  messageId: string;
  userId: string;
}