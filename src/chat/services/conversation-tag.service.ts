import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationTagService } from "../interfaces/conversation-tag.interface.js";

import type { IConversationTagGateway } from "../gateway-interface/conversation-tag.gateway.interface.js";

import { ConversationTagPolicy } from "../policies/conversation-tag.policy.js";

import type {
  ConversationTag,
  CreateTag,
  UpdateTag,
  AssignTag,
  RemoveTag,
} from "../schema_types/conversation-tag.type.js";

export class ConversationTagService
  implements IConversationTagService
{
  constructor(
    private readonly gateway: IConversationTagGateway,

    private readonly policy: ConversationTagPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // TAG CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateTag,
  ): Promise<ConversationTag> {
    this.policy.create(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async update(
    actor: ChatActor,
    data: UpdateTag,
  ): Promise<ConversationTag> {
    const tag =
      await this.requireTag(
        actor,
        data.tagId,
      );

    this.policy.update(
      actor,
      tag,
      data,
    );

    return this.gateway.update(
      actor,
      data,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationTag | null> {
    const tag =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!tag) {
      return null;
    }

    this.policy.view(
      actor,
      tag,
    );

    return tag;
  }

  async list(): Promise<
    ConversationTag[]
  > {
    return this.gateway.findMany();
  }

  async delete(
    actor: ChatActor,
    tagId: string,
  ): Promise<void> {
    const tag =
      await this.requireTag(
        actor,
        tagId,
      );

    this.policy.delete(
      actor,
      tag,
    );

    await this.gateway.delete(
      actor,
      tagId,
    );
  }

  ////////////////////////////////////////////////////////////
  // CONVERSATION TAGS
  ////////////////////////////////////////////////////////////

  async assign(
    actor: ChatActor,
    data: AssignTag,
  ): Promise<void> {
    const tag =
      await this.requireTag(
        actor,
        data.tagId,
      );

    this.policy.assign(
      actor,
      tag,
      data,
    );

    await this.gateway.assign(
      actor,
      data,
    );
  }

  async remove(
    actor: ChatActor,
    data: RemoveTag,
  ): Promise<void> {
    const tag =
      await this.requireTag(
        actor,
        data.tagId,
      );

    this.policy.remove(
      actor,
      tag,
      data,
    );

    await this.gateway.remove(
      actor,
      data,
    );
  }

  async listByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<
    ConversationTag[]
  > {
    this.policy.listByConversation(
      actor,
      conversationId,
    );

    return this.gateway.findByConversation(
      actor,
      conversationId,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireTag(
    actor: ChatActor,
    tagId: string,
  ): Promise<ConversationTag> {
    const tag =
      await this.gateway.findById(
        actor,
        tagId,
      );

    if (!tag) {
      throw new BusinessRuleError(
        "Conversation tag not found.",
      );
    }

    return tag;
  }
}