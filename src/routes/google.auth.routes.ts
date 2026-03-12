import { Router } from "express";
import passport from "passport";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { resolvePermissions } from "../utils/rbac.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req: any, res) => {
    const user = req.user;

    const permissions = Array.from(
      await resolvePermissions(user.roleId)
    );

    const accessToken = generateAccessToken({
      id: user.id,
      roleId: user.roleId,
      roleName: "CUSTOMER",
      permissions,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      roleId: user.roleId,
      roleName: "CUSTOMER",
      permissions,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.redirect(
      `${process.env.CLIENT_URL}?token=${accessToken}`
    );
  }
);