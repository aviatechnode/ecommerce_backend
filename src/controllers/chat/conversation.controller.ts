import type {
  Request,
  Response,
} from "express";

import { ConversationService } from "../../chat/services/conversation.service.js";
import { toChatActor } from "../../chat/auth/chat-actor.js";

import type { AuthUser } from "../../types/auth.types.js";
import type { TypedRequest } from "../../types/express.js";
import type {
    ArchiveConversation,
    AssignConversation,
    CloseConversation,
    CreateConversation,
    MergeConversation,
    RateConversation,
    ResolveConversation,
    RestoreConversation,
    TransferConversation,
    UpdateConversationDetails,
    UpdateConversationPriority,
    UpdateConversationStatus
} from "../../chat/schema_types/conversation.type.js";
import { ConversationFiltersSchema } from "../../chat/schemas/conversation.schema.js";


type DeleteConversationBody = {
  hardDelete: boolean;
};

type ConversationParams = {
  conversationId: string;
};

export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
  ) {}

  private actor(
    req: Request,
  ) {
    return toChatActor(
      req.user as AuthUser,
    );
  }

  async create(
    req: TypedRequest<{}, CreateConversation>,
    res: Response,
  ): Promise<void> {
    const conversation =
      await this.conversationService.create(
        this.actor(req),
        req.body,
      );

    res.status(201).json(conversation);
  }

  async updateDetails(
    req:TypedRequest<
    ConversationParams,
  UpdateConversationDetails
>,
    res: Response,
  ): Promise<void> {
    const conversation =
      await this.conversationService.updateDetails(
        this.actor(req),
        req.params.conversationId,
        req.body,
      );

    res.json(conversation);
  }

  async findById(
    req:TypedRequest<ConversationParams>,
    res: Response,
  ): Promise<void> {
    const conversation =
      await this.conversationService.findById(
        this.actor(req),
        req.params.conversationId,
      );

    if (!conversation) {
      res.sendStatus(404);
      return;
    }

    res.json(conversation);
  }

  async list(
  req: Request,
  res: Response,
): Promise<void> {
  const filters =
    ConversationFiltersSchema.parse(
      req.query,
    );

  const result =
    await this.conversationService.list(
      this.actor(req),
      filters,
    );

  res.json(result);
}

  async delete(
  req: TypedRequest<
    ConversationParams,
    DeleteConversationBody
  >,
  res: Response,
): Promise<void> {
  await this.conversationService.delete(
    this.actor(req),
    {
      conversationId: req.params.conversationId,
      hardDelete: req.body.hardDelete,
    },
  );

  res.sendStatus(204);
}

  async assign(
  req: TypedRequest<
    ConversationParams,
    AssignConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.assign(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

  async transfer(
  req: TypedRequest<
    ConversationParams,
    TransferConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.transfer(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}
  async updateStatus(
  req: TypedRequest<
    ConversationParams,
    UpdateConversationStatus
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.updateStatus(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

async updatePriority(
  req: TypedRequest<
    ConversationParams,
    UpdateConversationPriority
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.updatePriority(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

  async resolve(
  req: TypedRequest<
    ConversationParams,
    ResolveConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.resolve(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}
async close(
  req: TypedRequest<
    ConversationParams,
    CloseConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.close(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

async reopen(
  req: TypedRequest<
    ConversationParams
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.reopen(
      this.actor(req),
      req.params.conversationId,
    );

  res.json(conversation);
}

async archive(
  req: TypedRequest<
    ConversationParams,
    ArchiveConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.archive(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

async restore(
  req: TypedRequest<
    ConversationParams,
    RestoreConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.restore(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

async lock(
  req: TypedRequest<
    ConversationParams
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.lock(
      this.actor(req),
      req.params.conversationId,
    );

  res.json(conversation);
}

async unlock(
  req: TypedRequest<
    ConversationParams
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.unlock(
      this.actor(req),
      req.params.conversationId,
    );

  res.json(conversation);
}

async rate(
  req: TypedRequest<
    ConversationParams,
    RateConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.rate(
      this.actor(req),
      {
        ...req.body,
        conversationId:
          req.params.conversationId,
      },
    );

  res.json(conversation);
}

async merge(
  req: TypedRequest<
    {},
    MergeConversation
  >,
  res: Response,
): Promise<void> {
  const conversation =
    await this.conversationService.merge(
      this.actor(req),
      req.body,
    );

  res.json(conversation);
}
}