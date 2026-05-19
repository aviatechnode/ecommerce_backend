export const EVENTS = {
  // USER EVENTS
  USER_REGISTERED: "user.registered",
  USER_LOGIN: "user.login",
  USER_UPDATED: "user.updated",
  USER_PASSWORD_CHANGED: "user.password.changed",
  USER_EMAIL_VERIFIED: "user.email.verified",

  // ADDRESS EVENTS
  ADDRESS_CREATED: "address.created",
  ADDRESS_UPDATED: "address.updated",
  ADDRESS_DELETED: "address.deleted",

  // CART EVENTS
  CART_CREATED: "cart.created",
  CART_ITEM_ADDED: "cart.item.added",
  CART_ITEM_UPDATED: "cart.item.updated",
  CART_ITEM_REMOVED: "cart.item.removed",
  CART_CLEARED: "cart.cleared",

  // WISHLIST EVENTS
  WISHLIST_ITEM_ADDED: "wishlist.item.added",
  WISHLIST_ITEM_REMOVED: "wishlist.item.removed",

  // PRODUCT EVENTS
  PRODUCT_CREATED: "product.created",
  PRODUCT_UPDATED: "product.updated",
  PRODUCT_DELETED: "product.deleted",
  PRODUCT_LOW_STOCK: "product.low.stock",
  PRODUCT_OUT_OF_STOCK: "product.out.of.stock",
  PRODUCT_BACK_IN_STOCK: "product.back.in.stock",
  PRODUCT_PRICE_CHANGED: "product.price.changed",

  // CATEGORY / BRAND EVENTS
  CATEGORY_CREATED: "category.created",
  CATEGORY_UPDATED: "category.updated",

  BRAND_CREATED: "brand.created",
  BRAND_UPDATED: "brand.updated",

  // ORDER EVENTS
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_CANCELLED: "order.cancelled",
  ORDER_CONFIRMED: "order.confirmed",

  // PAYMENT EVENTS
  ORDER_PAYMENT_PENDING: "order.payment.pending",
  ORDER_PAID: "order.paid",
  ORDER_PAYMENT_FAILED: "order.payment.failed",
  ORDER_REFUNDED: "order.refunded",

  // SHIPPING EVENTS
  SHIPMENT_CREATED: "shipment.created",
  SHIPMENT_PROCESSING: "shipment.processing",
  SHIPMENT_SHIPPED: "shipment.shipped",
  SHIPMENT_IN_TRANSIT: "shipment.in.transit",
  SHIPMENT_OUT_FOR_DELIVERY: "shipment.out.for.delivery",
  SHIPMENT_DELIVERED: "shipment.delivered",
  SHIPMENT_FAILED: "shipment.failed",
  SHIPMENT_RETURNED: "shipment.returned",

  // REVIEW EVENTS
  REVIEW_CREATED: "review.created",
  REVIEW_UPDATED: "review.updated",
  REVIEW_DELETED: "review.deleted",

  // COUPON EVENTS
  COUPON_CREATED: "coupon.created",
  COUPON_UPDATED: "coupon.updated",
  COUPON_EXPIRED: "coupon.expired",

  // SUPPORT / CONTACT EVENTS
  CONTACT_MESSAGE_CREATED: "contact.message.created",
  SUPPORT_TICKET_CREATED: "support.ticket.created",
  SUPPORT_TICKET_UPDATED: "support.ticket.updated",

  // INVENTORY EVENTS
  INVENTORY_UPDATED: "inventory.updated",
  INVENTORY_RESERVED: "inventory.reserved",
  INVENTORY_RELEASED: "inventory.released",

  // NOTIFICATION EVENTS
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_FAILED: "notification.failed",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];