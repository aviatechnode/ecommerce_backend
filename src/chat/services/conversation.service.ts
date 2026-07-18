import { NotFoundError } from "../_shared/not-found.error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationGateway } from "../gateway-interface/conversation.gateway.interface.js";
import type { IConversationService } from "../interfaces/conversation.interface.js";
import type {
  ArchiveConversation,
  AssignConversation,
  CloseConversation,
  Conversation,
  ConversationFilters,
  CreateConversation,
  DeleteConversation,
  MergeConversation,
  RateConversation,
  ResolveConversation,
  RestoreConversation,
  TransferConversation,
  UpdateConversationDetails,
  UpdateConversationPriority,
  UpdateConversationStatus,
} from "../schema_types/conversation.type.js";
import { ConversationPolicy } from "../policies/conversation.policy.js";

export class ConversationService
  implements IConversationService
{
  constructor(
    private readonly gateway: IConversationGateway,
    private readonly policy = new ConversationPolicy(),
  ) {}

  async create(
    actor: ChatActor,
    data: CreateConversation,
  ): Promise<Conversation> {
    this.policy.create(actor, data);

    return this.gateway.create(actor, data);
  }

  async updateDetails(
    actor: ChatActor,
    conversationId: string,
    data: UpdateConversationDetails,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    this.policy.update(
      actor,
      conversation,
      data,
    );

    return this.gateway.update(
      actor,
      conversationId,
      data,
    );
  }

  async findById(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation | null> {
    const conversation =
      await this.gateway.findById(
        actor,
        conversationId,
      );

    if (!conversation) {
      return null;
    }

    this.policy.view(
      actor,
      conversation,
    );

    return conversation;
  }

  async list(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<{
    data: Conversation[];
    total: number;
  }> {
    this.policy.list(
      actor,
      filters,
    );

    return this.gateway.findManyAndCount(
      actor,
      filters,
    );
  }

  async delete(
  actor: ChatActor,
  data: DeleteConversation,
): Promise<void> {
  const conversation =
    await this.requireConversation(
      actor,
      data.conversationId,
    );

  this.policy.delete(
    actor,
    conversation,
    data,
  );

  await this.gateway.delete(
    actor,
    data,
  );
}

  async assign(
    actor: ChatActor,
    data: AssignConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.assign(
      actor,
      conversation,
      data,
    );

    return this.gateway.assign(
      actor,
      data,
    );
  }

  async transfer(
    actor: ChatActor,
    data: TransferConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.transfer(
      actor,
      conversation,
      data,
    );

    return this.gateway.transfer(
      actor,
      data,
    );
  }

  async updateStatus(
    actor: ChatActor,
    data: UpdateConversationStatus,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.updateStatus(
      actor,
      conversation,
      data,
    );

    return this.gateway.updateStatus(
      actor,
      data,
    );
  }

  async updatePriority(
    actor: ChatActor,
    data: UpdateConversationPriority,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.updatePriority(
      actor,
      conversation,
      data,
    );

    return this.gateway.updatePriority(
      actor,
      data,
    );
  }

  exists(
    id: string,
  ): Promise<boolean> {

    return this.gateway.exists(id)
  }

  async resolve(
    actor: ChatActor,
    data: ResolveConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.resolve(
      actor,
      conversation,
      data,
    );

    return this.gateway.resolve(
      actor,
      data,
    );
  }

  async close(
    actor: ChatActor,
    data: CloseConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.close(
      actor,
      conversation,
      data,
    );

    return this.gateway.close(
      actor,
      data,
    );
  }

  async reopen(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    this.policy.reopen(
      actor,
      conversation,
    );

    return this.gateway.reopen(
      actor,
      conversationId,
    );
  }

  async archive(
    actor: ChatActor,
    data: ArchiveConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.archive(
      actor,
      conversation,
      data,
    );

    return this.gateway.archive(
      actor,
      data,
    );
  }

  async restore(
    actor: ChatActor,
    data: RestoreConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.restore(
      actor,
      conversation,
      data,
    );

    return this.gateway.restore(
      actor,
      data,
    );
  }

  async lock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    this.policy.lock(
      actor,
      conversation,
    );

    return this.gateway.lock(
      actor,
      conversationId,
    );
  }

  async unlock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        conversationId,
      );

    this.policy.unlock(
      actor,
      conversation,
    );

    return this.gateway.unlock(
      actor,
      conversationId,
    );
  }

  async rate(
    actor: ChatActor,
    data: RateConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.requireConversation(
        actor,
        data.conversationId,
      );

    this.policy.rate(
      actor,
      conversation,
      data,
    );

    return this.gateway.rate(
      actor,
      data,
    );
  }

  async merge(
    actor: ChatActor,
    data: MergeConversation,
  ): Promise<Conversation> {
    const source =
      await this.requireConversation(
        actor,
        data.sourceConversationId,
      );

    const target =
      await this.requireConversation(
        actor,
        data.targetConversationId,
      );

    this.policy.merge(
      actor,
      source,
      target,
      data,
    );

    return this.gateway.merge(
      actor,
      data,
    );
  }

  private async requireConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.gateway.findById(
        actor,
        conversationId,
      );

    if (!conversation) {
      throw new NotFoundError(
        "Conversation not found.",
      );
    }

    return conversation;
  }
}