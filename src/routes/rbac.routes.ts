
import { Router } from "express";
import * as controller from "../controllers/rbac.controller.js";

import { validate } from "../middlewares/validateRoles.js";
import { createRoleSchema, updateRoleSchema, roleParamsSchema } from "../schemas/rbac.schema.js";
import { assignRoleSchema, attachGroupSchema, attachPermissionSchema } from "../schemas/rbac-extra.schema.js";



const router = Router();

/* =========================================================
   ROLES
========================================================= */

router.post(
  "/roles",
  validate(createRoleSchema),
  controller.createRole
);

router.get("/roles", controller.listRoles);

router.get(
  "/roles/:roleId",
  validate(roleParamsSchema, "params"),
  controller.getRoleDetails
);

router.put(
  "/roles/:roleId",
  validate(roleParamsSchema, "params"),
  validate(updateRoleSchema),
  controller.updateRole
);

router.delete(
  "/roles/:roleId",
  validate(roleParamsSchema, "params"),
  controller.deleteRole
);

/* =========================================================
   ASSIGNMENTS (RESTFUL VERSION)
========================================================= */

router.post(
  "/roles/:roleId/users",
  validate(roleParamsSchema, "params"),
  validate(assignRoleSchema),
  controller.assignRoleToUser
);

router.post(
  "/roles/:roleId/permissions",
  validate(roleParamsSchema, "params"),
  validate(attachPermissionSchema),
  controller.attachPermission
);

router.post(
  "/roles/:roleId/groups",
  validate(roleParamsSchema, "params"),
  validate(attachGroupSchema),
  controller.attachGroup
);

export default router;