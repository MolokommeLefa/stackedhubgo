export type Role = "Admin" | "Staff" | "Customer";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  loyaltyPoints?: number;
}

export type OrderStatus = "Placed" | "In kitchen" | "Ready" | "Completed" | "Cancelled" | "Scheduled";

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  addedByCustomerId?: string;
  addedByName?: string;
  specialInstructions?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
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
  scheduledFor?: string;
  fulfilment?: "Immediate" | "Scheduled" | "Collection" | "Delivery";
  estimatedReadyAt?: string;
  statusHistory?: OrderStatusEvent[];
  paymentMethod?: "Cash" | "Card";
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  specialInstructions?: string;
}

export interface OrderSlot {
  start: string;
  end: string;
  capacity: number;
  booked: number;
  remaining: number;
  available: boolean;
}

export type GroupBasketStatus = "Open" | "Locked" | "Converted" | "Cancelled";

export interface GroupParticipant {
  customerId: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface GroupBasketItem {
  id: string;
  customerId: string;
  customerName: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  specialInstructions?: string;
}

export interface GroupBasket {
  id: string;
  joinCode: string;
  status: GroupBasketStatus;
  hostCustomerId: string;
  hostName: string;
  createdAt: string;
  scheduledFor?: string;
  specialInstructions?: string;
  total: number;
  orderId?: string;
  participants: GroupParticipant[];
  items: GroupBasketItem[];
  paymentMethod?: "Cash" | "Card";
  /** Only supplied when the payment provider/API confirms the actual payment state. */
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  fulfilment?: "Collection" | "Delivery";
  /** Optional server-calculated estimate and actual milestone timestamps. */
  estimatedReadyAt?: string;
  readyAt?: string;
  completedAt?: string;
  deliveryStatus?: "Pending" | "Preparing" | "Ready for collection" | "Out for delivery" | "Delivered" | "Collected";
  statusHistory?: { status: OrderStatus; at: string }[];
  updatedAt?: string;
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

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  affordable: boolean;
}

export interface LoyaltyProgress {
  label: string;
  current: number;
  target: number;
  remaining: number;
}

export interface LoyaltyTransaction {
  id: string;
  points: number;
  type: "Earn" | "Redeem";
  reason: string;
  at: string;
  orderId?: string;
}

export interface LoyaltyWallet {
  balance: number;
  tier: string;
  earnRule: string;
  nextTier?: LoyaltyProgress | null;
  nextReward?: LoyaltyProgress | null;
  rewards: LoyaltyReward[];
  transactions: LoyaltyTransaction[];
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
