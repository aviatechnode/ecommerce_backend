import { Router } from "express";
import {
  signup,
  signin,
  verifyEmail,
  me,
  signout,
  refresh,
  csrf,
} from "../controllers/auth.controller.js";

import { csrfMiddleware } from "../middlewares/csrf.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

/* ================= PUBLIC ================= */
router.get("/verify-email/:token", verifyEmail);

/* ================= AUTH ================= */

// ❌ NO CSRF (no session yet)
router.post("/signup", signup);
router.post("/signin", signin);

// ✅ CRITICAL: refresh MUST NOT use CSRF
router.post("/refresh", refresh);

/* ================= PROTECTED ================= */

// logout → needs both auth + CSRF
router.post("/signout", protect, csrfMiddleware, signout);

// get current user → safe (no CSRF)
router.get("/me", protect, me);
router.get("/csrf", csrf);

export default router;