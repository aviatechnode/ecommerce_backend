import type { Request, Response } from "express";
import { prisma } from "../lib/prismadb.js";
import { eventBus } from "../lib/even.js";
import { EVENTS } from "../events/types.js";

  // GET USER NOTIFICATIONS
export const getNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

   // MARK AS READ
export const markAsRead = async (req: Request, res: Response) => {
  try {
    let id = req.params.id;
    // Ensure id is a string (Prisma expects exact string)
    if (Array.isArray(id)) id = id[0];

    if (!id) return res.status(400).json({ message: "Notification ID is required" });

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

 //  MARK ALL AS READ

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE ORDER
export const createOrder = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Generate order fields
    const orderNumber = `ORD-${Date.now()}`;
    const status = "PENDING"; // OrderStatus enum
    const paymentStatus = "PENDING"; // PaymentStatus enum
    const subtotal = 0;
    const deliveryFee = 0;
    const totalAmount = subtotal + deliveryFee;

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        orderNumber,
        status,
        paymentStatus,
        subtotal,
        deliveryFee,
        totalAmount,
      },
    });

    // Emit order created event
    eventBus.emit(EVENTS.ORDER_CREATED, {
      userId: req.user.id,
      orderId: order.id,
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};