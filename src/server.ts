import express, { type Application } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import passport from "passport";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

import "./jobs/cron.js";
import "./listeners/notification.listener.js";
import "./strategies/google.strategy.js";
import { paystackWebhook } from "./controllers/webhook.controller.js";

import rbacRoutes from "./routes/rbac.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import authRoutes from "./routes/auth.routes.js";
// import googleAuthRoutes from "./routes/google.auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import productRoutes from "./routes/product.routes.js";
import brandRoutes from "./routes/brand.routes.js";
import warehouseRoutes from "./routes/warehouse.routes.js";
import fitmentRoutes from "./routes/fitment.routes.js";
import auditLogRoutes from "./routes/auditlog.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import reviewRoutes from "./routes/product.review.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import addressRoutes from "./routes/address.routes.js";
import locationRoutes from "./routes/location.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import shippingRateRoutes from "./routes/shipping-rate.route.js";
import shippingZoneRoutes from "./routes/shipping.zone.routes.js";
import courierRoutes from "./routes/courier.routes.js";
import pickupStationRouter from "./routes/pickup-station.routes.js";
import shipmentEventRoutes from "./routes/shipment.event.routes.js";
import deliverySLARoutes from "./routes/delivery-sla.routes.js";
import checkoutSessionRoutes from "./routes/checkout-session.routes.js";
import fulfillmentRoutes from "./routes/fulfillment.routes.js";
import shippingQuoteRoutes from "./routes/shipping-quote.routes.js";
import chatRoutes from "./routes/chat.routes.js";

import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";
import { requestContextMiddleware } from "./middlewares/request.context.middleware.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";
import { prisma } from "./lib/prismadb.js";

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const DEFAULT_PORT = Number(process.env.PORT) || 8080;
let PORT = DEFAULT_PORT;

app.set("trust proxy", 1);

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
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "idempotency-key",
    ],
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(requestContextMiddleware);
app.use(passport.initialize());

app.use(helmet());
app.use(hpp());

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);

app.use("/api/auth", authRoutes);
// app.use("/api/auth", googleAuthRoutes);

app.use(csrfMiddleware);

app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/admin/rbac", rbacRoutes);

app.use("/api/checkout", idempotencyMiddleware, checkoutRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/fitments", fitmentRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/shipping", shippingRateRoutes);
app.use("/api/shipping-zones", shippingZoneRoutes);
app.use("/api/couriers", courierRoutes);
app.use("/api/pickup-stations", pickupStationRouter);
app.use("/api/shipment-events", shipmentEventRoutes);
app.use("/api/delivery-slas", deliverySLARoutes);
app.use("/api/checkout-sessions", checkoutSessionRoutes);
app.use("/api/fulfillments", fulfillmentRoutes);
app.use("/api/shipping-quotes", shippingQuoteRoutes);
app.use("/api/chats", chatRoutes);
app.post(
  "/webhook/paystack",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

const wss = new WebSocketServer({ server });
app.set("wss", wss);

const userSockets = new Map<string, Set<WebSocket>>();
(wss as any).userSockets = userSockets;

wss.on("connection", (ws: WebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  let userId: string | null = null;
  if (token) {
    try {
      const decoded = jwt.verify(token as string, process.env.JWT_ACCESS_SECRET!) as any;
      userId = decoded.id;
      if (userId) {
        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId)!.add(ws);
        (ws as any).userId = userId;
        console.log(`🔌 WebSocket authenticated for user ${userId}`);
      }
    } catch (err) {
      console.error("WebSocket auth failed");
    }
  } else {
    console.log("WebSocket connection without token");
  }

  ws.on("message", async (data: Buffer) => {
    try {
      const payload = JSON.parse(data.toString());
      const { type, conversationId, content, replyToId, isInternal } = payload;

      if (!userId) return;
      const currentUserId = userId;

      if (type === "TYPING") {
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId, userId: { not: currentUserId } },
          select: { userId: true },
        });
        participants.forEach((p) => {
          const sockets = userSockets.get(p.userId);
          if (sockets) {
            sockets.forEach((socket) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(
                  JSON.stringify({
                    type: "TYPING",
                    conversationId,
                    userId: currentUserId,
                    isTyping: content === "start",
                  })
                );
              }
            });
          }
        });
      }

      if (type === "MESSAGE") {
        const { ChatService } = await import("./modules/chat/chatService.js");
        const newMessage = await ChatService.addMessage({
          conversationId,
          senderId: currentUserId,
          content,
          replyToId,
          isInternal,
          type: "TEXT",
        });
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId, userId: { not: currentUserId } },
          select: { userId: true },
        });
        participants.forEach((p) => {
          const sockets = userSockets.get(p.userId);
          if (sockets) {
            sockets.forEach((socket) => {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: "NEW_MESSAGE", payload: newMessage }));
              }
            });
          }
        });
      }
    } catch (err) {
      console.error("WebSocket message error:", err);
    }
  });

  ws.on("close", () => {
    if (userId && userSockets.has(userId)) {
      userSockets.get(userId)!.delete(ws);
      if (userSockets.get(userId)!.size === 0) userSockets.delete(userId);
      console.log(`🔌 WebSocket disconnected for user ${userId}`);
    } else {
      console.log("🔌 WebSocket disconnected (unauthenticated)");
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

function startServer(port: number) {
  server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
  });
}

server.on("error", (err: any) => {
  if (err.code === "EADDRINUSE") {
    console.warn(`⚠️ Port ${PORT} is busy. Trying ${PORT + 1}...`);
    PORT += 1;
    startServer(PORT);
  } else {
    console.error("Server error:", err);
  }
});

startServer(PORT);