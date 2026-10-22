import type { AuditLogEntry, Customer, MenuItem, Order, Promotion } from "./types";

export const menuItems: MenuItem[] = [
  {
    id: "m1",
    name: "Peri-Peri Chicken Stack",
    description: "Flame-grilled chicken, chilli mayo, toasted brioche.",
    category: "Mains",
    price: 129,
    stock: 42,
    lowStockThreshold: 10,
    spicy: true,
    available: true,
  },
  {
    id: "m2",
    name: "Double Smash Burger",
    description: "Two beef patties, cheddar, house sauce, pickles.",
    category: "Mains",
    price: 145,
    stock: 28,
    lowStockThreshold: 10,
    spicy: false,
    available: true,
  },
  {
    id: "m3",
    name: "Bunny Chow",
    description: "Quarter loaf, slow-cooked lamb curry, carrot sambal.",
    category: "Mains",
    price: 119,
    stock: 16,
    lowStockThreshold: 10,
    spicy: true,
    available: true,
  },
  {
    id: "m4",
    name: "Boerewors Roll",
    description: "Grilled boerewors, chakalaka relish, soft roll.",
    category: "Mains",
    price: 89,
    stock: 7,
    lowStockThreshold: 10,
    spicy: false,
    available: true,
  },
  {
    id: "m5",
    name: "Chakalaka Fries",
    description: "Crispy fries loaded with spicy chakalaka and cheese.",
    category: "Sides",
    price: 55,
    stock: 4,
    lowStockThreshold: 10,
    spicy: true,
    available: true,
  },
  {
    id: "m6",
    name: "Onion Rings",
    description: "Beer-battered rings with garlic aioli.",
    category: "Sides",
    price: 45,
    stock: 33,
    lowStockThreshold: 10,
    spicy: false,
    available: true,
  },
  {
    id: "m7",
    name: "Homemade Lemonade",
    description: "Fresh lemon, mint, lightly sparkling.",
    category: "Drinks",
    price: 32,
    stock: 60,
    lowStockThreshold: 12,
    spicy: false,
    available: true,
  },
  {
    id: "m8",
    name: "Iced Rooibos",
    description: "Chilled rooibos with honey and citrus.",
    category: "Drinks",
    price: 28,
    stock: 48,
    lowStockThreshold: 12,
    spicy: false,
    available: true,
  },
  {
    id: "m9",
    name: "Malva Pudding",
    description: "Warm malva sponge with custard.",
    category: "Desserts",
    price: 49,
    stock: 12,
    lowStockThreshold: 8,
    spicy: false,
    available: true,
  },
  {
    id: "m10",
    name: "Koeksister Bites",
    description: "Syrup-soaked twists, three per serving.",
    category: "Desserts",
    price: 38,
    stock: 0,
    lowStockThreshold: 8,
    spicy: false,
    available: false,
  },
];

export const customers: Customer[] = [
  {
    id: "c1",
    name: "Priya Nair",
    email: "priya.nair@example.co.za",
    phone: "+27 82 114 7723",
    joinedAt: "2025-02-11",
    orders: 18,
    spend: 4120,
    loyaltyPoints: 412,
    tier: "VIP",
    note: "Prefers extra chilli, collects on Fridays.",
  },
  {
    id: "c2",
    name: "Marcus Bell",
    email: "marcus.bell@example.co.za",
    phone: "+27 71 908 3321",
    joinedAt: "2026-08-30",
    orders: 1,
    spend: 154,
    loyaltyPoints: 15,
    tier: "New",
    note: "Allergic to nuts.",
  },
  {
    id: "c3",
    name: "Elena Costa",
    email: "elena.costa@example.co.za",
    phone: "+27 83 552 9012",
    joinedAt: "2024-11-05",
    orders: 31,
    spend: 7890,
    loyaltyPoints: 789,
    tier: "VIP",
    note: "Birthday on 26 September.",
  },
  {
    id: "c4",
    name: "Sipho Dlamini",
    email: "sipho.dlamini@example.co.za",
    phone: "+27 74 220 1188",
    joinedAt: "2025-06-18",
    orders: 9,
    spend: 1980,
    loyaltyPoints: 198,
    tier: "Regular",
    note: "Orders for the office every Wednesday.",
  },
  {
    id: "c5",
    name: "Aisha Patel",
    email: "aisha.patel@example.co.za",
    phone: "+27 76 445 7710",
    joinedAt: "2025-09-02",
    orders: 6,
    spend: 1290,
    loyaltyPoints: 129,
    tier: "Regular",
    note: "Vegetarian options only.",
  },
];

