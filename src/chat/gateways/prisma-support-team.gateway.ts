import type { PrismaInstance } from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { ISupportTeamGateway } from "../gateway-interface/support-team.gateway.interface.js";

import type {
  CreateSupportTeam,
  SupportTeam,
  UpdateSupportTeam,
} from "../schema_types/support-team.type.js";

export class PrismaSupportTeamGateway
  implements ISupportTeamGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
  actor: ChatActor,
  data: CreateSupportTeam,
): Promise<SupportTeam> {
  return this.prisma.supportTeam.create({
    data: {
      name: data.name,

      description:
        data.description ?? null,

      slug:
        data.slug ?? null,

      isActive:
        data.isActive,

      createdById:
        data.createdById ??
        ("userId" in actor
          ? actor.userId
          : null),
    },
  }) as Promise<SupportTeam>;
}
  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    actor: ChatActor,
    data: UpdateSupportTeam,
  ): Promise<SupportTeam> {
    return this.prisma.supportTeam.update({
      where: {
        id: data.teamId,
      },

      data: {
        ...(data.name !== undefined && {
          name: data.name,
        }),

        ...(data.description !==
          undefined && {
          description:
            data.description,
        }),

        ...(data.slug !==
          undefined && {
          slug: data.slug,
        }),

        ...(data.isActive !==
          undefined && {
          isActive:
            data.isActive,
        }),
      },
    }) as Promise<SupportTeam>;
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<SupportTeam | null> {
    return this.prisma.supportTeam.findUnique({
      where: {
        id,
      },
    }) as Promise<SupportTeam | null>;
  }

  async findBySlug(
    actor: ChatActor,
    slug: string,
  ): Promise<SupportTeam | null> {
    return this.prisma.supportTeam.findUnique({
      where: {
        slug,
      },
    }) as Promise<SupportTeam | null>;
  }

  async findMany(
    actor: ChatActor,
  ): Promise<SupportTeam[]> {
    return this.prisma.supportTeam.findMany({
      orderBy: {
        name: "asc",
      },
    }) as Promise<SupportTeam[]>;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    id: string,
  ): Promise<void> {
    await this.prisma.supportTeam.delete({
      where: {
        id,
      },
    });
  }
}