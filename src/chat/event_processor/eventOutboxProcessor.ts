import type { EventOutbox } from "@prisma/client";

import type { PrismaInstance } from "../../lib/prismadb.js";
import type { IEventHandler } from "../handlers/conversation-event.handler.js";

const MAX_ATTEMPTS = 5;
const WORKER_ID = process.pid.toString();

export class EventOutboxProcessor {
  constructor(
    private readonly prisma: PrismaInstance,
    private readonly handlers: readonly IEventHandler[],
  ) {}

  async process(): Promise<void> {
    const now = new Date();

    const events = await this.prisma.eventOutbox.findMany({
      where: {
        status: "PENDING",
        attempts: {
          lt: MAX_ATTEMPTS,
        },
        OR: [
          {
            scheduledAt: null,
          },
          {
            scheduledAt: {
              lte: now,
            },
          },
        ],
        lockedAt: null,
      },

      orderBy: {
        createdAt: "asc",
      },

      take: 100,
    });

    for (const event of events) {
      ////////////////////////////////////////////////////////////
      // CLAIM EVENT
      ////////////////////////////////////////////////////////////

      const claimed =
        await this.prisma.eventOutbox.updateMany({
          where: {
            id: event.id,
            status: "PENDING",
            lockedAt: null,
          },

          data: {
            status: "PROCESSING",
            lockedAt: new Date(),
            lockedBy: WORKER_ID,
          },
        });

      if (claimed.count === 0) {
        continue;
      }

      try {
        ////////////////////////////////////////////////////////////
        // FIND HANDLERS
        ////////////////////////////////////////////////////////////

        const handlers = this.handlers.filter((handler) =>
          handler.supports(event),
        );

        if (handlers.length === 0) {
          throw new Error(
            `No handler registered for event '${event.type}'.`,
          );
        }

        ////////////////////////////////////////////////////////////
        // HANDLE EVENT
        ////////////////////////////////////////////////////////////

        await Promise.all(
          handlers.map((handler) => handler.handle(event)),
        );

        ////////////////////////////////////////////////////////////
        // MARK PROCESSED
        ////////////////////////////////////////////////////////////

        await this.prisma.eventOutbox.update({
          where: {
            id: event.id,
          },

          data: {
            status: "PROCESSED",
            processedAt: new Date(),
            lockedAt: null,
            lockedBy: null,
            lastError: null,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown error";

        const nextAttempts = event.attempts + 1;

        ////////////////////////////////////////////////////////////
        // RETRY / FAIL
        ////////////////////////////////////////////////////////////

        await this.prisma.eventOutbox.update({
          where: {
            id: event.id,
          },

          data: {
            status:
              nextAttempts >= MAX_ATTEMPTS
                ? "FAILED"
                : "PENDING",

            attempts: {
              increment: 1,
            },

            lastError: message,

            lockedAt: null,
            lockedBy: null,
          },
        });

        console.error("Outbox processing failed", {
          eventId: event.eventId,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
          eventType: event.type,
          attempts: nextAttempts,
          error: message,
        });
      }
    }
  }
}