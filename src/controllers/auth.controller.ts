import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";

import {
  signupSchema,
  signinSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";

import { prisma } from "../lib/prismadb.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { resolvePermissions } from "../utils/rbac.js";
import { sendEmail } from "../utils/email.js";
import { createCsrfPair } from "../utils/csrf.js";

// ================================================================
// CONSTANTS
// ================================================================

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

// ================================================================
// SIGNUP
// ================================================================

export const signup = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { email, password, name } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = await prisma.role.findUnique({
      where: { name: "CUSTOMER" },
    });

    if (!role) {
      return res.status(500).json({ message: "Default role not found" });
    }

    const verificationToken = randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roleId: role.id,
        verificationToken,
      },
    });

    await sendEmail(
      user.email,
      "Verify Your Email",
      `<a href="${process.env.CLIENT_URL}/verify-email/${verificationToken}">Verify Email</a>`
    );

    const permissions = Array.from(await resolvePermissions(role.id));

    const accessToken = generateAccessToken({
      id: user.id,
      roleId: role.id,
      roleName: role.name,
      permissions,
    });

    const refreshToken = generateRefreshToken();

    // 🔐 CSRF
    const { rawToken, hashedToken } = createCsrfPair();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        csrfHash: hashedToken,
        csrfPrevHash: null,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
    });

    return res.status(201).json({
      accessToken,
      csrfToken: rawToken, // 🔥 send to frontend
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// VERIFY EMAIL
// ================================================================

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const tokenParam = req.params.token;

    if (!tokenParam || Array.isArray(tokenParam)) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: tokenParam },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// SIGNIN
// ================================================================

export const signin = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !user.role) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Verify your email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const permissions = Array.from(await resolvePermissions(user.role.id));

    const accessToken = generateAccessToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    const refreshToken = generateRefreshToken();

    // 🔐 CSRF
    const { rawToken, hashedToken } = createCsrfPair();

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        csrfHash: hashedToken,
        csrfPrevHash: null,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
    });

    return res.json({
      accessToken,
      csrfToken: rawToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: user.role.name,
        permissions,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// REFRESH TOKEN
// ================================================================

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!stored) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.deleteMany({ where: { token } });
      return res.status(403).json({ message: "Expired token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: stored.userId },
      include: { role: true },
    });

    if (!user || !user.role) {
      return res.status(404).json({ message: "User not found" });
    }

    const permissions = Array.from(await resolvePermissions(user.role.id));

    await prisma.refreshToken.deleteMany({ where: { token } });

    const newRefreshToken = generateRefreshToken();

    // 🔐 CSRF
    const { rawToken, hashedToken } = createCsrfPair();

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        csrfHash: hashedToken,
        csrfPrevHash: null,
        userAgent: req.headers["user-agent"] ?? null,
        ipAddress: req.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
      },
    });

    const newAccessToken = generateAccessToken({
      id: user.id,
      roleId: user.role.id,
      roleName: user.role.name,
      permissions,
    });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
    });

    return res.json({
      accessToken: newAccessToken,
      csrfToken: rawToken,
    });
  } catch (err) {
    console.error("REFRESH ERROR:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// SIGNOUT
// ================================================================

export const signout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
    });

    return res.json({ message: "Logged out" });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// FORGOT PASSWORD
// ================================================================

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const resetToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(resetToken).digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_EXPIRY),
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendEmail(
      user.email,
      "Password Reset",
      `<p>Click below to reset your password:</p><a href="${resetLink}">Reset Password</a>`
    );

    return res.json({ message: "If that email exists, a reset link has been sent." });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// RESET PASSWORD
// ================================================================

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.format() });
    }

    const { token, password } = parsed.data;

    const hashedToken = createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return res.json({ message: "Password reset successful" });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};

// ================================================================
// ME
// ================================================================

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { role: true },
    });

    if (!user || !user.role) {
      return res.status(404).json({ message: "User not found" });
    }

    const permissions = Array.from(await resolvePermissions(user.role.id));

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleName: user.role.name,
        permissions,
      },
    });
  } catch {
    return res.status(500).json({ message: "Server Error" });
  }
};