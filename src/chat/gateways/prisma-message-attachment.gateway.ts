import type { PrismaInstance } from "../../lib/prismadb.js";
import type { Prisma } from "@prisma/client";

import {
  isGuest,
} from "../interfaces/actor.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IMessageAttachmentGateway } from "../gateway-interface/message-attachment.gateway.interface.js";

import { isAuthenticated, } from "../interfaces/actor.interface.js";
import type {
  MessageAttachment,
  SearchAttachments,
  UploadAttachment,
} from "../schema_types/message-attachment.type.js";

export class PrismaMessageAttachmentGateway
  implements IMessageAttachmentGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  async create(
  actor: ChatActor,
  data: UploadAttachment,
): Promise<MessageAttachment> {
  return this.prisma.messageAttachment.create({
    data: {
      messageId:
        data.messageId,

      url:
        data.url,

      filename:
        data.filename,

      mimeType:
        data.mimeType,

      extension:
        data.extension ?? null,

      size:
        data.size,

      storageKey:
        data.storageKey,

      uploadedById:
        isAuthenticated(actor)
          ? actor.userId
          : null,
    },
  }) as Promise<MessageAttachment>;
}

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageAttachment | null> {
    return this.prisma.messageAttachment.findUnique({
      where: {
        id,
      },
    }) as Promise<MessageAttachment | null>;
  }

  async findByMessage(
    actor: ChatActor,
    messageId: string,
  ): Promise<MessageAttachment[]> {
    return this.prisma.messageAttachment.findMany({
      where: {
        messageId,
      },

      orderBy: {
        createdAt: "asc",
      },
    }) as Promise<MessageAttachment[]>;
  }

  async search(
  actor: ChatActor,
  filters: SearchAttachments,
): Promise<MessageAttachment[]> {
  const where: Prisma.MessageAttachmentWhereInput = {};

  if (filters.messageId) {
    where.messageId = filters.messageId;
  }

  if (filters.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }

  if (filters.mimeType) {
    where.mimeType = {
      contains: filters.mimeType,
      mode: "insensitive",
    };
  }

  if (filters.extension) {
    where.extension = {
      equals: filters.extension,
      mode: "insensitive",
    };
  }

  if (filters.filename) {
    where.filename = {
      contains: filters.filename,
      mode: "insensitive",
    };
  }

  return this.prisma.messageAttachment.findMany({
    where,

    skip:
      (filters.page - 1) *
      filters.limit,

    take: filters.limit,

    orderBy: {
      createdAt: "desc",
    },
  }) as Promise<MessageAttachment[]>;
}

async count(
  actor: ChatActor,
  filters?: Partial<SearchAttachments>,
): Promise<number> {
  const where: Prisma.MessageAttachmentWhereInput = {};

  if (filters?.messageId) {
    where.messageId = filters.messageId;
  }

  if (filters?.uploadedById) {
    where.uploadedById = filters.uploadedById;
  }

  if (filters?.mimeType) {
    where.mimeType = {
      contains: filters.mimeType,
      mode: "insensitive",
    };
  }

  if (filters?.extension) {
    where.extension = {
      equals: filters.extension,
      mode: "insensitive",
    };
  }

  if (filters?.filename) {
    where.filename = {
      contains: filters.filename,
      mode: "insensitive",
    };
  }

  return this.prisma.messageAttachment.count({
    where,
  });
}
  async delete(
    actor: ChatActor,
    attachmentId: string,
  ): Promise<void> {
    await this.prisma.messageAttachment.delete({
      where: {
        id: attachmentId,
      },
    });
  }
}