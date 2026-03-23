import { prisma } from "../lib/prismadb.js";

interface AuditLogInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export const logAudit = async ({
  userId,
  action,
  entity,
  entityId,
  ipAddress,
  userAgent,
  metadata,
}: AuditLogInput) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,

        ...(entityId && { entityId }),
        ...(ipAddress && { ipAddress }),
        ...(userAgent && { userAgent }),
        ...(metadata && { metadata }),
      },
    });
  } catch (error) {
    console.error("AuditLog error:", error);
  }
};