const ago = (now: number, minutes: number) => new Date(now - minutes * 60_000).toISOString();

/** Active tickets sit in the last few minutes so the queue looks live. */
export function createSeedOrders(now = Date.now()): Order[] {
  return [
    {
      id: "o1",
      reference: "#4821",
      customerId: "c1",
      customerName: "Priya Nair",
      channel: "Website",
      items: [
        { menuItemId: "m1", name: "Peri-Peri Chicken Stack", quantity: 2, unitPrice: 129 },
        { menuItemId: "m5", name: "Chakalaka Fries", quantity: 1, unitPrice: 55 },
      ],
      total: 313,
      status: "In kitchen",
      fulfilment: "Collection",
      placedAt: ago(now, 8),
    },
    {
      id: "o2",
      reference: "#4820",
      customerId: "c2",
      customerName: "Marcus Bell",
      channel: "Mobile app",
      items: [
        { menuItemId: "m2", name: "Double Smash Burger", quantity: 1, unitPrice: 145 },
        { menuItemId: "m7", name: "Homemade Lemonade", quantity: 1, unitPrice: 32 },
      ],
      total: 177,
      status: "Ready",
      fulfilment: "Collection",
      placedAt: ago(now, 14),
    },
    {
      id: "o3",
      reference: "#4819",
      customerId: "c3",
      customerName: "Elena Costa",
      channel: "WhatsApp",
      items: [
        { menuItemId: "m3", name: "Bunny Chow", quantity: 1, unitPrice: 119 },
        { menuItemId: "m9", name: "Malva Pudding", quantity: 2, unitPrice: 49 },
      ],
      total: 217,
      status: "Placed",
      fulfilment: "Collection",
      placedAt: ago(now, 5),
    },
    {
      id: "o4",
      reference: "#4818",
      customerId: "c4",
      customerName: "Sipho Dlamini",
      channel: "Uber Eats",
      items: [
        { menuItemId: "m4", name: "Boerewors Roll", quantity: 4, unitPrice: 89 },
        { menuItemId: "m6", name: "Onion Rings", quantity: 2, unitPrice: 45 },
      ],
      total: 446,
      status: "Completed",
      fulfilment: "Delivery",
      placedAt: ago(now, 45),
    },
    {
      id: "o5",
      reference: "#4817",
      customerId: "c5",
      customerName: "Aisha Patel",
      channel: "Mr D",
      items: [
        { menuItemId: "m5", name: "Chakalaka Fries", quantity: 2, unitPrice: 55 },
        { menuItemId: "m8", name: "Iced Rooibos", quantity: 2, unitPrice: 28 },
      ],
      total: 166,
      status: "Completed",
      fulfilment: "Delivery",
      placedAt: ago(now, 70),
    },
    {
      id: "o6",
      reference: "#4816",
      customerId: "c1",
      customerName: "Priya Nair",
      channel: "In-store",
      items: [{ menuItemId: "m2", name: "Double Smash Burger", quantity: 1, unitPrice: 145 }],
      total: 145,
      status: "Cancelled",
      fulfilment: "Collection",
      placedAt: ago(now, 95),
    },
  ];
}

