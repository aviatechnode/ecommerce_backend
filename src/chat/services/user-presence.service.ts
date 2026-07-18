import type { IUserPresenceGateway } from "../gateway-interface/user-presence.gateway.interface.js";
import type { ChatActor } from "../interfaces/actor.interface.js";
import type { IUserPresenceService } from "../interfaces/user-presence.interface.js";
import type { UserPresencePolicy } from "../policies/user-presence.policy.js";

import type {
  GetUserPresence,
  UpdatePresence,
  UpdateTyping,
  UserPresence,
  UserPresenceSession,
} from "../schemas/user-presence.schema.js";

export class UserPresenceService
  implements IUserPresenceService
{
  constructor(
    private readonly gateway: IUserPresenceGateway,
    private readonly policy: UserPresencePolicy,
  ) {}

  ////////////////////////////////////////////////////////////
  // PRESENCE
  ////////////////////////////////////////////////////////////

  async updatePresence(
    actor: ChatActor,
    data: UpdatePresence,
  ): Promise<UserPresence> {
    this.policy.updatePresence(actor, data);

    return this.gateway.upsert(actor, data);
  }

  async getPresence(
    actor: ChatActor,
    data: GetUserPresence,
  ): Promise<UserPresence | null> {
    this.policy.getPresence(actor, data);

    return this.gateway.findByUser(
      actor,
      data.userId,
    );
  }

  ////////////////////////////////////////////////////////////
  // TYPING
  ////////////////////////////////////////////////////////////

  async updateTyping(
    actor: ChatActor,
    socketId: string,
    data: UpdateTyping,
  ): Promise<UserPresenceSession> {
    this.policy.updateTyping(actor, data);

    return this.gateway.updateTyping(
      actor,
      socketId,
      data,
    );
  }

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  async refreshHeartbeat(
    actor: ChatActor,
  ): Promise<UserPresence> {
    this.policy.refreshHeartbeat(actor);

    return this.gateway.upsert(actor, {
      status: "ONLINE",
    });
  }

  async setOnline(
    actor: ChatActor,
  ): Promise<UserPresence> {
    this.policy.setOnline(actor);

    return this.gateway.upsert(actor, {
      status: "ONLINE",
    });
  }

  async setAway(
    actor: ChatActor,
  ): Promise<UserPresence> {
    this.policy.setAway(actor);

    return this.gateway.upsert(actor, {
      status: "AWAY",
    });
  }

  async setOffline(
    actor: ChatActor,
  ): Promise<UserPresence> {
    this.policy.setOffline(actor);

    return this.gateway.upsert(actor, {
      status: "OFFLINE",
    });
  }

  async clearTyping(
  actor: ChatActor,
  socketId: string,
  conversationId: string,
): Promise<UserPresenceSession> {
  this.policy.clearTyping(
    actor,
    conversationId,
  );

  return this.gateway.clearTyping(
    actor,
    socketId,
    conversationId,
  );
}
}