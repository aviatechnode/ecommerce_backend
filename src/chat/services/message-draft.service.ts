import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IMessageDraftGateway } from "../gateway-interface/message-draft.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IMessageDraftService } from "../interfaces/message-draft.interface.js";

import { MessageDraftPolicy } from "../policies/message-draft.policy.js";

import type {
  DeleteMessageDraft,
  GetMessageDraft,
  MessageDraft,
  SaveMessageDraft,
} from "../schema_types/message-draft.type.js";

export class MessageDraftService
  implements IMessageDraftService
{
  constructor(
    private readonly gateway: IMessageDraftGateway,

    private readonly policy: MessageDraftPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // DRAFTS
  ////////////////////////////////////////////////////////////

  async save(
    actor: ChatActor,
    data: SaveMessageDraft,
  ): Promise<MessageDraft> {
    this.policy.save(
      actor,
      data,
    );

    return this.gateway.save(
      actor,
      data,
    );
  }

  async get(
    actor: ChatActor,
    data: GetMessageDraft,
  ): Promise<MessageDraft | null> {
    const draft =
      await this.gateway.find(
        actor,
        data.conversationId,
      );

    if (!draft) {
      return null;
    }

    this.policy.get(
      actor,
      draft,
      data,
    );

    return draft;
  }

  async delete(
    actor: ChatActor,
    data: DeleteMessageDraft,
  ): Promise<void> {
    const draft =
      await this.requireDraft(
        actor,
        data.conversationId,
      );

    this.policy.delete(
      actor,
      draft,
      data,
    );

    await this.gateway.delete(
      actor,
      data.conversationId,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  async restore(
    actor: ChatActor,
    conversationId: string,
  ): Promise<MessageDraft | null> {
    const draft =
      await this.gateway.find(
        actor,
        conversationId,
      );

    if (!draft) {
      return null;
    }

    this.policy.restore(
      actor,
      draft,
    );

    return draft;
  }

  async clearAfterSend(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    const draft =
      await this.gateway.find(
        actor,
        conversationId,
      );

    if (!draft) {
      return;
    }

    this.policy.clearAfterSend(
      actor,
      draft,
    );

    await this.gateway.delete(
      actor,
      conversationId,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireDraft(
    actor: ChatActor,
    conversationId: string,
  ): Promise<MessageDraft> {
    const draft =
      await this.gateway.find(
        actor,
        conversationId,
      );

    if (!draft) {
      throw new BusinessRuleError(
        "Message draft not found.",
      );
    }

    return draft;
  }
}