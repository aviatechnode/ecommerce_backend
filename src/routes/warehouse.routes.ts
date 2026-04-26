import { Router } from "express";
import {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
} from "../controllers/warehouse.controller.js";

const router = Router();

router.get("/", getWarehouses);
router.post("/", createWarehouse);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);

export default router;