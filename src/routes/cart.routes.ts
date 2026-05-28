import { Router } from "express";
import { protect } from "../middlewares/auth.middleware.js";
import * as cartController from "../controllers/cart.controller.js";

const router = Router();

router.use(protect);

// Cart
router.get("/", cartController.getMyCart);

// Items
router.post("/add", cartController.addToCart);
router.put("/item/:id", cartController.updateCartItem);
router.delete("/item/:id", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

// Delivery
router.patch("/delivery", cartController.updateCartDelivery);

// Shipping
router.post("/shipping/calculate", cartController.calculateCartShipping);

// Merge guest cart into user cart
router.post("/merge", cartController.mergeCart);

export default router;