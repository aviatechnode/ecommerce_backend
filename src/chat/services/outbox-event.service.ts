import { randomUUID } from "node:crypto";

import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IEventOutboxGateway } from "../gateway-interface/outbox-event.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IEventDispatcher } from "../event-dispatcher/event-dispatcher.interface.js";
import type { IEventOutboxService } from "../interfaces/outbox-event.interface.js";

import { EventOutboxPolicy } from "../policies/outbox-event.policy.js";

import type {
  CreateOutboxEvent,
  EventOutbox,
} from "../schema_types/outbox-event.type.js";

export class EventOutboxService
  implements IEventOutboxService
{
  private readonly workerId: string;

  constructor(
    private readonly gateway: IEventOutboxGateway,

    private readonly policy: EventOutboxPolicy,

    private readonly dispatcher: IEventDispatcher,
  ) {
    this.workerId =
      `worker-${randomUUID()}`;
  }

  ////////////////////////////////////////////////////////////
  // PUBLISH
  ////////////////////////////////////////////////////////////

  async publish(
    actor: ChatActor,
    data: CreateOutboxEvent,
  ): Promise<EventOutbox> {
    this.policy.publish(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  async publishMany(
    actor: ChatActor,
    data: CreateOutboxEvent[],
  ): Promise<EventOutbox[]> {
    this.policy.publishMany(
      actor,
      data,
    );

    return this.gateway.createMany(
      actor,
      data,
    );
  }

    ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox | null> {
    return this.gateway.findById(
      actor,
      id,
    );
  }

  ////////////////////////////////////////////////////////////
  // PROCESSING
  ////////////////////////////////////////////////////////////

  async claimNextBatch(
    actor: ChatActor,
    workerId: string,
    batchSize = 100,
  ): Promise<EventOutbox[]> {
    this.policy.claimNextBatch(
      actor,
      workerId,
    );

    return this.gateway.claimNextBatch(
      actor,
      workerId,
      batchSize,
    );
  }

  async markProcessed(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox> {
    const event =
      await this.requireEvent(
        actor,
        id,
      );

    this.policy.markProcessed(
      actor,
      event,
    );

    return this.gateway.update(
      actor,
      id,
      {
        status: "PROCESSED",
        processedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        lastError: null,
      },
    );
  }

  async markFailed(
    actor: ChatActor,
    id: string,
    error: string,
  ): Promise<EventOutbox> {
    const event =
      await this.requireEvent(
        actor,
        id,
      );

    this.policy.markFailed(
      actor,
      event,
      error,
    );

    return this.gateway.update(
      actor,
      id,
      {
        status: "FAILED",
        attempts:
          event.attempts + 1,
        lastError: error,
        lockedAt: null,
        lockedBy: null,
      },
    );
  }

  async retry(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox> {
    const event =
      await this.requireEvent(
        actor,
        id,
      );

    this.policy.retry(
      actor,
      event,
    );

    return this.gateway.update(
      actor,
      id,
      {
        status: "PENDING",
        lockedAt: null,
        lockedBy: null,
        lastError: null,
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
      await this.requireEvent(
        actor,
        id,
      );

    this.policy.lock(
      actor,
      event,
      workerId,
    );

    return this.gateway.lock(
      actor,
      id,
      workerId,
    );
  }

  async unlock(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox> {
    const event =
      await this.requireEvent(
        actor,
        id,
      );

    this.policy.unlock(
      actor,
      event,
    );

    return this.gateway.unlock(
      actor,
      id,
    );
  }

  ////////////////////////////////////////////////////////////
  // HOUSEKEEPING
  ////////////////////////////////////////////////////////////

  async deleteExpired(): Promise<number> {
    return this.gateway.deleteExpired();
  }

  async processPending(
    actor: ChatActor,
    batchSize = 100,
  ): Promise<void> {
    this.policy.processPending(
      actor,
    );

    const events =
      await this.claimNextBatch(
        actor,
        this.workerId,
        batchSize,
      );

    for (const event of events) {
      try {
        await this.dispatcher.dispatch(
          event,
        );

        await this.markProcessed(
          actor,
          event.id,
        );
      } catch (error) {
        await this.markFailed(
          actor,
          event.id,
          error instanceof Error
            ? error.message
            : "Unknown processing error",
        );
      }
    }
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireEvent(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox> {
    const event =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!event) {
      throw new BusinessRuleError(
        "Outbox event not found.",
      );
    }

    return event;
  }
}