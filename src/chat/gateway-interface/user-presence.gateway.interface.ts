import type { ChatActor } from "../interfaces/actor.interface.js";
import type { 
    UpdatePresence, 
    UpdateTyping, 
    UserPresence, 
    UserPresenceSession
} from "../schema_types/user-presence.type.js";

export interface IUserPresenceGateway {
  ////////////////////////////////////////////////////////////
  // CRUD
  ////////////////////////////////////////////////////////////

  upsert(
    actor: ChatActor,
    data: UpdatePresence,
  ): Promise<UserPresence>;

  findByUser(
  actor: ChatActor, 
  userId: string,
  ): Promise<UserPresence | null>;

  updateTyping(
  actor: ChatActor,
  socketId: string,
  data: UpdateTyping,
): Promise<UserPresenceSession>;

 clearTyping(
  actor: ChatActor,
  socketId: string,
  conversationId: string,
 ): Promise<UserPresenceSession>;

  delete(
    actor: ChatActor,
  ): Promise<void>;
}