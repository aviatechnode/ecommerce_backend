import type { ChatActor } from "./actor.interface.js";
import type {
  UserPresence,
  UserPresenceSession,
  UpdatePresence,
  UpdateTyping,
  GetUserPresence,
} from "../schemas/user-presence.schema.js";

export interface IUserPresenceService {
  ////////////////////////////////////////////////////////////
  // PRESENCE
  ////////////////////////////////////////////////////////////

  updatePresence(
    actor: ChatActor,
    data: UpdatePresence,
  ): Promise<UserPresence>;

  getPresence(
    actor: ChatActor,
    data: GetUserPresence,
  ): Promise<UserPresence | null>;

  ////////////////////////////////////////////////////////////
  // TYPING
  ////////////////////////////////////////////////////////////

  updateTyping(
    actor: ChatActor,
    socketId: string,
    data: UpdateTyping,
  ): Promise<UserPresenceSession>;

  ////////////////////////////////////////////////////////////
  // BUSINESS LOGIC
  ////////////////////////////////////////////////////////////

  refreshHeartbeat(
    actor: ChatActor,
  ): Promise<UserPresence>;

  setOnline(
    actor: ChatActor,
  ): Promise<UserPresence>;

  setAway(
    actor: ChatActor,
  ): Promise<UserPresence>;

  setOffline(
    actor: ChatActor,
  ): Promise<UserPresence>;

  clearTyping(
    actor: ChatActor,
    socketId: string,
    conversationId: string,
  ): Promise<UserPresenceSession>;
}