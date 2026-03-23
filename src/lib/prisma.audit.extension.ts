import { Prisma } from "@prisma/client";
import { getRequestContext } from "./requestContext.js";

const excludedModels = ["AuditLog", "RefreshToken", "IdempotencyKey"];

export const auditExtension = Prisma.defineExtension({
  name: "audit-log",

  query: {
    $allModels: {
      async create({ model, args, query }) {
        const result = await query(args);
        await logAudit("CREATE", model, result, args);
        return result;
      },

      async update({ model, args, query }) {
        const result = await query(args);
        await logAudit("UPDATE", model, result, args);
        return result;
      },

      async delete({ model, args, query }) {
        const result = await query(args);
        await logAudit("DELETE", model, result, args);
        return result;
      },
    },
  },
});

async function logAudit(
  action: string,
  model: string,
  result: any,
  args: any
) {
  if (!model) return;
  if (excludedModels.includes(model)) return;

  const ctx = getRequestContext();
  if (!ctx?.userId) return;

  try {
    const { prisma } = await import("./prismadb.js");

    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        action,
        entity: model,
        entityId: result?.id ?? null,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: args ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}