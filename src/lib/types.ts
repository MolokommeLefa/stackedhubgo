export type Role = "Admin" | "Staff" | "Customer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  loyaltyPoints?: number;
}

export type OrderStatus = "Placed" | "In kitchen" | "Ready" | "Completed" | "Cancelled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  channel: "In-store" | "Website" | "Mobile app" | "Uber Eats" | "Mr D" | "WhatsApp";
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  placedAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: "Mains" | "Sides" | "Drinks" | "Desserts";
  price: number;
  stock: number;
  lowStockThreshold: number;
  spicy: boolean;
  available: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
  orders: number;
  spend: number;
  loyaltyPoints: number;
  tier: "New" | "Regular" | "VIP";
  note: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  redemptions: number;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  at: string;
}
