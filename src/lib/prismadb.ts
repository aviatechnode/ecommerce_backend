import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auditExtension } from "./prisma.audit.extension.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL?.trim(),
});

declare global {
  // store the BASE prisma client
  var prisma: PrismaClient | undefined;
}

const baseClient =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = baseClient;
}

// extend only when exporting
export const prisma = baseClient.$extends(auditExtension);