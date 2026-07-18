import { prisma } from "../../lib/prismadb.js";
import { Prisma } from "@prisma/client";

import type {
  PrismaInstance,
} from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type {
  IConversationGateway,
} from "../gateway-interface/conversation.gateway.interface.js";

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

import {
  ConversationSchema,
} from "../schemas/conversation.schema.js";

export class PrismaConversationGateway
  implements IConversationGateway
{
  constructor(
    private readonly db: PrismaInstance = prisma,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.create({
        data: {
          ...(data.customerId !== undefined && {
            customerId:
              data.customerId,
          }),

          ...(data.guestSessionId !== undefined && {
            guestSessionId:
              data.guestSessionId,
          }),

          ...(data.guestName !== undefined && {
            guestName:
              data.guestName,
          }),

          ...(data.guestEmail !== undefined && {
            guestEmail:
              data.guestEmail,
          }),

          ...(data.guestPhone !== undefined && {
            guestPhone:
              data.guestPhone,
          }),

          ...(data.orderId !== undefined && {
            orderId:
              data.orderId,
          }),

          ...(data.productId !== undefined && {
            productId:
              data.productId,
          }),

          ...(data.vehicleId !== undefined && {
            vehicleId:
              data.vehicleId,
          }),

          ...(data.subject !== undefined && {
            subject:
              data.subject,
          }),

          ...(data.language !== undefined && {
            language:
              data.language,
          }),

          ...(data.source !== undefined && {
            source:
              data.source,
          }),

          ...(data.channel !== undefined && {
            channel:
              data.channel,
          }),

          createdById:
            "userId" in actor
              ? actor.userId
              : null,

          status:
            "OPEN",

          priority:
            "NORMAL",

          assignmentMethod:
            "AUTOMATIC",

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async update(
    actor: ChatActor,
    id: string,
    data: UpdateConversationDetails,
  ): Promise<Conversation> {
    const updateData = {
      ...(data.subject !== undefined && {
        subject:
          data.subject,
      }),

      ...(data.language !== undefined && {
        language:
          data.language,
      }),

      ...(data.guestName !== undefined && {
        guestName:
          data.guestName,
      }),

      ...(data.guestPhone !== undefined && {
        guestPhone:
          data.guestPhone,
      }),

      ...(data.orderId !== undefined && {
        orderId:
          data.orderId,
      }),

      ...(data.productId !== undefined && {
        productId:
          data.productId,
      }),

      ...(data.vehicleId !== undefined && {
        vehicleId:
          data.vehicleId,
      }),
    };

    const conversation =
      await this.db.conversation.update({
        where: {
          id,
        },

        data: updateData,
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<Conversation | null> {
    const conversation =
      await this.db.conversation.findUnique({
        where: {
          id,
        },
      });

    if (!conversation) {
      return null;
    }

    return ConversationSchema.parse(
      conversation,
    );
  }

  async findMany(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<Conversation[]> {
    const page =
      filters?.page ?? 1;

    const limit =
      filters?.limit ?? 20;

    const where:
      Prisma.ConversationWhereInput = {
      ...(filters?.customerId && {
        customerId:
          filters.customerId,
      }),

      ...(filters?.assignedUserId && {
        assignedUserId:
          filters.assignedUserId,
      }),

      ...(filters?.teamId && {
        teamId:
          filters.teamId,
      }),

      ...(filters?.status && {
        status:
          filters.status,
      }),

      ...(filters?.priority && {
        priority:
          filters.priority,
      }),

      ...(filters?.channel && {
        channel:
          filters.channel,
      }),

      ...(filters?.source && {
        source:
          filters.source,
      }),

      ...(filters?.language && {
        language:
          filters.language,
      }),

      ...(filters?.isLocked !== undefined && {
        isLocked:
          filters.isLocked,
      }),

      ...(filters?.archived !== undefined && {
        archivedAt:
          filters.archived
            ? {
                not: null,
              }
            : null,
      }),

      ...(filters?.search && {
        OR: [
          {
            subject: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },

          {
            guestName: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },

          {
            guestEmail: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },
        ],
      }),
    };

    const conversations =
      await this.db.conversation.findMany({
        where,

        skip:
          (page - 1) * limit,

        take:
          limit,

        orderBy: {
          lastActivityAt:
            "desc",
        },
      });

    return conversations.map(
      conversation =>
        ConversationSchema.parse(
          conversation,
        ),
    );
  }

  async count(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<number> {
    const where:
      Prisma.ConversationWhereInput = {
      ...(filters?.customerId && {
        customerId:
          filters.customerId,
      }),

      ...(filters?.assignedUserId && {
        assignedUserId:
          filters.assignedUserId,
      }),

      ...(filters?.teamId && {
        teamId:
          filters.teamId,
      }),

      ...(filters?.status && {
        status:
          filters.status,
      }),

      ...(filters?.priority && {
        priority:
          filters.priority,
      }),

      ...(filters?.channel && {
        channel:
          filters.channel,
      }),

      ...(filters?.source && {
        source:
          filters.source,
      }),

      ...(filters?.language && {
        language:
          filters.language,
      }),

      ...(filters?.isLocked !== undefined && {
        isLocked:
          filters.isLocked,
      }),

      ...(filters?.archived !== undefined && {
        archivedAt:
          filters.archived
            ? {
                not: null,
              }
            : null,
      }),

      ...(filters?.search && {
        OR: [
          {
            subject: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },

          {
            guestName: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },

          {
            guestEmail: {
              contains:
                filters.search,

              mode:
                Prisma.QueryMode
                  .insensitive,
            },
          },
        ],
      }),
    };

    return this.db.conversation.count({
      where,
    });
  }

  async findManyAndCount(
    actor: ChatActor,
    filters?: ConversationFilters,
  ): Promise<{
    data: Conversation[];
    total: number;
  }> {
    const [
      data,
      total,
    ] = await Promise.all([
      this.findMany(
        actor,
        filters,
      ),

      this.count(
        actor,
        filters,
      ),
    ]);

    return {
      data,
      total,
    };
  }

  async exists(
    id: string,
  ): Promise<boolean> {
    const conversation =
      await this.db.conversation.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
        },
      });

    return conversation !== null;
  }

  async delete(
    actor: ChatActor,
    data: DeleteConversation,
  ): Promise<void> {
    if (data.hardDelete) {
      await this.db.conversation.delete({
        where: {
          id:
            data.conversationId,
        },
      });

      return;
    }

    await this.db.conversation.update({
      where: {
        id:
          data.conversationId,
      },

      data: {
        deletedAt:
          new Date(),

        deletedById:
          "userId" in actor
            ? actor.userId
            : null,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // ASSIGNMENT
  ////////////////////////////////////////////////////////////

  async assign(
    actor: ChatActor,
    data: AssignConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          assignedUserId:
            data.assignedUserId ?? null,

          teamId:
            data.teamId ?? null,

          assignedAt:
            now,

          assignmentMethod:
            data.assignmentMethod,

          lastActivityAt:
            now,

          firstAssignedAt: {
            set:
              now,
          },
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async transfer(
    actor: ChatActor,
    data: TransferConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          assignedUserId:
            data.assignedUserId ?? null,

          teamId:
            data.teamId ?? null,

          assignedAt:
            now,

          assignmentMethod:
            data.assignmentMethod,

          lastActivityAt:
            now,
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  ////////////////////////////////////////////////////////////
  // STATUS
  ////////////////////////////////////////////////////////////

  async updateStatus(
    actor: ChatActor,
    data: UpdateConversationStatus,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          status:
            data.status,

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async updatePriority(
    actor: ChatActor,
    data: UpdateConversationPriority,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          priority:
            data.priority,

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async resolve(
    actor: ChatActor,
    data: ResolveConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          status:
            "RESOLVED",

          resolvedAt:
            now,

          lastActivityAt:
            now,
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async close(
    actor: ChatActor,
    data: CloseConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          status:
            "CLOSED",

          closedAt:
            now,

          lastActivityAt:
            now,
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async reopen(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            conversationId,
        },

        data: {
          status:
            "OPEN",

          closedAt:
            null,

          resolvedAt:
            null,

          lastActivityAt:
            now,
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIFECYCLE
  ////////////////////////////////////////////////////////////

  async archive(
    actor: ChatActor,
    data: ArchiveConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          archivedAt:
            data.archived
              ? now
              : null,

          archivedById:
            data.archived &&
            "userId" in actor
              ? actor.userId
              : null,

          lastActivityAt:
            now,
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async restore(
    actor: ChatActor,
    data: RestoreConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          archivedAt:
            null,

          archivedById:
            null,

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async lock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            conversationId,
        },

        data: {
          isLocked:
            true,

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  async unlock(
    actor: ChatActor,
    conversationId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            conversationId,
        },

        data: {
          isLocked:
            false,

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  ////////////////////////////////////////////////////////////
  // RATING
  ////////////////////////////////////////////////////////////

  async rate(
    actor: ChatActor,
    data: RateConversation,
  ): Promise<Conversation> {
    const conversation =
      await this.db.conversation.update({
        where: {
          id:
            data.conversationId,
        },

        data: {
          customerRating:
            data.customerRating,

          ...(data.customerFeedback !==
            undefined && {
            customerFeedback:
              data.customerFeedback,
          }),

          lastActivityAt:
            new Date(),
        },
      });

    return ConversationSchema.parse(
      conversation,
    );
  }

  ////////////////////////////////////////////////////////////
  // ADVANCED
  ////////////////////////////////////////////////////////////

  async merge(
    actor: ChatActor,
    data: MergeConversation,
  ): Promise<Conversation> {
    const now =
      new Date();

    return this.db.$transaction(
      async tx => {
        await tx.message.updateMany({
          where: {
            conversationId:
              data.sourceConversationId,
          },

          data: {
            conversationId:
              data.targetConversationId,
          },
        });

        await tx.conversationParticipant.updateMany({
          where: {
            conversationId:
              data.sourceConversationId,
          },

          data: {
            conversationId:
              data.targetConversationId,
          },
        });

        await tx.conversationTagPivot.updateMany({
          where: {
            conversationId:
              data.sourceConversationId,
          },

          data: {
            conversationId:
              data.targetConversationId,
          },
        });

        await tx.conversationEvent.updateMany({
          where: {
            conversationId:
              data.sourceConversationId,
          },

          data: {
            conversationId:
              data.targetConversationId,
          },
        });

        await tx.notification.updateMany({
          where: {
            conversationId:
              data.sourceConversationId,
          },

          data: {
            conversationId:
              data.targetConversationId,
          },
        });

        await tx.conversation.update({
          where: {
            id:
              data.sourceConversationId,
          },

          data: {
            archivedAt:
              now,

            archivedById:
              "userId" in actor
                ? actor.userId
                : null,

            lastActivityAt:
              now,
          },
        });

        const conversation =
          await tx.conversation.update({
            where: {
              id:
                data.targetConversationId,
            },

            data: {
              lastActivityAt:
                now,
            },
          });

        return ConversationSchema.parse(
          conversation,
        );
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // LOOKUPS
  ////////////////////////////////////////////////////////////

  async findByCustomer(
    actor: ChatActor,
    customerId: string,
  ): Promise<Conversation[]> {
    const conversations =
      await this.db.conversation.findMany({
        where: {
          customerId,
        },

        orderBy: {
          lastActivityAt:
            "desc",
        },
      });

    return conversations.map(
      conversation =>
        ConversationSchema.parse(
          conversation,
        ),
    );
  }

  async findByGuestSession(
    actor: ChatActor,
    guestSessionId: string,
  ): Promise<Conversation[]> {
    const conversations =
      await this.db.conversation.findMany({
        where: {
          guestSessionId,
        },

        orderBy: {
          lastActivityAt:
            "desc",
        },
      });

    return conversations.map(
      conversation =>
        ConversationSchema.parse(
          conversation,
        ),
    );
  }

  async findByAssignee(
    actor: ChatActor,
    assignedUserId: string,
  ): Promise<Conversation[]> {
    const conversations =
      await this.db.conversation.findMany({
        where: {
          assignedUserId,
        },

        orderBy: {
          lastActivityAt:
            "desc",
        },
      });

    return conversations.map(
      conversation =>
        ConversationSchema.parse(
          conversation,
        ),
    );
  }

  async findByTeam(
    actor: ChatActor,
    teamId: string,
  ): Promise<Conversation[]> {
    const conversations =
      await this.db.conversation.findMany({
        where: {
          teamId,
        },

        orderBy: {
          lastActivityAt:
            "desc",
        },
      });

    return conversations.map(
      conversation =>
        ConversationSchema.parse(
          conversation,
        ),
    );
  }

  ////////////////////////////////////////////////////////////
  // LAST MESSAGE
  ////////////////////////////////////////////////////////////

  async updateLastMessage(
    actor: ChatActor,
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    const message =
      await this.db.message.findUnique({
        where: {
          id:
            messageId,
        },

        select: {
          id:
            true,

          content:
            true,

          senderId:
            true,

          type:
            true,

          createdAt:
            true,
        },
      });

    if (!message) {
      return;
    }

    await this.db.conversation.update({
      where: {
        id:
          conversationId,
      },

      data: {
        lastMessageId:
          message.id,

        lastMessage:
          message.content,

        lastMessageAt:
          message.createdAt,

        lastMessageById:
          message.senderId,

        lastMessageType:
          message.type,

        lastActivityAt:
          message.createdAt,
      },
    });
  }
}