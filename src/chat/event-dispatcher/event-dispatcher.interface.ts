import type { EventOutbox } from "../schema_types/outbox-event.type.js";

export interface IEventDispatcher {
  dispatch(
    event: EventOutbox,
  ): Promise<void>;
}