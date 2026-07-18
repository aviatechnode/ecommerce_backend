import { prisma } from "../../lib/prismadb.js";

import type {
  PrismaInstance,
} from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IConversationTagGateway } from "../gateway-interface/conversation-tag.gateway.interface.js";

import type {
  AssignTag,
  ConversationTag,
  CreateTag,
  RemoveTag,
  UpdateTag,
} from "../schema_types/conversation-tag.type.js";

import { ConversationTagSchema } from "../schemas/conversation-tag.schema.js";

export class PrismaConversationTagGateway
  implements IConversationTagGateway
{
  constructor(
    private readonly db: PrismaInstance = prisma,
  ) {}

  ////////////////////////////////////////////////////////////
  // TAG CRUD
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: CreateTag,
  ): Promise<ConversationTag> {
    const tag =
      await this.db.conversationTag.create({
        data: {
          name: data.name,

          color: data.color ?? null,
        },
      });

    return ConversationTagSchema.parse(
      tag,
    );
  }

  async update(
    actor: ChatActor,
    data: UpdateTag,
  ): Promise<ConversationTag> {
    const tag =
      await this.db.conversationTag.update({
        where: {
          id: data.tagId,
        },

        data: {
          ...(data.name !== undefined && {
            name: data.name,
          }),

          ...(data.color !== undefined && {
            color: data.color,
          }),
        },
      });

    return ConversationTagSchema.parse(
      tag,
    );
  }

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<ConversationTag | null> {
    const tag =
      await this.db.conversationTag.findUnique({
        where: {
          id,
        },
      });

    if (!tag) {
      return null;
    }

    return ConversationTagSchema.parse(
      tag,
    );
  }

  async findByName(
    actor: ChatActor,
    name: string,
  ): Promise<ConversationTag | null> {
    const tag =
      await this.db.conversationTag.findUnique({
        where: {
          name,
        },
      });

    if (!tag) {
      return null;
    }

    return ConversationTagSchema.parse(
      tag,
    );
  }

  async findMany(): Promise<
    ConversationTag[]
  > {
    const tags =
      await this.db.conversationTag.findMany({
        orderBy: {
          name: "asc",
        },
      });

    return tags.map((tag) =>
      ConversationTagSchema.parse(
        tag,
      ),
    );
  }

  async delete(
    actor: ChatActor,
    tagId: string,
  ): Promise<void> {
    await this.db.conversationTag.delete({
      where: {
        id: tagId,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // CONVERSATION TAGS
  ////////////////////////////////////////////////////////////

  async assign(
    actor: ChatActor,
    data: AssignTag,
  ): Promise<void> {
    await this.db.conversationTagPivot.create({
      data: {
        conversationId:
          data.conversationId,

        tagId: data.tagId,
      },
    });
  }

  async remove(
    actor: ChatActor,
    data: RemoveTag,
  ): Promise<void> {
    await this.db.conversationTagPivot.delete({
      where: {
        conversationId_tagId: {
          conversationId:
            data.conversationId,

          tagId: data.tagId,
        },
      },
    });
  }

  async findByConversation(
    actor: ChatActor,
    conversationId: string,
  ): Promise<ConversationTag[]> {
    const tags =
      await this.db.conversationTag.findMany({
        where: {
          conversations: {
            some: {
              conversationId,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      });

    return tags.map((tag) =>
      ConversationTagSchema.parse(
        tag,
      ),
    );
  }
}