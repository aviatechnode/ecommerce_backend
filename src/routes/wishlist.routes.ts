import { Router } from "express";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller.js";

import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

//////////////////////////////////////////////////////////
// PROTECTED ROUTES (RBAC)
//////////////////////////////////////////////////////////

// GET WISHLIST
router.get(
  "/",
  protect,
  requirePermission("wishlist:read"),
  getWishlist
);

// ADD ITEM
router.post(
  "/",
  protect,
  requirePermission("wishlist:create"),
  addWishlistItem
);

//////////////////////////////////////////////////////////
// TOGGLE WISHLIST
//////////////////////////////////////////////////////////

router.post(
  "/toggle",
  protect,
  requirePermission("wishlist:create"),
  toggleWishlist
);

// REMOVE ITEM
router.delete(
  "/:id",
  protect,
  requirePermission("wishlist:delete"),
  removeWishlistItem
);

// CLEAR
router.delete(
  "/",
  protect,
  requirePermission("wishlist:delete"),
  clearWishlist
);

export default router;