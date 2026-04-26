import { notifyAdmins, createNotification } from './../services/notification.service.js';
import { eventBus } from "../lib/even.js";
import { EVENTS } from "../events/types.js";

/* =========================================================
   ORDER CREATED
========================================================= */
eventBus.on(EVENTS.ORDER_CREATED, async (payload) => {
  const { userId, orderId } = payload;

  // 👤 Notify user
  await createNotification({
    userId,
    type: "ORDER_UPDATE", // ✅ fixed to match enum
    title: "Order Placed",
    message: `Your order #${orderId} has been placed successfully`,
    entityId: orderId,
    entityType: "ORDER",
  });

  // 🧑‍💼 Notify admins
  await notifyAdmins({
    type: "ORDER_UPDATE", // ✅ fixed
    title: "New Order",
    message: `New order received (#${orderId})`,
    entityId: orderId,
    entityType: "ORDER",
  });
});

/* =========================================================
   ORDER PAID
========================================================= */
eventBus.on(EVENTS.ORDER_PAID, async (payload) => {
  const { userId, orderId } = payload;

  await createNotification({
    userId,
    type: "PAYMENT_UPDATE", // ✅ fixed
    title: "Payment Successful",
    message: `Payment received for order #${orderId}`,
    entityId: orderId,
    entityType: "PAYMENT",
  });
});

/* =========================================================
   USER REGISTERED
========================================================= */
eventBus.on(EVENTS.USER_REGISTERED, async (payload) => {
  const { userId } = payload;

  await createNotification({
    userId,
    type: "SYSTEM", // ✅ matches enum
    title: "Welcome 🎉",
    message: "Welcome to our platform!",
    entityType: "SYSTEM",
  });
});