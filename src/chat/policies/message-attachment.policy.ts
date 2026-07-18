import { BusinessRuleError } from "../_shared/business-rule-error.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type {
  DeleteAttachment,
  ListAttachments,
  MessageAttachment,
  SearchAttachments,
  UploadAttachment,
} from "../schema_types/message-attachment.type.js";

import { BasePolicy } from "./base.policy.js";

export class MessageAttachmentPolicy extends BasePolicy {
  ////////////////////////////////////////////////////////////
  // UPLOAD
  ////////////////////////////////////////////////////////////

  upload(
    actor: ChatActor,
    _data: UploadAttachment,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageAttachment:create");
  }

  ////////////////////////////////////////////////////////////
  // RETRIEVE
  ////////////////////////////////////////////////////////////

  view(
    actor: ChatActor,
    _attachment: MessageAttachment,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageAttachment:view");
  }

  list(
    actor: ChatActor,
    _data: ListAttachments,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageAttachment:view");
  }

  search(
    actor: ChatActor,
    _filters: SearchAttachments,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageAttachment:view");
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  delete(
    actor: ChatActor,
    attachment: MessageAttachment,
    _data: DeleteAttachment,
  ): void {
    this.requireAuthenticated(actor);
    this.require(actor, "messageAttachment:delete");

    this.requireAttachmentOwner(
      actor,
      attachment,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private requireAttachmentOwner(
    actor: ChatActor,
    attachment: MessageAttachment,
  ): void {
    if (actor.isSuperAdmin) {
      return;
    }

    const userId = this.requireUser(actor);

    if (attachment.uploadedById !== userId) {
      throw new BusinessRuleError(
        "Only the uploader may delete this attachment.",
      );
    }
  }
}