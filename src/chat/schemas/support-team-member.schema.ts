import { z } from "zod";

////////////////////////////////////////////////////////////
// SUPPORT TEAM MEMBER
////////////////////////////////////////////////////////////

export const SupportTeamMemberSchema = z.object({
  id: z.string().uuid(),

  teamId: z.string().uuid(),

  userId: z.string().uuid(),

  roleId: z.string().uuid(),

  isActive: z.boolean(),

  createdAt: z.coerce.date(),
});

export type SupportTeamMember = z.infer<
  typeof SupportTeamMemberSchema
>;

////////////////////////////////////////////////////////////
// ADD MEMBER
////////////////////////////////////////////////////////////

export const AddSupportTeamMemberSchema = z.object({
  teamId: z.string().uuid(),

  userId: z.string().uuid(),

  roleId: z.string().uuid(),
});

export type AddSupportTeamMember = z.infer<
  typeof AddSupportTeamMemberSchema
>;

////////////////////////////////////////////////////////////
// UPDATE MEMBER
////////////////////////////////////////////////////////////

export const UpdateSupportTeamMemberSchema =
  z.object({
    memberId: z.string().uuid(),

    roleId: z.string().uuid().optional(),

    isActive: z.boolean().optional(),
  });

export type UpdateSupportTeamMember = z.infer<
  typeof UpdateSupportTeamMemberSchema
>;

////////////////////////////////////////////////////////////
// REMOVE MEMBER
////////////////////////////////////////////////////////////

export const RemoveSupportTeamMemberSchema =
  z.object({
    memberId: z.string().uuid(),
  });

export type RemoveSupportTeamMember = z.infer<
  typeof RemoveSupportTeamMemberSchema
>;

////////////////////////////////////////////////////////////
// FIND MEMBER
////////////////////////////////////////////////////////////

export const FindSupportTeamMemberSchema =
  z.object({
    memberId: z.string().uuid(),
  });

export type FindSupportTeamMember = z.infer<
  typeof FindSupportTeamMemberSchema
>;

////////////////////////////////////////////////////////////
// LIST MEMBERS
////////////////////////////////////////////////////////////

export const ListSupportTeamMembersSchema =
  z.object({
    teamId: z.string().uuid(),

    isActive: z.boolean().optional(),

    page: z.number().int().positive().default(1),

    limit: z
      .number()
      .int()
      .positive()
      .max(100)
      .default(20),
  });

export type ListSupportTeamMembers = z.infer<
  typeof ListSupportTeamMembersSchema
>;

////////////////////////////////////////////////////////////
// CHANGE ROLE
////////////////////////////////////////////////////////////

export const ChangeSupportTeamMemberRoleSchema =
  z.object({
    memberId: z.string().uuid(),

    roleId: z.string().uuid(),
  });

export type ChangeSupportTeamMemberRole =
  z.infer<
    typeof ChangeSupportTeamMemberRoleSchema
  >;

////////////////////////////////////////////////////////////
// SET STATUS
////////////////////////////////////////////////////////////

export const SetSupportTeamMemberStatusSchema =
  z.object({
    memberId: z.string().uuid(),

    isActive: z.boolean(),
  });

export type SetSupportTeamMemberStatus =
  z.infer<
    typeof SetSupportTeamMemberStatusSchema
  >;