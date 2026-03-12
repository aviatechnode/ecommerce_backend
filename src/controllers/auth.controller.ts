import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schema.js";

import { prisma } from "../lib/prismadb.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.js";
import { resolvePermissions } from "../utils/rbac.js";
import { sendEmail } from "../utils/email.js";

/* =========================================================
   CONFIG
========================================================= */

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour


/* =========================================================
   REGISTER
========================================================= */

export const register = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Default role
    const role = await prisma.role.findUnique({
      where: { name: "CUSTOMER" },
    });

    if (!role)
      return res.status(500).json({ message: "Default role not found" });

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: role.id,
        verificationToken,
      },
    });

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    await sendEmail(
      user.email,
      "Verify Your Email",
      `<h2>Welcome ${user.name}</h2>
       <p>Please verify your email:</p>
       <a href="${verificationLink}">Verify Email</a>`
    );

    const permissions = Array.from(
      await resolvePermissions(role.id)
    );

    const accessToken = generateAccessToken({
      id: user.id,
      roleId: role.id,
      roleName: role.name,
      permissions,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      roleId: role.id,
      roleName: role.name,
      permissions,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(201).json({
      message: "User created successfully. Please verify your email.",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: role.id,
        roleName: role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================================
   LOGIN
========================================================= */

export const login = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.emailVerified)
      return res.status(403).json({ message: "Please verify your email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    if (!user.role)
      return res.status(500).json({ message: "User role not assigned" });

    const permissions = Array.from(
      await resolvePermissions(user.role.id)
    );

    const accessToken = generateAccessToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role.id,
        roleName: user.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================================
   REFRESH TOKEN (ROTATION ENABLED)
========================================================= */

export const refresh = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token = req.cookies?.refreshToken;
  if (!token)
    return res.status(401).json({ message: "No refresh token" });

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (!storedToken || storedToken.expiresAt < new Date())
    return res.status(403).json({ message: "Invalid refresh token" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.REFRESH_SECRET as string
    ) as any;

    await prisma.refreshToken.delete({ where: { token } });

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user || !user.role)
      return res.status(404).json({ message: "User not found" });

    const permissions = Array.from(
      await resolvePermissions(user.role.id)
    );

    const newAccessToken = generateAccessToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    const newRefreshToken = generateRefreshToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({ accessToken: newAccessToken });
  } catch {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user)
      return res.json({
        message:
          "If that email exists, a reset link has been sent.",
      });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(
          Date.now() + RESET_TOKEN_EXPIRY
        ),
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      `<p>Click below to reset your password:</p>
       <a href="${resetLink}">Reset Password</a>`
    );

    return res.json({
      message:
        "If that email exists, a reset link has been sent.",
    });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================================
   RESET PASSWORD
========================================================= */

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ errors: parsed.error.format() });

    const { token, password } = parsed.data;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user)
      return res.status(400).json({
        message: "Invalid or expired token",
      });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.json({
      message: "Password reset successful",
    });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

/* =========================================================
   LOGOUT
========================================================= */

export const logout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({
        where: { token },
      });
    }

    res.clearCookie("refreshToken");

    return res.json({ message: "Logged out successfully" });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};