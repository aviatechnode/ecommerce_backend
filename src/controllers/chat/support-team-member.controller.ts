import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import { SupportTeamMemberService } from "../../chat/services/support-team-member.service.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type MemberParams = {
  memberId: string;
};

type TeamParams = {
  teamId: string;
};

////////////////////////////////////////////////////////////
// QUERY
////////////////////////////////////////////////////////////

type ListMembersQuery = {
  isActive?: string;
  page?: string;
  limit?: string;
};

////////////////////////////////////////////////////////////
// BODY
////////////////////////////////////////////////////////////

type AddMemberBody = {
  teamId: string;
  userId: string;
  roleId: string;
};

type UpdateMemberBody = {
  roleId?: string;
  isActive?: boolean;
};

type ChangeRoleBody = {
  roleId: string;
};

type SetStatusBody = {
  isActive: boolean;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class SupportTeamMemberController {
  constructor(
    private readonly memberService:
      SupportTeamMemberService,
  ) {}

  ////////////////////////////////////////////////////////////
  // ACTOR
  ////////////////////////////////////////////////////////////

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  ////////////////////////////////////////////////////////////
  // ADD MEMBER
  ////////////////////////////////////////////////////////////

  async add(
    req: TypedRequest<
      {},
      AddMemberBody
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.add(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // UPDATE MEMBER
  ////////////////////////////////////////////////////////////

  async update(
    req: TypedRequest<
      MemberParams,
      UpdateMemberBody
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.update(
        this.actor(req),
        {
          memberId:
            req.params.memberId,

          ...req.body,
        },
      );

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // REMOVE MEMBER
  ////////////////////////////////////////////////////////////

  async remove(
    req: TypedRequest<
      MemberParams
    >,
    res: Response,
  ): Promise<void> {
    await this.memberService.remove(
      this.actor(req),
      {
        memberId:
          req.params.memberId,
      },
    );

    res.sendStatus(204);
  }

  ////////////////////////////////////////////////////////////
  // FIND MEMBER BY ID
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      MemberParams
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.findById(
        this.actor(req),
        req.params.memberId,
      );

    if (!member) {
      res.sendStatus(404);
      return;
    }

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST TEAM MEMBERS
  ////////////////////////////////////////////////////////////

  async list(
    req: TypedRequest<
      TeamParams,
      {},
      ListMembersQuery
    >,
    res: Response,
  ): Promise<void> {
    const isActive =
      req.query.isActive ===
      undefined
        ? undefined
        : req.query.isActive ===
          "true";

    const page = Number(
      req.query.page ?? 1,
    );

    const limit = Number(
      req.query.limit ?? 20,
    );

    const members =
      await this.memberService.list(
        this.actor(req),
        {
          teamId:
            req.params.teamId,

          isActive,

          page,

          limit,
        },
      );

    res.json(
      members,
    );
  }

  ////////////////////////////////////////////////////////////
  // CHANGE ROLE
  ////////////////////////////////////////////////////////////

  async changeRole(
    req: TypedRequest<
      MemberParams,
      ChangeRoleBody
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.changeRole(
        this.actor(req),
        {
          memberId:
            req.params.memberId,

          roleId:
            req.body.roleId,
        },
      );

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // ACTIVATE MEMBER
  ////////////////////////////////////////////////////////////

  async activate(
    req: TypedRequest<
      MemberParams
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.activate(
        this.actor(req),
        req.params.memberId,
      );

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // DEACTIVATE MEMBER
  ////////////////////////////////////////////////////////////

  async deactivate(
    req: TypedRequest<
      MemberParams
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.deactivate(
        this.actor(req),
        req.params.memberId,
      );

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // SET STATUS
  ////////////////////////////////////////////////////////////

  async setStatus(
    req: TypedRequest<
      MemberParams,
      SetStatusBody
    >,
    res: Response,
  ): Promise<void> {
    const member =
      await this.memberService.setStatus(
        this.actor(req),
        {
          memberId:
            req.params.memberId,

          isActive:
            req.body.isActive,
        },
      );

    res.json(
      member,
    );
  }

  ////////////////////////////////////////////////////////////
  // CHECK CURRENT USER MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async isMember(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const isMember =
      await this.memberService.isMember(
        this.actor(req),
        req.params.teamId,
      );

    res.json({
      isMember,
    });
  }

  ////////////////////////////////////////////////////////////
  // CHECK CURRENT USER ACTIVE MEMBERSHIP
  ////////////////////////////////////////////////////////////

  async isActiveMember(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const isActiveMember =
      await this.memberService.isActiveMember(
        this.actor(req),
        req.params.teamId,
      );

    res.json({
      isActiveMember,
    });
  }
}