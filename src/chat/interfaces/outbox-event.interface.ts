import type { ChatActor } from "./actor.interface.js";
import type { 
    CreateOutboxEvent, 
    EventOutbox 
} from "../schemas/events/outbox-event.schema.js";
export interface IEventOutboxService {
  ////////////////////////////////////////////////////////////
  // PUBLISH
  ////////////////////////////////////////////////////////////

  publish(
    actor: ChatActor,
    data: CreateOutboxEvent,
  ): Promise<EventOutbox>;

  publishMany(
    actor: ChatActor,
    data: CreateOutboxEvent[],
  ): Promise<EventOutbox[]>;

  ////////////////////////////////////////////////////////////
  // FIND
  ////////////////////////////////////////////////////////////

  findById(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox | null>;

  ////////////////////////////////////////////////////////////
  // PROCESSING
  ////////////////////////////////////////////////////////////

  claimNextBatch(
    actor: ChatActor,
    workerId: string,
    batchSize?: number,
  ): Promise<EventOutbox[]>;

  markProcessed(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox>;

  markFailed(
    actor: ChatActor,
    id: string,
    error: string,
  ): Promise<EventOutbox>;

  retry(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox>;

  ////////////////////////////////////////////////////////////
  // LOCKING
  ////////////////////////////////////////////////////////////

  lock(
    actor: ChatActor,
    id: string,
    workerId: string,
  ): Promise<EventOutbox>;

  unlock(
    actor: ChatActor,
    id: string,
  ): Promise<EventOutbox>;

  ////////////////////////////////////////////////////////////
  // HOUSEKEEPING
  ////////////////////////////////////////////////////////////

  deleteExpired(): Promise<number>;

  processPending(
    actor: ChatActor,
    batchSize?: number,
  ): Promise<void>;
}