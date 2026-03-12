import { Router } from "express";
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  clearWishlist,
} from "../controllers/wishlist.controller.js";

const router = Router();
router.get("/", getWishlist);
router.post("/", addWishlistItem);
router.delete("/:id", removeWishlistItem);
router.delete("/", clearWishlist);

export default router;