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
import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";
import wishlistRoutes from "./routes/wishlist.routes.js";





import authRoutes from "./routes/auth.routes.js";

dotenv.config({ quiet: true });

const app: Application = express();

/* ------------------------------------------------ */
/* Core Middleware                                  */
/* ------------------------------------------------ */

// CORS with credentials
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ------------------------------------------------ */
/* Security Middleware                              */
/* ------------------------------------------------ */
app.use(helmet()); // HTTP headers
app.use(hpp()); // Prevent HTTP parameter pollution

/* ------------------------------------------------ */
/* Rate Limiting (per route)                        */
/* ------------------------------------------------ */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);

/* ------------------------------------------------ */
/* CSRF Protection (double-submit cookie pattern)  */
/* ------------------------------------------------ */

/**
 * Modern CSRF without csurf:
 * 1. Generate a random token per session
 * 2. Set it in a httpOnly cookie (server) + send to client
 * 3. Client sends token back in header for state-changing requests
 */


// Endpoint for client to fetch CSRF token
app.get("/api/csrf-token", csrfMiddleware, (req, res) => {
  res.json({ csrfToken: req.cookies?.csrfToken });
});

/* ------------------------------------------------ */
/* Routes                                           */
/* ------------------------------------------------ */

app.use("/api/auth", csrfMiddleware, authRoutes);
app.use("/api/categories", categoryRoutes);

app.use(idempotencyMiddleware);
app.use("/api/checkout", checkoutRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/api/wishlist", wishlistRoutes);



/* ------------------------------------------------ */
/* Server                                           */
/* ------------------------------------------------ */

const PORT = Number(process.env.PORT) || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});