// import { Router } from "express";
// import passport from "passport";
// import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
// import { resolvePermissions } from "../utils/rbac.js";
// import { prisma } from "../lib/prismadb.js";
// import { createCsrfPair } from "../utils/csrf.js";

// const router = Router();

// /* ================= GOOGLE LOGIN ================= */
// router.get(
//   "/google",
//   passport.authenticate("google", {
//     scope: ["profile", "email"],
//   })
// );

// /* ================= GOOGLE CALLBACK ================= */
// router.get(
//   "/google/callback",
//   passport.authenticate("google", {
//     session: false,
//     failureRedirect: `${process.env.CLIENT_URL}/auth`,
//   }),
//   async (req: any, res) => {
//     try {
//       const user = req.user;

//       if (!user) {
//         return res.redirect(`${process.env.CLIENT_URL}/auth`);
//       }

//       const fullUser = await prisma.user.findUnique({
//         where: { id: user.id },
//         include: { role: true },
//       });

//       if (!fullUser || !fullUser.role) {
//         return res.redirect(`${process.env.CLIENT_URL}/auth`);
//       }

//       const permissions = Array.from(
//         await resolvePermissions(fullUser.roleId)
//       );

//       const payload = {
//         id: fullUser.id,
//         roleId: fullUser.roleId,
//         roleName: fullUser.role.name,
//         permissions,
//       };

//       const accessToken = generateAccessToken(payload);
//       const refreshToken = generateRefreshToken();

//       // ✅ USE SAME CSRF SYSTEM AS REST OF APP
//       const { rawToken, hashedToken } = createCsrfPair();

//       await prisma.refreshToken.create({
//         data: {
//           token: refreshToken,
//           userId: fullUser.id,
//           csrfHash: hashedToken,
//           csrfPrevHash: null,
//           userAgent: req.headers["user-agent"] ?? null,
//           ipAddress: req.ip ?? null,
//           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//         },
//       });

//       const isProd = process.env.NODE_ENV === "production";

//       // ✅ SAME COOKIE CONFIG AS OTHER AUTH ROUTES
//       res.cookie("refreshToken", refreshToken, {
//         httpOnly: true,
//         secure: isProd,
//         sameSite: "strict",
//         path: "/",
//       });

//       /**
//        * ❌ DO NOT SET CSRF COOKIE
//        * ✅ SEND IT VIA URL (frontend will store it)
//        */

//       res.redirect(
//         `${process.env.CLIENT_URL}/auth/google/callback?token=${accessToken}&csrfToken=${rawToken}`
//       );
//     } catch (err) {
//       console.error("Google Auth Error:", err);
//       res.redirect(`${process.env.CLIENT_URL}/auth`);
//     }
//   }
// );

// export default router;