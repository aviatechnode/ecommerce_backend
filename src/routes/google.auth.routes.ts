import { Router } from "express";
import passport from "passport";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { resolvePermissions } from "../utils/rbac.js";
import { prisma } from "../lib/prismadb.js";

const router = Router();

/* =========================================================
   STEP 1: REDIRECT TO GOOGLE
========================================================= */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false, // ✅ IMPORTANT (no sessions)
    prompt: "select_account", // ✅ better UX
  })
);

/* =========================================================
   STEP 2: GOOGLE CALLBACK
========================================================= */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/auth`,
  }),
  async (req: any, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth`);
      }

      /* -----------------------------------------------------
         🔥 IMPORTANT: Ensure role is loaded
      ----------------------------------------------------- */
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: true,
        },
      });

      if (!fullUser) {
        return res.redirect(`${process.env.CLIENT_URL}/auth`);
      }

      /* -----------------------------------------------------
         RESOLVE PERMISSIONS (RBAC)
      ----------------------------------------------------- */
      const permissions = Array.from(
        await resolvePermissions(fullUser.roleId)
      );

      /* -----------------------------------------------------
         TOKENS
      ----------------------------------------------------- */
      const payload = {
        id: fullUser.id,
        roleId: fullUser.roleId,
        roleName: fullUser.role?.name || "CUSTOMER",
        permissions,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      /* -----------------------------------------------------
         STORE REFRESH TOKEN (ROTATION READY)
      ----------------------------------------------------- */
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: fullUser.id,
          userAgent: req.headers["user-agent"] ?? null,
          ipAddress: req.ip ?? null,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      /* -----------------------------------------------------
         SET COOKIE (SECURE)
      ----------------------------------------------------- */
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax", // ✅ FIX: "strict" can break OAuth redirects
        path: "/api/auth", // ✅ scope cookie properly
      });

      /* -----------------------------------------------------
         REDIRECT TO FRONTEND
      ----------------------------------------------------- */
      res.redirect(
        `${process.env.CLIENT_URL}/auth/google/callback?token=${accessToken}`
      );
    } catch (err) {
      console.error("Google Auth Error:", err);
      res.redirect(`${process.env.CLIENT_URL}/auth`);
    }
  }
);

export default router;