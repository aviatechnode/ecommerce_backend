import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Profile } from "passport-google-oauth20";
import { prisma } from "../lib/prismadb.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("Google account has no email"), false);
        }

        let user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          const role = await prisma.role.findUnique({
            where: { name: "CUSTOMER" },
          });

          if (!role) {
            return done(new Error("Default role not found"), false);
          }

          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName ?? "",
              password: "",
              emailVerified: true,
              roleId: role.id,
            },
            include: { role: true },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error, false);
      }
    }
  )
);