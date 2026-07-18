import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IConversationSLAGateway } from "../gateway-interface/conversation-sla.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationSLAService } from "../interfaces/conversation-sla.interface.js";

import { ConversationSLAPolicy } from "../policies/conversation_sla.policy.js";

import type {
  ConversationSLA,
  UpdateSLA,
} from "../schema_types/conversation-sla.type.js";

export class ConversationSLAService
  implements IConversationSLAService
{
  constructor(
    private readonly gateway: IConversationSLAGateway,

    private readonly policy: ConversationSLAPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA> {
    this.policy.create(
      actor,
      conversationId,
    );

    return this.gateway.create(
      actor,
      conversationId,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationSLA | null> {
    const sla =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!sla) {
      return null;
    }

    this.policy.view(
      actor,
      sla,
    );

    return sla;
  }

  async findByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA | null> {
    const sla =
      await this.gateway.findByConversation(
        actor,
        conversationId,
      );

    if (!sla) {
      return null;
    }

    this.policy.view(
      actor,
      sla,
    );

    return sla;
  }

  async update(
    actor: ChatActor,
    data: UpdateSLA,
  ): Promise<ConversationSLA> {
    const sla =
      await this.requireSLA(
        actor,
        data.conversationId,
      );

    this.policy.update(
      actor,
      sla,
      data,
    );

    return this.gateway.update(
      actor,
      data,
    );
  }

  async delete(
    actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    const sla =
      await this.requireSLA(
        actor,
        conversationId,
      );

    this.policy.delete(
      actor,
      sla,
    );

    await this.gateway.delete(
      actor,
      conversationId,
    );
  }

  ////////////////////////////////////////////////////////////
  // SLA EVENTS
  ////////////////////////////////////////////////////////////

  async markFirstResponseBreached(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA> {
    const sla =
      await this.requireSLA(
        actor,
        conversationId,
      );

    this.policy.markFirstResponseBreached(
      actor,
      sla,
    );

    return this.gateway.update(
      actor,
      {
        conversationId,
        breachedFirstResponse: true,
      },
    );
  }

  async markResolutionBreached(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA> {
    const sla =
      await this.requireSLA(
        actor,
        conversationId,
      );

    this.policy.markResolutionBreached(
      actor,
      sla,
    );

    return this.gateway.update(
      actor,
      {
        conversationId,
        breachedResolution: true,
      },
    );
  }

  async markFirstResponded(
    actor: ChatActor,
    conversationId: string,
    respondedAt = new Date(),
  ): Promise<ConversationSLA> {
    const sla =
      await this.requireSLA(
        actor,
        conversationId,
      );

    this.policy.markFirstResponded(
      actor,
      sla,
    );

    return this.gateway.update(
      actor,
      {
        conversationId,
        firstRespondedAt:
          respondedAt,
      },
    );
  }

  async markResolved(
    actor: ChatActor,
    conversationId: string,
    resolvedAt = new Date(),
  ): Promise<ConversationSLA> {
    const sla =
      await this.requireSLA(
        actor,
        conversationId,
      );

    this.policy.markResolved(
      actor,
      sla,
    );

    return this.gateway.update(
      actor,
      {
        conversationId,
        resolvedAt,
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireSLA(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA> {
    const sla =
      await this.gateway.findByConversation(
        actor,
        conversationId,
      );

    if (!sla) {
      throw new BusinessRuleError(
        "Conversation SLA not found.",
      );
    }

    return sla;
  }
}