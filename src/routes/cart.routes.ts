import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import * as cartController from "../controllers/cart.controller.js";

const router = Router();

router.use(protect);

router.get("/", cartController.getMyCart);
router.post("/add", cartController.addToCart);
router.put("/item/:id", cartController.updateCartItem);
router.delete("/item/:id", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

export default router;