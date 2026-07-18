import type { EventOutbox } from "../schema_types/outbox-event.type.js";

export function getPayload<T>(
  event: EventOutbox,
): T {
  return event.payload as T;
}