import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prismadb.js";
import { SUPER_ADMIN_ROLE } from "../utils/rbac.js";

/* =========================================================
   ENV
========================================================= */

const SERVER_URL = process.env.SERVER_URL;

if (!SERVER_URL) {
  throw new Error("SERVER_URL is not defined");
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not defined");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not defined");
}

/* =========================================================
   EXPRESS USER TYPE AUGMENTATION
========================================================= */

declare global {
  namespace Express {
    interface User {
      id: string;
      roleId: string;
      roleName: string;
      isSuperAdmin: boolean;
    }
  }
}

/* =========================================================
   GOOGLE STRATEGY
========================================================= */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/api/auth/google/callback`,
      proxy: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        /* ---------------- GET EMAIL ---------------- */

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email from Google"), false);
        }

        /* ---------------- FIND USER ---------------- */

        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ email }, { googleId: profile.id }],
          },
          include: { role: true },
        });

        /* ---------------- CREATE USER ---------------- */

        if (!dbUser) {
          const role = await prisma.role.findUnique({
            where: { name: "CUSTOMER" },
          });

          if (!role) {
            throw new Error("Default CUSTOMER role not found");
          }

          dbUser = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              googleId: profile.id,
              password: "", // OAuth users don't use password
              emailVerified: true,
              roleId: role.id,
            },
            include: { role: true },
          });
        }

        /* ---------------- LINK GOOGLE ---------------- */

        if (!dbUser.googleId) {
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              googleId: profile.id,
              emailVerified: true,
            },
            include: { role: true },
          });
        }

        /* ---------------- ROLE CHECK (FIXED) ---------------- */

        const isSuperAdmin = dbUser.role.name === SUPER_ADMIN_ROLE;

        /* ---------------- FINAL USER OBJECT ---------------- */

        const user: Express.User = {
          id: dbUser.id,
          roleId: dbUser.roleId,
          roleName: dbUser.role.name,
          isSuperAdmin,
        };

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);