/** Snapshot for tests and static imports. Prefer createSeedOrders() for a live demo seed. */
export const orders: Order[] = createSeedOrders(Date.parse("2026-10-14T12:00:00Z"));

export const promotions: Promotion[] = [
  {
    id: "p1",
    title: "Two-for-Tuesday Stacks",
    description: "Buy any two mains and get 20% off the bill.",
    discountPercent: 20,
    startsAt: "2026-09-01",
    endsAt: "2026-10-31",
    active: true,
    redemptions: 214,
  },
  {
    id: "p2",
    title: "Loyalty Double Points",
    description: "Members earn double points on app orders over R150.",
    discountPercent: 0,
    startsAt: "2026-10-01",
    endsAt: "2026-10-31",
    active: true,
    redemptions: 96,
  },
  {
    id: "p3",
    title: "Winter Bunny Bundle",
    description: "Bunny chow and a hot drink for a fixed price.",
    discountPercent: 15,
    startsAt: "2026-06-01",
    endsAt: "2026-08-31",
    active: false,
    redemptions: 388,
  },
];

export function createSeedAudit(now = Date.now()): AuditLogEntry[] {
  return [
    {
      id: "a1",
      actor: "Thandi Mokoena",
      role: "Admin",
      action: "Updated promotion",
      target: "Two-for-Tuesday Stacks",
      at: ago(now, 20),
    },
    {
      id: "a2",
      actor: "Jason Reid",
      role: "Staff",
      action: "Changed order status to Ready",
      target: "#4820",
      at: ago(now, 14),
    },
    {
      id: "a3",
      actor: "Thandi Mokoena",
      role: "Admin",
      action: "Adjusted stock level",
      target: "Chakalaka Fries",
      at: ago(now, 70),
    },
    {
      id: "a4",
      actor: "Nomsa Khumalo",
      role: "Staff",
      action: "Created menu item",
      target: "Koeksister Bites",
      at: ago(now, 22 * 60),
    },
    {
      id: "a5",
      actor: "Thandi Mokoena",
      role: "Admin",
      action: "Deactivated staff account",
      target: "temp.cashier@stackedfoods.co.za",
      at: ago(now, 28 * 60),
    },
  ];
}

export const auditLog: AuditLogEntry[] = createSeedAudit(Date.parse("2026-10-14T12:00:00Z"));

export const hourlyOrders = [
  { hour: "10:00", orders: 12 },
  { hour: "11:00", orders: 19 },
  { hour: "12:00", orders: 38 },
  { hour: "13:00", orders: 31 },
  { hour: "14:00", orders: 17 },
  { hour: "15:00", orders: 14 },
  { hour: "16:00", orders: 22 },
  { hour: "17:00", orders: 29 },
  { hour: "18:00", orders: 41 },
  { hour: "19:00", orders: 26 },
];

export const revenueByDay = [
  { day: "Mon", revenue: 32100 },
  { day: "Tue", revenue: 38450 },
  { day: "Wed", revenue: 41200 },
  { day: "Thu", revenue: 36800 },
  { day: "Fri", revenue: 52400 },
  { day: "Sat", revenue: 61300 },
  { day: "Sun", revenue: 48210 },
];

export const bestSellers = [
  { name: "Peri-Peri Chicken Stack", sold: 214 },
  { name: "Double Smash Burger", sold: 189 },
  { name: "Bunny Chow", sold: 161 },
  { name: "Chakalaka Fries", sold: 143 },
];

export const currency = (amount: number) =>
  `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

export const formatSlot = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });

export function formatTimeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Just now";
  const mins = Math.max(0, Math.round((now - then) / 60_000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 12) return `${hours}h ago`;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  if (then >= startOfToday.getTime()) return "Today";
  const yesterday = new Date(startOfToday);
  yesterday.setDate(yesterday.getDate() - 1);
  if (then >= yesterday.getTime()) return "Yesterday";
  return `${Math.floor(hours / 24)}d ago`;
}
