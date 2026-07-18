import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IConversationParticipantGateway } from "../gateway-interface/conservation-participant.gateway.interface.js";

import { requireAuthenticated, type ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationParticipantService } from "../interfaces/conversation-participant.interface.js";

import { ConversationParticipantPolicy } from "../policies/conversation-participant.policy.js";

import type {
  AddParticipant,
  ConversationParticipant,
  ListParticipants,
  MarkConversationRead,
  MuteParticipant,
  RemoveParticipant,
  UnreadCount,
} from "../schema_types/convsersation-participant.type.js";

export class ConversationParticipantService
  implements IConversationParticipantService
{
  constructor(
    private readonly gateway: IConversationParticipantGateway,

    private readonly policy: ConversationParticipantPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async add(
    actor: ChatActor,
    data: AddParticipant,
  ): Promise<ConversationParticipant> {
    this.policy.add(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async remove(
    actor: ChatActor,
    data: RemoveParticipant,
  ): Promise<void> {
    const participant =
      await this.requireParticipant(
        actor,
        data.conversationId,
      );

    this.policy.remove(
      actor,
      participant,
      data,
    );

    await this.gateway.delete(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationParticipant | null> {
    const participant =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!participant) {
      return null;
    }

    this.policy.view(
      actor,
      participant,
    );

    return participant;
  }

  async findByConversation(
  actor: ChatActor,
  conversationId: string,
): Promise<ConversationParticipant[]> {
  this.policy.findByConversation(
    actor,
    conversationId,
  );

  return this.gateway.findByConversation(
    actor,
    conversationId,
  );
}

  async list(
  actor: ChatActor,
  data: ListParticipants,
): Promise<ConversationParticipant[]> {
  this.policy.list(
    actor,
    data,
  );

  return this.gateway.list(
    actor,
    data,
  );
}

  async findByUser(
    actor: ChatActor,
  ): Promise<
    ConversationParticipant[]
  > {
    this.policy.findByUser(
      actor,
    );

    return this.gateway.findByUser(
      actor,
    );
  }

  async findParticipant(
    actor: ChatActor,
    conversationId: string,
  ): Promise<
    ConversationParticipant | null
  > {
    const participant =
      await this.gateway.findParticipant(
        actor,
        conversationId,
      );

    if (!participant) {
      return null;
    }

    this.policy.view(
      actor,
      participant,
    );

    return participant;
  }

  ////////////////////////////////////////////////////////////
  // MUTE
  ////////////////////////////////////////////////////////////
  async mute(
    actor: ChatActor,
    data: MuteParticipant,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.requireParticipant(
        actor,
        data.conversationId,
      );

    this.policy.mute(
      actor,
      participant,
      data,
    );

    return this.gateway.mute(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // UNREAD
  ////////////////////////////////////////////////////////////

  async updateUnreadCount(
    actor: ChatActor,
    data: UnreadCount,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.requireParticipant(
        actor,
        data.conversationId,
      );

    this.policy.updateUnreadCount(
      actor,
      participant,
      data,
    );

    return this.gateway.updateUnreadCount(
      actor,
      data,
    );
  }

  async incrementUnreadCount(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.requireParticipant(
        actor,
        conversationId,
      );

    this.policy.incrementUnreadCount(
      actor,
      participant,
    );

    return this.gateway.incrementUnreadCount(
      actor,
      conversationId,
      participant.userId,
    );
  }


    async incrementUnreadForOthers(
  actor: ChatActor,
  conversationId: string,
  excludedUserId: string,
): Promise<void> {
  requireAuthenticated(actor);

  const participants =
    await this.gateway.findByConversation(
      actor,
      conversationId,
    );

  await Promise.all(
    participants
      .filter(
        participant =>
          participant.userId !== excludedUserId,
      )
      .map(participant =>
        this.gateway.incrementUnreadCount(
          actor,
          conversationId,
          participant.userId,
        ),
      ),
  );
}

  async resetUnreadCount(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.requireParticipant(
        actor,
        conversationId,
      );

    this.policy.resetUnreadCount(
      actor,
      participant,
    );

    return this.gateway.resetUnreadCount(
      actor,
      conversationId,
      participant.userId,
    );
  }

  ////////////////////////////////////////////////////////////
  // READ
  ////////////////////////////////////////////////////////////

  async markConversationRead(
    actor: ChatActor,
    data: MarkConversationRead,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.requireParticipant(
        actor,
        data.conversationId,
      );

    this.policy.markConversationRead(
      actor,
      participant,
      data,
    );

    return this.gateway.markConversationRead(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireParticipant(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationParticipant> {
    const participant =
      await this.gateway.findParticipant(
        actor,
        conversationId,
      );

    if (!participant) {
      throw new BusinessRuleError(
        "Conversation participant not found.",
      );
    }

    return participant;
  }
}