import type {
  Request,
  Response,
} from "express";

import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";

import { SupportTeamService } from "../../chat/services/support-team.service.js";

////////////////////////////////////////////////////////////
// PARAMS
////////////////////////////////////////////////////////////

type TeamParams = {
  teamId: string;
};

////////////////////////////////////////////////////////////
// CONTROLLER
////////////////////////////////////////////////////////////

export class SupportTeamController {
  constructor(
    private readonly teamService:
      SupportTeamService,
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
  // CREATE
  ////////////////////////////////////////////////////////////

  async create(
    req: Request,
    res: Response,
  ): Promise<void> {
    const team =
      await this.teamService.create(
        this.actor(req),
        req.body,
      );

    res.status(201).json(
      team,
    );
  }

  ////////////////////////////////////////////////////////////
  // LIST
  ////////////////////////////////////////////////////////////

  async list(
    req: Request,
    res: Response,
  ): Promise<void> {
    const teams =
      await this.teamService.list(
        this.actor(req),
      );

    res.json(
      teams,
    );
  }

  ////////////////////////////////////////////////////////////
  // FIND BY ID
  ////////////////////////////////////////////////////////////

  async findById(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const team =
      await this.teamService.findById(
        this.actor(req),
        req.params.teamId,
      );

    if (!team) {
      res.sendStatus(404);
      return;
    }

    res.json(
      team,
    );
  }

  ////////////////////////////////////////////////////////////
  // UPDATE
  ////////////////////////////////////////////////////////////

  async update(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const team =
      await this.teamService.update(
        this.actor(req),
        {
          teamId:
            req.params.teamId,

          ...req.body,
        },
      );

    res.json(
      team,
    );
  }

  ////////////////////////////////////////////////////////////
  // ACTIVATE
  ////////////////////////////////////////////////////////////

  async activate(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const team =
      await this.teamService.activate(
        this.actor(req),
        req.params.teamId,
      );

    res.json(
      team,
    );
  }

  ////////////////////////////////////////////////////////////
  // DEACTIVATE
  ////////////////////////////////////////////////////////////

  async deactivate(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    const team =
      await this.teamService.deactivate(
        this.actor(req),
        req.params.teamId,
      );

    res.json(
      team,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    req: TypedRequest<
      TeamParams
    >,
    res: Response,
  ): Promise<void> {
    await this.teamService.delete(
      this.actor(req),
      req.params.teamId,
    );

    res.sendStatus(204);
  }
}