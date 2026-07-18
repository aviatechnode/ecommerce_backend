import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IMessageReadGateway } from "../gateway-interface/message-read.gatewayinterface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IMessageReadService } from "../interfaces/message-read.interface.js";

import { MessageReadPolicy } from "../policies/message-read.policy.js";

import type {
  ListMessageReads,
  MarkMessageRead,
  MessageRead,
} from "../schema_types/message-read.type.js";

export class MessageReadService
  implements IMessageReadService
{
  constructor(
    private readonly gateway: IMessageReadGateway,

    private readonly policy: MessageReadPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // READ RECEIPTS
  ////////////////////////////////////////////////////////////

  async markRead(
    actor: ChatActor,
    data: MarkMessageRead,
  ): Promise<MessageRead> {
    this.policy.markRead(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async find(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageRead | null> {
    const read =
      await this.gateway.find(
        actor,
        messageId,
      );

    if (!read) {
      return null;
    }

    this.policy.view(
      actor,
      read,
    );

    return read;
  }

  async list(
    actor: ChatActor,
    filters: ListMessageReads,
  ): Promise<MessageRead[]> {
    this.policy.list(
      actor,
      filters,
    );

    return this.gateway.list(
      actor,
      filters,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    this.policy.markConversationRead(
      actor,
      conversationId,
    );

    // Gateway should expose conversation-level bulk read
    // operation in production.
    throw new BusinessRuleError(
      "Bulk conversation read is not implemented by the gateway.",
    );
  }

  async markMessagesRead(
    actor: ChatActor,
    messageIds: string[],
  ): Promise<void> {
    this.policy.markMessagesRead(
      actor,
      messageIds,
    );

    // Gateway should expose bulk create/upsert.
    throw new BusinessRuleError(
      "Bulk message read is not implemented by the gateway.",
    );
  }

  async isRead(
    actor: ChatActor,
    messageId: string,
  ): Promise<boolean> {
    const read =
      await this.gateway.find(
        actor,
        messageId,
      );

    if (!read) {
      return false;
    }

    this.policy.isRead(
      actor,
      read,
    );

    return true;
  }

  async getReadCount(
    actor: ChatActor,
    messageId: string,
  ): Promise<number> {
    this.policy.getReadCount(
      actor,
      messageId,
    );

    const reads =
      await this.gateway.list(
        actor,
        {
          messageId,
          page: 1,
          limit: 100,
        },
      );

    return reads.length;
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireRead(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageRead> {
    const read =
      await this.gateway.find(
        actor,
        messageId,
      );

    if (!read) {
      throw new BusinessRuleError(
        "Message read receipt not found.",
      );
    }

    return read;
  }
}