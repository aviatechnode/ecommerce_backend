import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  DeleteMessageDraft,
  GetMessageDraft,
  MessageDraft,
  SaveMessageDraft,
} from "../schema_types/message-draft.type.js";

import { BasePolicy } from "./base.policy.js";

export class MessageDraftPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // DRAFTS
  ////////////////////////////////////////////////////////////

  save(
    actor: ChatActor,
    _data: SaveMessageDraft,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageDraft:save");
  }

  get(
    actor: ChatActor,
    draft: MessageDraft,
    _data: GetMessageDraft,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageDraft:view");

    this.requireDraftOwner(
      actor,
      draft,
    );
  }

  delete(
    actor: ChatActor,
    draft: MessageDraft,
    _data: DeleteMessageDraft,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageDraft:delete");

    this.requireDraftOwner(
      actor,
      draft,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  restore(
    actor: ChatActor,
    draft: MessageDraft,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageDraft:view");

    this.requireDraftOwner(
      actor,
      draft,
    );
  }

  clearAfterSend(
    actor: ChatActor,
    draft: MessageDraft,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageDraft:delete");

    this.requireDraftOwner(
      actor,
      draft,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private requireDraftOwner(
    actor: ChatActor,
    draft: MessageDraft,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    const userId = this.requireUser(actor);

    if (draft.userId !== userId) {
      throw new BusinessRuleError(
        "You can only access your own message drafts.",
      );
    }
  }
}