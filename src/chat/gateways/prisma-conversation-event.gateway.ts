import { prisma } from "../../lib/prismadb.js";

import type {
  PrismaInstance,
} from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IConversationEventGateway } from "../gateway-interface/conversation-event.gateway.interface.js";

import type {
  ConversationEvent,
  CreateConversationEvent,
  ListConversationEvents,
} from "../schema_types/conversation-event.type.js";
import { ConversationEventSchema } from "../schemas/events/conversation-event.schema.js";

export class PrismaConversationEventGateway
  implements IConversationEventGateway
{
  constructor(
    private readonly db: PrismaInstance = prisma,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateConversationEvent,
  ): Promise<ConversationEvent> {
    const event =
      await this.db.conversationEvent.create({
        data: {
          conversationId:
            data.conversationId,

          actorId:
            "userId" in actor
              ? actor.userId
              : null,

          type:
            data.type,

          ...(data.description !==
            undefined && {
            description:
              data.description,
          }),

          ...(data.oldValue !==
            undefined && {
            oldValue:
              data.oldValue,
          }),

          ...(data.newValue !==
            undefined && {
            newValue:
              data.newValue,
          }),

          ...(data.metadata !==
            undefined && {
            metadata:
              data.metadata,
          }),
        },
      });

    return ConversationEventSchema.parse(
      event,
    );
  }

  async findById(
    _actor: ChatActor,
    id: string,
  ): Promise<ConversationEvent | null> {
    const event =
      await this.db.conversationEvent.findUnique({
        where: {
          id,
        },
      });

    if (!event) {
      return null;
    }

    return ConversationEventSchema.parse(
      event,
    );
  }

  async list(
    _actor: ChatActor,
    filters: ListConversationEvents,
  ): Promise<ConversationEvent[]> {
    const events =
      await this.db.conversationEvent.findMany({
        where: {
          conversationId:
            filters.conversationId,

          ...(filters.type && {
            type:
              filters.type,
          }),
        },

        skip:
          (filters.page - 1) *
          filters.limit,

        take:
          filters.limit,

        orderBy: {
          createdAt:
            "desc",
        },
      });

    return events.map(
      (event) =>
        ConversationEventSchema.parse(
          event,
        ),
    );
  }

  async count(
    _actor: ChatActor,
    filters?: Partial<ListConversationEvents>,
  ): Promise<number> {
    return this.db.conversationEvent.count({
      where: {
        ...(filters?.conversationId && {
          conversationId:
            filters.conversationId,
        }),

        ...(filters?.type && {
          type:
            filters.type,
        }),
      },
    });
  }

  async delete(
    _actor: ChatActor,
    id: string,
  ): Promise<void> {
    await this.db.conversationEvent.delete({
      where: {
        id,
      },
    });
  }
}