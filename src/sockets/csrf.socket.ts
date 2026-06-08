import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prismadb.js";
import { generateCsrfToken, hashCsrfToken } from "../utils/csrf.js";

export async function registerAuthSocket(io: Server, socket: Socket) {
  try {
    const refreshToken =
      socket.handshake.headers.cookie
        ?.split(";")
        .find((v) => v.trim().startsWith("refreshToken="))
        ?.split("=")[1];

    if (!refreshToken) return;

    const session = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!session) return;

    // join user room
    socket.join(`user:${session.userId}`);

    // ALWAYS ensure CSRF exists
    let raw = generateCsrfToken();
    let hash = hashCsrfToken(raw);

    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { csrfHash: hash },
    });

    socket.emit("csrf:update", raw);
  } catch (err) {
    console.error("csrf socket error", err);
  }
}