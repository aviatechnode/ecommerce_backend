export type AdminStats = {
  users: number;
  orders: number;
  revenue: number;
  products: number;
  pendingOrders: number;
};

export type RevenuePoint = {
  date: string;
  revenue: number;
};