import express, { type Application } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import passport from "passport";

import "./jobs/cron.js";
import "./strategies/google.strategy.js";

import { paystackWebhook } from "./controllers/webhook.controller.js";

import rbacRoutes from "./routes/rbac.routes.js";
import checkoutRoutes from "./routes/checkout.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import authRoutes from "./routes/auth.routes.js";
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
import vehicleRoutes from "./routes/vehicle.routes.js";

import { idempotencyMiddleware } from "./middlewares/idempotency.middleware.js";
import { requestContextMiddleware } from "./middlewares/request.context.middleware.js";
import { csrfMiddleware } from "./middlewares/csrf.middleware.js";
import { WebSocketServer } from "./chat/websocket/websocket.sever.js";
import conversationRoutes from "./routes/chat/conversation.routes.js"
import conversationParticipantRoutes from "./routes/chat/conversation-participant.routes.js";
import conversationSLARoutes from "./routes/chat/conversation-sla.routes.js";
import conversationTagRoutes from "./routes/chat/conversation-tag.routes.js";
import conversationEventRoutes from "./routes/chat/conversation-event.routes.js";
import messageRoutes from "./routes/chat/message.routes.js";
import messageReadRoutes from "./routes/chat/message-read.routes.js";
import messageDraftRoutes from "./routes/chat/message-draft.routes.js";
import messageAttachmentRoutes from "./routes/chat/message-attachment.routes.js";
import supportTeamRoutes from "./routes/chat/support-team.routes.js";
import supportTeamMemberRoutes from "./routes/chat/support-team-member.routes.js";
import { supportTeamEventRoutes } from "./chat/_shared/composition/support-team-event.composition.js"
import notificationRouter from "./routes/chat/notification.routes.js";

dotenv.config();

const app: Application = express();
const server = http.createServer(app);
new WebSocketServer(server);

const DEFAULT_PORT =
  Number(process.env.PORT) || 8080;

let PORT = DEFAULT_PORT;

//////////////////////////////////////////////////////
// EXPRESS CONFIG
//////////////////////////////////////////////////////

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (
      origin,
      callback,
    ) => {
      if (!origin) {
        return callback(
          null,
          true,
        );
      }

      if (
        allowedOrigins.includes(
          origin,
        )
      ) {
        return callback(
          null,
          true,
        );
      }

      return callback(
        new Error(
          "Not allowed by CORS",
        ),
      );
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-csrf-token",
      "idempotency-key",
    ],
  }),
);

app.use(
  express.json({
    limit: "10kb",
  }),
);

app.use(cookieParser());

app.use(
  requestContextMiddleware,
);

app.use(
  passport.initialize(),
);

app.use(helmet());

app.use(hpp());

//////////////////////////////////////////////////////
// RATE LIMITING
//////////////////////////////////////////////////////

const authLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
  });

app.use(
  "/api/auth/signin",
  authLimiter,
);

app.use(
  "/api/auth/signup",
  authLimiter,
);

//////////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////////

app.use(
  "/api/auth",
  authRoutes,
);

app.use(
  csrfMiddleware,
);

app.use(
  "/api/products",
  productRoutes,
);

app.use(
  "/api/categories",
  categoryRoutes,
);

app.use(
  "/api/admin",
  adminRoutes,
);

app.use(
  "/api/admin/rbac",
  rbacRoutes,
);

app.use(
  "/api/checkout",
  idempotencyMiddleware,
  checkoutRoutes,
);

app.use(
  "/api/wishlist",
  wishlistRoutes,
);

app.use(
  "/api/brands",
  brandRoutes,
);

app.use(
  "/api/warehouses",
  warehouseRoutes,
);

app.use(
  "/api/fitments",
  fitmentRoutes,
);

app.use(
  "/api/audit-logs",
  auditLogRoutes,
);

app.use(
  "/api/cart",
  cartRoutes,
);

app.use(
  "/api/reviews",
  reviewRoutes,
);

app.use(
  "/api/coupons",
  couponRoutes,
);

app.use(
  "/api/address",
  addressRoutes,
);

app.use(
  "/api/locations",
  locationRoutes,
);

app.use(
  "/api/feedback",
  feedbackRoutes,
);

app.use(
  "/api/shipping",
  shippingRateRoutes,
);

app.use(
  "/api/shipping-zones",
  shippingZoneRoutes,
);

app.use(
  "/api/couriers",
  courierRoutes,
);

app.use(
  "/api/pickup-stations",
  pickupStationRouter,
);

app.use(
  "/api/shipment-events",
  shipmentEventRoutes,
);

app.use(
  "/api/delivery-slas",
  deliverySLARoutes,
);

app.use(
  "/api/checkout-sessions",
  checkoutSessionRoutes,
);

app.use(
  "/api/fulfillments",
  fulfillmentRoutes,
);

app.use(
  "/api/shipping-quotes",
  shippingQuoteRoutes,
);

app.use(
  "/api/vehicles",
  vehicleRoutes,
);

//////////////////////////////////////////////////////
// CHAT ROUTES
//////////////////////////////////////////////////////

app.use(
  "/api/chat/conversations",
  conversationRoutes,
);

app.use(
  "/api/chat/conversation-participants",
  conversationParticipantRoutes,
);

app.use(
  "/api/chat/conversation-slas",
  conversationSLARoutes,
);

app.use(
  "/api/chat/conversation-tags",
  conversationTagRoutes,
);

app.use(
  "/api/chat/conversation-events",
  conversationEventRoutes,
);

app.use(
  "/api/chat/messages",
  messageRoutes,
);

app.use(
  "/api/chat/message-reads",
  messageReadRoutes,
);

app.use(
  "/api/chat/message-drafts",
  messageDraftRoutes,
);

app.use(
  "/api/chat/attachments",
  messageAttachmentRoutes,
);

app.use(
  "/api/chat/support-team",
  supportTeamRoutes,
);

app.use(
  "/api/chat/support-team-members",
  supportTeamMemberRoutes,
);

app.use(
  "/api/chat/support-team-events",
  supportTeamEventRoutes,
);

app.use(
  "/api/chat/notifications",
  notificationRouter,
);

//////////////////////////////////////////////////////
// WEBHOOKS
//////////////////////////////////////////////////////

app.post(
  "/webhook/paystack",
  express.raw({
    type:
      "application/json",
  }),
  paystackWebhook,
);

//////////////////////////////////////////////////////
// HEALTH CHECK
//////////////////////////////////////////////////////

app.get(
  "/health",
  (_, res) => {
    res.json({
      status: "ok",
      uptime:
        process.uptime(),
      timestamp:
        new Date().toISOString(),
    });
  },
);


//////////////////////////////////////////////////////
// SERVER
//////////////////////////////////////////////////////

function startServer(
  port: number,
): void {
  server.listen(
    port,
    () => {
      console.log(
        `🚀 Server running on http://localhost:${port}`,
      );

      console.log(
        "💬 Chat Gateway initialized",
      );
    },
  );
}

server.on(
  "error",
  (
    err:
      NodeJS.ErrnoException,
  ) => {
    if (
      err.code ===
      "EADDRINUSE"
    ) {
      console.warn(
        `⚠️ Port ${PORT} is busy. Trying ${
          PORT + 1
        }...`,
      );

      PORT += 1;

      startServer(PORT);

      return;
    }

    console.error(
      "Server error:",
      err,
    );
  },
);

startServer(PORT);

export {
  app,
  server,
};