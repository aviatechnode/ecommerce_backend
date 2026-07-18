import type { EventOutbox } from "../schema_types/outbox-event.type.js";

export interface IOutboxEventHandler {
    supports(
        event: EventOutbox,
    ): boolean;

    handle(
        event: EventOutbox,
    ): Promise<void>;
}