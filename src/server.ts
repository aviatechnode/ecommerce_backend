import express, { type Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import checkoutRoutes from "./routes/checkout.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import authRoutes from "./routes/auth.routes.js";
import googleAuthRoutes from "./routes/google.auth.routes.js";

import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";
import { requestContextMiddleware } from "./middlewares/request.context.middleware.js";

import passport from "passport";
import "./strategies/google.strategy.js";

dotenv.config({ quiet: true });

const app: Application = express();

/* ------------------------------------------------ */
/* Allowed origins                                  */
/* ------------------------------------------------ */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

/* ------------------------------------------------ */
/* Core Middleware                                  */
/* ------------------------------------------------ */

// ✅ CORS with credentials
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(requestContextMiddleware);

// ✅ Passport (Google auth)
app.use(passport.initialize());

/* ------------------------------------------------ */
/* Security Middleware                              */
/* ------------------------------------------------ */
app.use(helmet());
app.use(hpp());

/* ------------------------------------------------ */
/* Rate Limiting (FIXED)                            */
/* ------------------------------------------------ */

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ ONLY protect login/register (NOT Google OAuth)
app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);

/* ------------------------------------------------ */
/* CSRF Token Endpoint                              */
/* ------------------------------------------------ */
app.get("/api/csrf-token", csrfMiddleware, (req, res) => {
  res.json({ csrfToken: req.cookies?.csrfToken });
});

/* ------------------------------------------------ */
/* Routes                                           */
/* ------------------------------------------------ */

// ✅ AUTH (includes Google)
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);

// ✅ PUBLIC
app.use("/api/categories", categoryRoutes);

// ✅ CHECKOUT (critical protection)
app.use(
  "/api/checkout",
  csrfMiddleware,
  idempotencyMiddleware,
  checkoutRoutes
);

// ✅ WISHLIST
app.use("/api/wishlist", csrfMiddleware, wishlistRoutes);

// ✅ WEBHOOKS
app.use("/webhooks", webhookRoutes);

/* ------------------------------------------------ */
/* OPTIONAL: silence favicon noise                  */
/* ------------------------------------------------ */
app.get("/favicon.ico", (_, res) => res.status(204).end());

/* ------------------------------------------------ */
/* Server                                           */
/* ------------------------------------------------ */
const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});