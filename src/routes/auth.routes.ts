// src/routes/auth.routes.ts

import { Router } from "express";
import passport from "passport";

import {
  signup,
  signin,
  signout,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  me,
  csrf,
  googleSuccess,
} from "../controllers/auth.controller.js";

import {
  protect,
  requirePermission,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes

router.post("/signup", signup);

router.post("/signin", signin);

router.post("/refresh", refresh);

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/reset-password",
  resetPassword
);

router.get(
  "/verify-email/:token",
  verifyEmail
);

// Protected routes

router.post(
  "/signout",
  protect,
  signout
);

router.get(
  "/me",
  protect,
  me
);

router.get("/csrf", csrf);

// Google OAuth

router.get(
  "/google",
  passport.authenticate(
    "google",
    {
      scope: [
        "profile",
        "email",
      ],
      session: false,
    }
  )
);

router.get(
  "/google/callback",
  passport.authenticate(
    "google",
    {
      failureRedirect:
        `${process.env.CLIENT_URL}/login?error=google_auth_failed`,
      session: false,
    }
  ),
  googleSuccess
);

// RBAC examples

router.get(
  "/admin/users",
  protect,
  requirePermission(
    "users:read"
  ),
  async (_req, res) => {
    return res.json({
      message:
        "Users read permission granted",
    });
  }
);

router.get(
  "/admin/settings",
  protect,
  requirePermission(
    "settings:read",
    "settings:update"
  ),
  async (_req, res) => {
    return res.json({
      message:
        "Settings access granted",
    });
  }
);

router.delete(
  "/admin/user/:id",
  protect,
  requirePermission(
    "users:delete"
  ),
  async (req, res) => {
    return res.json({
      message: `User ${req.params.id} deleted`,
    });
  }
);

export default router;