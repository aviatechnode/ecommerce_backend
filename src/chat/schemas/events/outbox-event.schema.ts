import { z } from "zod";

import { EventOutboxStatusSchema } from "../../enums/enums.js";

////////////////////////////////////////////////////////////
// JSON
////////////////////////////////////////////////////////////

const JsonValueSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ])
);

////////////////////////////////////////////////////////////
// BASE
////////////////////////////////////////////////////////////

export const EventOutboxSchema = z.object({
  id: z.string().uuid(),

  eventId: z.string().uuid(),

  type: z.string(),

  aggregateType: z.string(),

  aggregateId: z.string(),

  payload: JsonValueSchema,

  status: EventOutboxStatusSchema,

  attempts: z.number().int().min(0),

  lastError: z.string().nullable(),

  createdAt: z.coerce.date(),

  processedAt: z.coerce.date().nullable(),

  scheduledAt: z.coerce.date().nullable(),

  lockedAt: z.coerce.date().nullable(),

  lockedBy: z.string().nullable(),

  expiresAt: z.coerce.date().nullable(),
});

export type EventOutbox = z.infer<
  typeof EventOutboxSchema
>;

////////////////////////////////////////////////////////////
// CREATE OUTBOX EVENT
////////////////////////////////////////////////////////////

export const CreateOutboxEventSchema = z.object({
  type: z.string().trim().min(1),

  aggregateType: z.string().trim().min(1),

  aggregateId: z.string().trim().min(1),

  payload: JsonValueSchema,

  scheduledAt: z.coerce.date().optional(),

  expiresAt: z.coerce.date().optional(),
});

export type CreateOutboxEvent = z.infer<
  typeof CreateOutboxEventSchema
>;