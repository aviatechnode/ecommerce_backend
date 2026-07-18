import { Prisma } from "@prisma/client";
import type { PrismaInstance } from "../../lib/prismadb.js";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { ISupportTeamEventGateway } from "../gateway-interface/support-team-event.gateway.interface.js";

import type {
  ListSupportTeamEvents,
  RecordSupportTeamEvent,
  SupportTeamEvent,
} from "../schema_types/support-team-event.type.js";

export class PrismaSupportTeamEventGateway
  implements ISupportTeamEventGateway
{
  constructor(
    private readonly prisma: PrismaInstance,
  ) {}

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
  actor: ChatActor,
  data: RecordSupportTeamEvent,
): Promise<SupportTeamEvent> {
  const createData: Prisma.SupportTeamEventUncheckedCreateInput = {
    teamId: data.teamId,

    type: data.type,

    userId: data.userId ?? null,

    actorId: data.actorId ?? null,
  };

  if (data.oldValue !== undefined) {
    createData.oldValue =
      data.oldValue as Prisma.InputJsonValue;
  }

  if (data.newValue !== undefined) {
    createData.newValue =
      data.newValue as Prisma.InputJsonValue;
  }

  return this.prisma.supportTeamEvent.create({
    data: createData,
  }) as Promise<SupportTeamEvent>;
}
  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    eventId: string,
  ): Promise<SupportTeamEvent | null> {
    return this.prisma.supportTeamEvent.findUnique({
      where: {
        id: eventId,
      },
    }) as Promise<SupportTeamEvent | null>;
  }

  async findMany(
    actor: ChatActor,
    filters: ListSupportTeamEvents,
  ): Promise<SupportTeamEvent[]> {
    return this.prisma.supportTeamEvent.findMany({
      where: {
        teamId: filters.teamId,

        ...(filters.type !==
          undefined && {
          type: filters.type,
        }),
      },

      skip:
        (filters.page - 1) *
        filters.limit,

      take: filters.limit,

      orderBy: {
        createdAt: "desc",
      },
    }) as Promise<SupportTeamEvent[]>;
  }
}