import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../lib/prismadb.js";

const SERVER_URL = process.env.SERVER_URL!
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${SERVER_URL}/api/auth/google/callback`,
      proxy: true,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("No email from Google"), false);

        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { googleId: profile.id },
            ],
          },
          include: { role: true },
        });

        if (!user) {
          const role = await prisma.role.findUnique({
            where: { name: "CUSTOMER" },
          });

          if (!role) throw new Error("Role not found");

          user = await prisma.user.create({
            data: {
              email,
              name: profile.displayName,
              googleId: profile.id,
              password: "", // safe because Google login
              emailVerified: true,
              roleId: role.id,
            },
            include: { role: true },
          });
        }

        // Link account
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: profile.id,
              emailVerified: true,
            },
            include: { role: true },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);