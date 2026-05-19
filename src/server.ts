import express, { type Application } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import { WebSocketServer } from "ws";

import "./jobs/cron.js";
import "./listeners/notification.listener.js";
import "./strategies/google.strategy.js";

/* ================= ROUTES ================= */
import rbacRoutes from "./routes/rbac.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import authRoutes from "./routes/auth.routes.js";
import googleAuthRoutes from "./routes/google.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";

/* ================= MIDDLEWARE ================= */
import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";
import { requestContextMiddleware } from "./middlewares/request.context.middleware.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";

import passport from "passport";
import brandRoutes from "./routes/brand.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import fitmentRoutes from "./routes/fitment.routes.js";
import auditLogRoutes from "./routes/auditlog.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reviewRoutes from "./routes/product.review.routes.js";
import couponRoutes from "./routes/coupon.routes.js"
import addressRoutes from "./routes/address.routes.js"
import locationRoutes from "./routes/location.routes.js"
import feedbackRoutes from "./routes/feedback.routes.js";


dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 8080;

/* ================= TRUST PROXY ================= */
app.set("trust proxy", 1);

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [ "Content-Type", "Authorization", "x-csrf-token", "idempotency-key",],
  })
);

/* ================= CORE ================= */
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(requestContextMiddleware);
app.use(passport.initialize());

/* ================= SECURITY ================= */
app.use(helmet());
app.use(hpp());

/* ================= RATE LIMIT ================= */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);

/* ================= AUTH ROUTES (NO CSRF) ================= */
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);

/* =========================================================
   GLOBAL CSRF (ONLY ONCE — FIXED)
========================================================= */
app.use(csrfMiddleware);

/* ================= PUBLIC / SEMI-PUBLIC ================= */

// products
app.use("/api/products", productRoutes);

// categories
app.use("/api/categories", categoryRoutes);

/* ================= ADMIN ================= */

app.use("/api/admin", adminRoutes);
app.use("/api/admin/rbac", rbacRoutes);

/* ================= PROTECTED FEATURES ================= */

// ✅ CSRF already applied globally → DO NOT repeat
app.use("/api/checkout", idempotencyMiddleware, checkoutRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/fitments", fitmentRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes)
app.use("/api/address", addressRoutes)
app.use("/api/locations", locationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/fitments", fitmentRoutes);


/* ================= WEBHOOKS ================= */
app.use("/webhooks", webhookRoutes);

/* ================= HEALTH ================= */
app.get("/favicon.ico", (_, res) => res.status(204).end());

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ================= WEBSOCKET ================= */

const wss = new WebSocketServer({
  server,
  path: "/",
});

wss.on("connection", (socket) => {
  console.log("🟢 WebSocket connected");

  socket.send(
    JSON.stringify({
      type: "CONNECTED",
      message: "Realtime dashboard active",
    })
  );

  socket.on("close", () => {
    console.log("🔴 WebSocket disconnected");
  });
});

/* ================= GLOBAL BROADCAST ================= */

export const broadcastDashboardUpdate = (payload: any) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(
        JSON.stringify({
          type: "DASHBOARD_UPDATE",
          payload,
        })
      );
    }
  });
};

/* ================= START SERVER ================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});