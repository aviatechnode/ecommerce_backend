import type { IEventDispatcher } from "./event-dispatcher.interface.js";
import type { IEventHandler } from "../interfaces/event-handler.interface.js";

import type { EventOutbox } from "../schema_types/outbox-event.type.js";

export class EventDispatcher
  implements IEventDispatcher
{
  constructor(
    private readonly handlers: readonly IEventHandler[],
  ) {}

  async dispatch(
    event: EventOutbox,
  ): Promise<void> {
    const handler =
      this.handlers.find(
        handler =>
          handler.supports(
            event.type,
          ),
      );

    if (!handler) {
      throw new Error(
        `No event handler registered for event type: ${event.type}`,
      );
    }

    await handler.handle(
      event,
    );
  }
}