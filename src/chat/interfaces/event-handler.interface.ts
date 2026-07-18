import type { EventOutbox } from "../schema_types/outbox-event.type.js";

export interface IEventHandler {
  supports(
    eventType: string,
  ): boolean;

  handle(
    event: EventOutbox,
  ): Promise<void>;
}