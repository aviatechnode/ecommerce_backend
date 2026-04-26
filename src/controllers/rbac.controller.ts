// controllers/rbac.controller.ts
import type { Request, Response } from "express";
import * as rbac from "../services/rbac.service.js";
import { roleParamsSchema } from "../schemas/rbac.schema.js";

/* =========================================================
   ROLES
========================================================= */

export const createRole = async (req: Request, res: Response) => {
  const role = await rbac.createRole(req.body);
  res.status(201).json(role);
};

export const updateRole = async (req: Request, res: Response) => {
  const { roleId } = roleParamsSchema.parse(req.params);

  const role = await rbac.updateRole(roleId, req.body);
  res.json(role);
};

export const deleteRole = async (req: Request, res: Response) => {
  const { roleId } = roleParamsSchema.parse(req.params);

  await rbac.deleteRole(roleId);
  res.json({ success: true });
};

export const listRoles = async (_: Request, res: Response) => {
  const roles = await rbac.listRoles();
  res.json(roles);
};

export const getRoleDetails = async (req: Request, res: Response) => {
  const { roleId } = roleParamsSchema.parse(req.params);

  const role = await rbac.getRoleDetails(roleId);
  res.json(role);
};

/* =========================================================
   ASSIGNMENTS
========================================================= */

export const assignRoleToUser = async (req: Request, res: Response) => {
  const { userId, roleId } = req.body;

  const user = await rbac.assignRoleToUser(userId, roleId);
  res.json(user);
};

export const attachPermission = async (req: Request, res: Response) => {
  const { roleId, permissionId } = req.body;

  const result = await rbac.attachPermissionToRole(roleId, permissionId);
  res.json(result);
};

export const attachGroup = async (req: Request, res: Response) => {
  const { roleId, groupId } = req.body;

  const result = await rbac.attachGroupToRole(roleId, groupId);
  res.json(result);
};