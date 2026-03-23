import { Router } from 'express';
import {
  signup,
  signin,
  verifyEmail,
  me,
  signout // ✅ ADD THIS
} from './../controllers/auth.controller.js';

import { csrfMiddleware } from "../middlewares/csrf.middleware.js";
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/signup", csrfMiddleware, signup);
router.post("/signin", csrfMiddleware, signin);

// ✅ LOGOUT (protected + CSRF)
router.post("/signout", protect, csrfMiddleware, signout);

// ✅ CURRENT USER
router.get("/me", protect, me);

// ❗ NO CSRF here (must stay public)
router.get("/verify-email/:token", verifyEmail);

export default router;