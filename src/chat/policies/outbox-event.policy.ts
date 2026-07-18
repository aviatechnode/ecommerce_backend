import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  CreateOutboxEvent,
  EventOutbox,
} from "../schema_types/outbox-event.type.js";

import { BasePolicy } from "./base.policy.js";

export class EventOutboxPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // PUBLISH
  ////////////////////////////////////////////////////////////

  publish(
    actor: ChatActor,
    _data: CreateOutboxEvent,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:create");
  }

  publishMany(
    actor: ChatActor,
    _data: CreateOutboxEvent[],
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:create");
  }

  ////////////////////////////////////////////////////////////
  // VIEW
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    _event: EventOutbox,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:view");
  }

  list(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:view");
  }

  ////////////////////////////////////////////////////////////
  // PROCESSING
  ////////////////////////////////////////////////////////////

  claimNextBatch(
    actor: ChatActor,
    workerId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:process");

    if (!workerId.trim()) {
      throw new BusinessRuleError(
        "Worker ID is required.",
      );
    }
  }

  markProcessed(
    actor: ChatActor,
    event: EventOutbox,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:process");

    if (event.processedAt) {
      throw new BusinessRuleError(
        "Event has already been processed.",
      );
    }
  }

  markFailed(
    actor: ChatActor,
    event: EventOutbox,
    error: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:process");

    if (!error.trim()) {
      throw new BusinessRuleError(
        "Failure reason is required.",
      );
    }

    if (event.processedAt) {
      throw new BusinessRuleError(
        "Processed events cannot be marked as failed.",
      );
    }
  }

  retry(
    actor: ChatActor,
    event: EventOutbox,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:process");

    if (event.processedAt) {
      throw new BusinessRuleError(
        "Processed events cannot be retried.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // LOCKING
  ////////////////////////////////////////////////////////////

  lock(
    actor: ChatActor,
    event: EventOutbox,
    workerId: string,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:lock");

    if (!workerId.trim()) {
      throw new BusinessRuleError(
        "Worker ID is required.",
      );
    }

    if (event.lockedAt) {
      throw new BusinessRuleError(
        "Event is already locked.",
      );
    }
  }

  unlock(
    actor: ChatActor,
    event: EventOutbox,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:lock");

    if (!event.lockedAt) {
      throw new BusinessRuleError(
        "Event is not locked.",
      );
    }
  }

  ////////////////////////////////////////////////////////////
  // HOUSEKEEPING
  ////////////////////////////////////////////////////////////

  deleteExpired(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:delete");
  }

  processPending(
    actor: ChatActor,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "eventOutbox:process");
  }
}