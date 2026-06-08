// conversation.types.ts

export type CreateConversationInput = {
  customerId: string
  assignedAdminId?: string
  orderId?: string
  shipmentId?: string
  returnRequestId?: string
  subject?: string
  channel?: "WEB" | "WHATSAPP" | "EMAIL"
}

export type SendMessageInput = {
  conversationId: string
  senderId: string
  content?: string
  type?: "TEXT" | "IMAGE" | "FILE" | "SYSTEM"
  replyToId?: string
  orderId?: string
  shipmentId?: string
  returnRequestId?: string
  attachments?: {
    url: string
    filename: string
    mimeType: string
    size: number
    extension?: string
  }[]
}