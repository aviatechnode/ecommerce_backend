import type { PrismaInstance } from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { ISupportTeamMemberGateway } from "../gateway-interface/support-team-member.gateway.interface.js";

import type {
  AddSupportTeamMember,
  ListSupportTeamMembers,
  RemoveSupportTeamMember,
  SupportTeamMember,
  UpdateSupportTeamMember,
} from "../schema_types/support-team-member.type.js";

export class PrismaSupportTeamMemberGateway
  implements ISupportTeamMemberGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    actor: ChatActor,
    data: AddSupportTeamMember,
  ): Promise<SupportTeamMember> {
    return this.prisma.supportTeamMember.create({
      data: {
        teamId: data.teamId,

        userId: data.userId,

        roleId: data.roleId,
      },
    }) as Promise<SupportTeamMember>;
  }

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    actor: ChatActor,
    data: UpdateSupportTeamMember,
  ): Promise<SupportTeamMember> {
    return this.prisma.supportTeamMember.update({
      where: {
        id: data.memberId,
      },

      data: {
        ...(data.roleId !== undefined && {
          roleId: data.roleId,
        }),

        ...(data.isActive !== undefined && {
          isActive: data.isActive,
        }),
      },
    }) as Promise<SupportTeamMember>;
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    memberId: string,
  ): Promise<SupportTeamMember | null> {
    return this.prisma.supportTeamMember.findUnique({
      where: {
        id: memberId,
      },
    }) as Promise<SupportTeamMember | null>;
  }

  async findMany(
    actor: ChatActor,
    filters: ListSupportTeamMembers,
  ): Promise<SupportTeamMember[]> {
    return this.prisma.supportTeamMember.findMany({
      where: {
        teamId: filters.teamId,

        ...(filters.isActive !== undefined && {
          isActive: filters.isActive,
        }),
      },

      skip:
        (filters.page - 1) *
        filters.limit,

      take: filters.limit,

      orderBy: {
        createdAt: "desc",
      },
    }) as Promise<SupportTeamMember[]>;
  }

  async findByUser(
    actor: ChatActor,
    userId: string,
  ): Promise<SupportTeamMember[]> {
    return this.prisma.supportTeamMember.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    }) as Promise<SupportTeamMember[]>;
  }

  async findByTeam(
    actor: ChatActor,
    teamId: string,
  ): Promise<SupportTeamMember[]> {
    return this.prisma.supportTeamMember.findMany({
      where: {
        teamId,
      },

      orderBy: {
        createdAt: "desc",
      },
    }) as Promise<SupportTeamMember[]>;
  }

  async findMembership(
    actor: ChatActor,
    teamId: string,
    userId: string,
  ): Promise<SupportTeamMember | null> {
    return this.prisma.supportTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    }) as Promise<SupportTeamMember | null>;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    data: RemoveSupportTeamMember,
  ): Promise<void> {
    await this.prisma.supportTeamMember.delete({
      where: {
        id: data.memberId,
      },
    });
  }
}