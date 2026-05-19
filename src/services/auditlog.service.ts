import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prismadb.js";
import {
  createAuditLogSchema,
  auditLogQuerySchema,
} from "../schemas/auditlog.schema.js";


export class AuditLogService {
  /* =========================================================
  CREATE AUDIT LOG
  ========================================================= */

  static async create(data: unknown) {
    const validated = createAuditLogSchema.parse(data);

    return prisma.auditLog.create({
      data: {
        userId: validated.userId,
        action: validated.action,
        entity: validated.entity,
        entityId: validated.entityId,
        ipAddress: validated.ipAddress,
        userAgent: validated.userAgent,

        ...(validated.metadata !== undefined && {
          metadata: validated.metadata as Prisma.InputJsonValue,
        }),
      },
    });
  }

  /* =========================================================
  GET AUDIT LOGS
  ========================================================= */

  static async findAll(query: unknown) {
    const validated = auditLogQuerySchema.parse(query);

    const page = validated.page ?? 1;
    const limit = validated.limit ?? 20;

    const where: Prisma.AuditLogWhereInput = {
      ...(validated.userId && { userId: validated.userId }),
      ...(validated.entity && { entity: validated.entity }),
      ...(validated.entityId && { entityId: validated.entityId }),
    };

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* =========================================================
  GET SINGLE AUDIT LOG
  ========================================================= */

  static async findById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
    });
  }

  /* =========================================================
  DELETE AUDIT LOG
  ========================================================= */

  static async delete(id: string) {
    return prisma.auditLog.delete({
      where: { id },
    });
  }
}