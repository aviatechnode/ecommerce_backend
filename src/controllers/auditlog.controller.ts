import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { Prisma } from "@prisma/client";
import {
  createAuditLogSchema,
  auditLogQuerySchema,
} from "../schemas/auditlog.schema.js";

/* =========================================================
CREATE AUDIT LOG
========================================================= */

export const createAuditLog = async (req: Request, res: Response) => {
  try {
    const parsed = createAuditLogSchema.parse(req.body);

    const log = await prisma.auditLog.create({
      data: {
        userId: parsed.userId,
        action: parsed.action,
        entity: parsed.entity,

        entityId: parsed.entityId,
        ipAddress: parsed.ipAddress,
        userAgent: parsed.userAgent,

        // already transformed by Zod
        ...(parsed.metadata !== undefined && {
          metadata: parsed.metadata,
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Audit log created",
      data: log,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to create audit log",
    });
  }
};

/* =========================================================
GET AUDIT LOGS
========================================================= */

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const parsed = auditLogQuerySchema.parse(req.query);

    const page = parsed.page ?? 1;
    const limit = parsed.limit ?? 20;

    const skip = (page - 1) * limit;

    const where: {
      userId?: string;
      entity?: string;
      entityId?: string;
    } = {};

    if (parsed.userId) where.userId = parsed.userId;
    if (parsed.entity) where.entity = parsed.entity;
    if (parsed.entityId) where.entityId = parsed.entityId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to fetch audit logs",
    });
  }
};

/* =========================================================
AUTO AUDIT LOGGER
========================================================= */

export const logAudit = async (data: {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) => {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,

      entityId: data.entityId ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,

      ...(data.metadata !== undefined && {
        metadata:
          data.metadata === null
            ? Prisma.JsonNull
            : data.metadata,
      }),
    },
  });
};