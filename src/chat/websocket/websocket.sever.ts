import { Server } from "socket.io";
import type { Server as HTTPServer } from "http";
import { setSocketServer } from "./websocket.instance.js";
import { authenticateSocket } from "../middleware/auth.js";

export class WebSocketServer {
  readonly io: Server;

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: [
          "http://localhost:3000",
          "http://localhost:5173",
        ],
        credentials: true,
      },
    });

    setSocketServer(this.io);

    this.initialize();
  }

  private initialize(): void {
    this.io.use(authenticateSocket);
    this.io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`,);

        //////////////////////////////////////////////////////
        // AUTHENTICATION
        //////////////////////////////////////////////////////

        const userId =
          socket.handshake.auth.userId;

        const teamId =
          socket.handshake.auth.teamId;

        if (userId) {
          socket.join(
            this.roomForUser(userId),
          );
        }

        if (teamId) {
          socket.join(
            this.roomForTeam(teamId),
          );
        }

        //////////////////////////////////////////////////////
        // CLIENT EVENTS
        //////////////////////////////////////////////////////

        socket.on(
          "conversation:join",
          async (
            conversationId: string,
          ) => {
            await socket.join(
              this.roomForConversation(
                conversationId,
              ),
            );
          },
        );

        socket.on(
          "conversation:leave",
          async (
            conversationId: string,
          ) => {
            await socket.leave(
              this.roomForConversation(
                conversationId,
              ),
            );
          },
        );

        socket.on(
          "disconnect",
          (reason) => {
            console.log(
              `Socket disconnected: ${socket.id}`,
              reason,
            );
          },
        );
      },
    );
  }

  roomForConversation(
    id: string,
  ): string {
    return `conversation:${id}`;
  }

  roomForUser(
    id: string,
  ): string {
    return `user:${id}`;
  }

  roomForTeam(
    id: string,
  ): string {
    return `team:${id}`;
  }
}