import { prisma } from "../../lib/prismadb.js";

import type {
  EventOutbox as PrismaEventOutbox,
} from "@prisma/client";

import type { ChatActor } from "../interfaces/actor.interface.js";

import type { IEventOutboxGateway } from "../gateway-interface/outbox-event.gateway.interface.js";

import type {
  CreateOutboxEvent,
  EventOutbox,
} from "../schema_types/outbox-event.type.js";

export class PrismaEventOutboxGateway
  implements IEventOutboxGateway
{
  ////////////////////////////////////////////////////////////
  // MAPPER
  ////////////////////////////////////////////////////////////

  private map(
    event: PrismaEventOutbox,
  ): EventOutbox {
    return {
      id: event.id,
      eventId: event.eventId,

      type: event.type,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,

      payload: event.payload,

      status: event.status,

      attempts: event.attempts,

      lastError: event.lastError,

      createdAt: event.createdAt,
      processedAt: event.processedAt,
      scheduledAt: event.scheduledAt,
      lockedAt: event.lockedAt,
      lockedBy: event.lockedBy,
      expiresAt: event.expiresAt,
    };
  }

  ////////////////////////////////////////////////////////////
  // CREATE
  ////////////////////////////////////////////////////////////
async create(
  actor: ChatActor,
  data: CreateOutboxEvent,
): Promise<EventOutbox> {
  const event =
    await prisma.eventOutbox.create({
      data: {
        type: data.type,
        aggregateType:
          data.aggregateType,
        aggregateId:
          data.aggregateId,
        payload: data.payload,

        ...(data.scheduledAt && {
          scheduledAt:
            data.scheduledAt,
        }),

        ...(data.expiresAt && {
          expiresAt:
            data.expiresAt,
        }),
      },
    });

  return this.map(event);
}

async createMany(
  actor: ChatActor,
  data: CreateOutboxEvent[],
): Promise<EventOutbox[]> {
  const events =
    await prisma.$transaction(
      data.map((item) =>
        prisma.eventOutbox.create({
          data: {
            type: item.type,
            aggregateType:
              item.aggregateType,
            aggregateId:
              item.aggregateId,
            payload: item.payload,

            ...(item.scheduledAt && {
              scheduledAt:
                item.scheduledAt,
            }),

            ...(item.expiresAt && {
              expiresAt:
                item.expiresAt,
            }),
          },
        }),
      ),
    );

  return events.map((event) =>
    this.map(event),
  );
}
    ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    actor: ChatActor,
    id: string,
    data: Partial<EventOutbox>,
  ): Promise<EventOutbox> {
    const event =
      await prisma.eventOutbox.update({
        where: {
          id,
        },
        data,
      });

    return this.map(event);
  }

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox | null> {
    const event =
      await prisma.eventOutbox.findUnique({
        where: {
          id,
        },
      });

    return event
      ? this.map(event)
      : null;
  }

  async findMany(
    actor: ChatActor,
    limit = 100,
  ): Promise<EventOutbox[]> {
    const events =
      await prisma.eventOutbox.findMany({
        orderBy: {
          createdAt: "asc",
        },
        take: limit,
      });

    return events.map((event) =>
      this.map(event),
    );
  }

  async count(): Promise<number> {
    return prisma.eventOutbox.count();
  }

    ////////////////////////////////////////////////////////////
  // PROCESSING
  ////////////////////////////////////////////////////////////

  async claimNextBatch(
    actor: ChatActor,
    workerId: string,
    batchSize: number,
  ): Promise<EventOutbox[]> {
    return prisma.$transaction(
      async (tx) => {
        const events =
          await tx.eventOutbox.findMany({
            where: {
              status: "PENDING",
              lockedAt: null,
              OR: [
                {
                  scheduledAt: null,
                },
                {
                  scheduledAt: {
                    lte: new Date(),
                  },
                },
              ],
            },

            orderBy: {
              createdAt: "asc",
            },

            take: batchSize,
          });

        if (
          events.length === 0
        ) {
          return [];
        }

        const ids =
          events.map(
            (event) => event.id,
          );

        await tx.eventOutbox.updateMany({
          where: {
            id: {
              in: ids,
            },
          },
          data: {
            status:
              "PROCESSING",
            lockedAt:
              new Date(),
            lockedBy:
              workerId,
          },
        });

        const locked =
          await tx.eventOutbox.findMany({
            where: {
              id: {
                in: ids,
              },
            },
          });

        return locked.map((event) =>
          this.map(event),
        );
      },
    );
  }

  ////////////////////////////////////////////////////////////
  // LOCKING
  ////////////////////////////////////////////////////////////

  async lock(
    actor: ChatActor,
    id: string,
    workerId: string,
  ): Promise<EventOutbox> {
    const event =
      await prisma.eventOutbox.update({
        where: {
          id,
        },
        data: {
          lockedAt:
            new Date(),
          lockedBy:
            workerId,
          status:
            "PROCESSING",
        },
      });

    return this.map(event);
  }

  async unlock(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox> {
    const event =
      await prisma.eventOutbox.update({
        where: {
          id,
        },
        data: {
          lockedAt: null,
          lockedBy: null,
          status: "PENDING",
        },
      });

    return this.map(event);
  }
  ////////////////////////////////////////////////////////////
  // HOUSEKEEPING
  ////////////////////////////////////////////////////////////

  async deleteExpired(): Promise<number> {
    const result =
      await prisma.eventOutbox.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

    return result.count;
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    id: string,
  ): Promise<void> {
    await prisma.eventOutbox.delete({
      where: {
        id,
      },
    });
  }
}