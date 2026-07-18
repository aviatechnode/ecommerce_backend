import type { IMessageGateway } from "../gateway-interface/message.gateway.interface.js";
import { requireAuthenticated, type ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationEventService } from "../interfaces/conversation-event.interface.js";
import type { IMessageDraftService } from "../interfaces/message-draft.interface.js";
import type { IMessageReadService } from "../interfaces/message-read.interface.js";
import type { IMessageService } from "../interfaces/message.interface.js";
import type { INotificationService } from "../interfaces/notification.interface.js";
import type { MessagePolicy } from "../policies/mesaage.policy.js";
import type {
  DeleteMessage,
  EditMessage,
  ListMessages,
  Message,
  ReplyMessage,
  SendMessage,
} from "../schemas/message.schema.js";
import type { IConversationParticipantService } from "../interfaces/conversation-participant.interface.js";
import { BusinessRuleError } from "../_shared/business-rule-error.js";
export class MessageService
  implements IMessageService
{
  constructor(
    private readonly gateway: IMessageGateway,
    private readonly policy: MessagePolicy,

    private readonly participantService: IConversationParticipantService,
    private readonly readService: IMessageReadService,
    private readonly eventService: IConversationEventService,
    private readonly draftService: IMessageDraftService,
    private readonly notificationService: INotificationService,
  ) {}

  ////////////////////////////////////////////////////////////
  // SEND
  ////////////////////////////////////////////////////////////

async send(
  actor: ChatActor,
  data: SendMessage,
): Promise<Message> {
  this.policy.send(actor, data);

  const message =
    await this.gateway.create(actor, data);

  await this.participantService.incrementUnreadCount(
    actor,
    message.conversationId,
  );

  await this.eventService.recordMessageSent(
    actor,
    {
      conversationId: message.conversationId,
      messageId: message.id,
    },
  );

  await this.draftService.clearAfterSend(
    actor,
    message.conversationId,
  );

  await this.notificationService.notifyChatMessage(
    actor,
    message,
  );

  return message;
}

async reply(
  actor: ChatActor,
  data: ReplyMessage,
): Promise<Message> {
  this.policy.reply(actor, data);

  const message =
    await this.gateway.reply(actor, data);

  await this.participantService.incrementUnreadCount(
    actor,
    message.conversationId,
  );

  await this.eventService.recordMessageSent(
    actor,
    {
      conversationId: message.conversationId,
      messageId: message.id,
    },
  );

  await this.draftService.clearAfterSend(
    actor,
    message.conversationId,
  );

  await this.notificationService.notifyChatMessage(
    actor,
    message,
  );

  return message;
}
  ////////////////////////////////////////////////////////////
  // EDIT
  ////////////////////////////////////////////////////////////

  async edit(
    actor: ChatActor,
    data: EditMessage,
  ): Promise<Message> {
    const existing =
      await this.requireMessage(
        actor,
        data.messageId,
      );

    this.policy.edit(
      actor,
      existing,
      data,
    );

    const updated =
      await this.gateway.update(
        actor,
        data,
      );

    await this.eventService.record(
      actor,
      {
        conversationId:
          updated.conversationId,
        type: "MESSAGE_EDITED",
        oldValue: {
          content: existing.content,
        },
        newValue: {
          content: updated.content,
        },
      },
    );

    return updated;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    data: DeleteMessage,
  ): Promise<void> {
    const message =
      await this.requireMessage(
        actor,
        data.messageId,
      );

    this.policy.delete(
      actor,
      message,
      data,
    );

    await this.gateway.delete(
      actor,
      data,
    );

    await this.eventService.record(
      actor,
      {
        conversationId:
          message.conversationId,
        type: "MESSAGE_DELETED",
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<Message | null> {
    const message =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!message) {
      return null;
    }

    this.policy.view(
      actor,
      message,
    );

    return message;
  }

  async list(
    actor: ChatActor,
    filters: ListMessages,
  ): Promise<{
    data: Message[];
    total: number;
  }> {
    this.policy.list(
      actor,
      filters,
    );

    const [data, total] =
      await Promise.all([
        this.gateway.findMany(
          actor,
          filters,
        ),
        this.gateway.count(
          actor,
          filters.conversationId,
        ),
      ]);

    return {
      data,
      total,
    };
  }

  async findReplies(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message[]> {
    const message =
      await this.requireMessage(
        actor,
        messageId,
      );

    this.policy.findReplies(
      actor,
      message,
    );

    return this.gateway.findReplies(
      actor,
      messageId,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  async markRead(
  actor: ChatActor,
  messageId: string,
): Promise<Message> {
  const message =
    await this.requireMessage(
      actor,
      messageId,
    );

  this.policy.markRead(
    actor,
    message,
  );
  requireAuthenticated(actor);

  const updated =
    await this.gateway.updateReadAt(
      actor,
      message.id,
      new Date(),
    );

  await this.readService.markRead(
    actor,
    {
      messageId,
      userId: actor.userId,
    },
  );

  await this.participantService.resetUnreadCount(
    actor,
    message.conversationId,
  );

  return updated;
}

  async markDelivered(
    actor: ChatActor,
    messageId: string,
  ): Promise<Message> {
    const message =
      await this.requireMessage(
        actor,
        messageId,
      );

    this.policy.markDelivered(
      actor,
      message,
    );

    return this.gateway.updateDeliveryStatus(
      actor,
      message.id,
      "DELIVERED",
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireMessage(
    actor: ChatActor,
    id: string,
  ): Promise<Message> {
    const message =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!message) {
      throw new BusinessRuleError(
        "Message not found.",
      );
    }

    return message;
  }
}