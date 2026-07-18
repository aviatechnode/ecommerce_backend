import { z } from "zod";
import { SupportTeamEvents } from "../../chat-event/support-chat-event.js";

////////////////////////////////////////////////////////////
// EVENT TYPE
////////////////////////////////////////////////////////////

export const SupportTeamEventTypeSchema =
  z.nativeEnum(SupportTeamEvents);

export type SupportTeamEventType = z.infer<
  typeof SupportTeamEventTypeSchema
>;

////////////////////////////////////////////////////////////
// SUPPORT TEAM EVENT
////////////////////////////////////////////////////////////

export const SupportTeamEventSchema =
  z.object({
    id: z.string().uuid(),

    teamId: z.string().uuid(),

    type: SupportTeamEventTypeSchema,

    userId: z.string().uuid().nullable(),

    actorId: z.string().uuid().nullable(),

    oldValue: z.unknown().nullable(),

    newValue: z.unknown().nullable(),

    createdAt: z.coerce.date(),
  });

export type SupportTeamEvent = z.infer<
  typeof SupportTeamEventSchema
>;

////////////////////////////////////////////////////////////
// RECORD EVENT
////////////////////////////////////////////////////////////

export const RecordSupportTeamEventSchema =
  z.object({
    teamId: z.string().uuid(),

    type: SupportTeamEventTypeSchema,

    userId: z.string().uuid().optional(),

    actorId: z.string().uuid().optional(),

    oldValue: z.unknown().optional(),

    newValue: z.unknown().optional(),
  });

export type RecordSupportTeamEvent = z.infer<
  typeof RecordSupportTeamEventSchema
>;

////////////////////////////////////////////////////////////
// LIST EVENTS
////////////////////////////////////////////////////////////

export const ListSupportTeamEventsSchema =
  z.object({
    teamId: z.string().uuid(),

    type: SupportTeamEventTypeSchema.optional(),

    page: z.number().int().positive().default(1),

    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),
  });

export type ListSupportTeamEvents = z.infer<
  typeof ListSupportTeamEventsSchema
>;

////////////////////////////////////////////////////////////
// FIND EVENT
////////////////////////////////////////////////////////////

export const FindSupportTeamEventSchema =
  z.object({
    eventId: z.string().uuid(),
  });

export type FindSupportTeamEvent = z.infer<
  typeof FindSupportTeamEventSchema
>;