import { getRequestContext } from "../lib/requestContext.js";

const excludedModels = ["AuditLog", "RefreshToken", "IdempotencyKey"];

export const auditMiddleware = async (params: any, next: any) => {
  const result = await next(params);

  if (!params.model) return result;
  if (excludedModels.includes(params.model)) return result;

  const ctx = getRequestContext();

  if (!ctx?.userId) return result;

  const actionMap: Record<string, string> = {
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
  };

  const action = actionMap[params.action];

  if (!action) return result;

  let entityId: string | null = null;

  if (result && typeof result === "object" && "id" in result) {
    entityId = (result as any).id;
  }

  try {
    const { prisma } = await import("../lib/prismadb.js");

    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        action,
        entity: params.model,
        entityId,
        ipAddress: ctx.ipAddress ?? null,
        userAgent: ctx.userAgent ?? null,
        metadata: params.args ?? null,
      },
    });
  } catch (error) {
    console.error("Audit middleware error:", error);
  }

  return result;
};