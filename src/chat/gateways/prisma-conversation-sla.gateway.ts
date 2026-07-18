import { prisma } from "../../lib/prismadb.js";

import type {
  PrismaInstance,
} from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IConversationSLAGateway } from "../gateway-interface/conversation-sla.gateway.interface.js";

import type {
  ConversationSLA,
  UpdateSLA,
} from "../schema_types/conversation-sla.type.js";
import { ConversationSLASchema } from "../schemas/conversation-sla.schema.js";

export class PrismaConversationSLAGateway
  implements IConversationSLAGateway
{
  constructor(
    private readonly db: PrismaInstance = prisma,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    _actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA> {
    const sla =
      await this.db.conversationSLA.create({
        data: {
          conversationId,
        },
      });

    return ConversationSLASchema.parse(
      sla,
    );
  }

  async findById(
    _actor: ChatActor,
    id: string,
  ): Promise<ConversationSLA | null> {
    const sla =
      await this.db.conversationSLA.findUnique({
        where: {
          id,
        },
      });

    if (!sla) {
      return null;
    }

    return ConversationSLASchema.parse(
      sla,
    );
  }

  async findByConversation(
    _actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationSLA | null> {
    const sla =
      await this.db.conversationSLA.findUnique({
        where: {
          conversationId,
        },
      });

    if (!sla) {
      return null;
    }

    return ConversationSLASchema.parse(
      sla,
    );
  }

  async update(
    _actor: ChatActor,
    data: UpdateSLA,
  ): Promise<ConversationSLA> {
    const sla =
      await this.db.conversationSLA.update({
        where: {
          conversationId:
            data.conversationId,
        },

        data: {
          ...(data.firstResponseDueAt !==
            undefined && {
            firstResponseDueAt:
              data.firstResponseDueAt,
          }),

          ...(data.resolutionDueAt !==
            undefined && {
            resolutionDueAt:
              data.resolutionDueAt,
          }),

          ...(data.firstRespondedAt !==
            undefined && {
            firstRespondedAt:
              data.firstRespondedAt,
          }),

          ...(data.resolvedAt !==
            undefined && {
            resolvedAt:
              data.resolvedAt,
          }),

          ...(data.breachedFirstResponse !==
            undefined && {
            breachedFirstResponse:
              data.breachedFirstResponse,
          }),

          ...(data.breachedResolution !==
            undefined && {
            breachedResolution:
              data.breachedResolution,
          }),
        },
      });

    return ConversationSLASchema.parse(
      sla,
    );
  }

  async delete(
    _actor: ChatActor,
    conversationId: string,
  ): Promise<void> {
    await this.db.conversationSLA.delete({
      where: {
        conversationId,
      },
    });
  }
}