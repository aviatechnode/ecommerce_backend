import { BusinessRuleError } from "../_shared/business-rule-error.js";

import type { IMessageAttachmentGateway } from "../gateway-interface/message-attachment.gateway.interface.js";

import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IMessageAttachmentService } from "../interfaces/message-attachment.interface.js";

import { MessageAttachmentPolicy } from "../policies/message-attachment.policy.js";

import type {
  DeleteAttachment,
  ListAttachments,
  MessageAttachment,
  SearchAttachments,
  UploadAttachment,
} from "../schema_types/message-attachment.type.js";

export class MessageAttachmentService
  implements IMessageAttachmentService
{
  constructor(
    private readonly gateway: IMessageAttachmentGateway,

    private readonly policy: MessageAttachmentPolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // UPLOAD
  ////////////////////////////////////////////////////////////

  async upload(
    actor: ChatActor,
    data: UploadAttachment,
  ): Promise<MessageAttachment> {
    this.policy.upload(
      actor,
      data,
    );

    return this.gateway.create(
      actor,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // RETRIEVE
  ////////////////////////////////////////////////////////////

  async findById(
    actor: ChatActor,
    id: string,
  ): Promise<MessageAttachment | null> {
    const attachment =
      await this.gateway.findById(
        actor,
        id,
      );

    if (!attachment) {
      return null;
    }

    this.policy.view(
      actor,
      attachment,
    );

    return attachment;
  }

  async list(
    actor: ChatActor,
    data: ListAttachments,
  ): Promise<MessageAttachment[]> {
    this.policy.list(
      actor,
      data,
    );

    return this.gateway.findByMessage(
      actor,
      data.messageId,
    );
  }

  async search(
    actor: ChatActor,
    filters: SearchAttachments,
  ): Promise<MessageAttachment[]> {
    this.policy.search(
      actor,
      filters,
    );

    return this.gateway.search(
      actor,
      filters,
    );
  }

  ////////////////////////////////////////////////////////////
  // DELETE
  ////////////////////////////////////////////////////////////

  async delete(
    actor: ChatActor,
    data: DeleteAttachment,
  ): Promise<void> {
    const attachment =
      await this.requireAttachment(
        actor,
        data.attachmentId,
      );

    this.policy.delete(
      actor,
      attachment,
      data,
    );

    await this.gateway.delete(
      actor,
      data.attachmentId,
    );
  }

  ////////////////////////////////////////////////////////////
  // HELPERS
  ////////////////////////////////////////////////////////////

  private async requireAttachment(
    actor: ChatActor,
    attachmentId: string,
  ): Promise<MessageAttachment> {
    const attachment =
      await this.gateway.findById(
        actor,
        attachmentId,
      );

    if (!attachment) {
      throw new BusinessRuleError(
        "Message attachment not found.",
      );
    }

    return attachment;
  }
}