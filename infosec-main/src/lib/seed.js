const DAY = 86400000;

function daysAgo(days, hour = 9, minute = 0) {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const rawSuppliers = [
  ["Lutong Bahay Poultry", "Alma Reyes", "alma@lutongbahay.ph", "+63 917 224 1180", "Quezon City", 2, 4.8, "Active"],
  ["Rice & Grain Depot", "Rico Tan", "rico@ricegrain.ph", "+63 918 553 9021", "Valenzuela", 3, 4.7, "Active"],
  ["Sarap Meats Trading", "Grace Lim", "grace@sarapmeats.ph", "+63 920 771 4432", "Pasig", 2, 4.6, "Active"],
  ["Fresh Catch Seafood", "Nestor Aquino", "nestor@freshcatch.ph", "+63 915 662 8890", "Caloocan", 2, 4.5, "Active"],
  ["Kanin & Egg Supply", "Sheila Bautista", "sheila@kaninegg.ph", "+63 917 330 7745", "Mandaluyong", 1, 4.9, "Active"],
  ["Pinoy Produce Market", "Dennis Ong", "dennis@pinoyproduce.ph", "+63 921 448 2210", "Makati", 2, 4.7, "Active"],
  ["Panadero Beverage Co.", "Carlo Mendoza", "carlo@panadero.ph", "+63 919 887 3341", "Bulacan", 4, 4.3, "Active"],
  ["Kapehan Manila", "Bea Salvador", "bea@kapehan.ph", "+63 916 205 6698", "Manila", 3, 4.4, "Active"],
];

export const seedSuppliers = rawSuppliers.map(
  ([name, contact, email, phone, city, leadTime, rating, status], index) => ({
    id: `s${index + 1}`,
    name,
    contact,
    email,
    phone,
    city,
    leadTime,
    rating,
    status,
  }),
);

const rawProducts = [
  ["SL-1001", "Tapsilog", "Beef Silog", "s3", 95, 145, 42, 15, "meal", "A1-01"],
  ["SL-1002", "Tocilog", "Pork Silog", "s3", 80, 125, 36, 15, "meal", "A1-02"],
  ["SL-1003", "Longsilog", "Pork Silog", "s3", 78, 120, 28, 12, "meal", "A1-03"],
  ["SL-1004", "Chicksilog", "Chicken Silog", "s1", 82, 130, 34, 15, "meal", "A1-04"],
  ["SL-1005", "Bangsilog", "Seafood Silog", "s4", 88, 135, 18, 10, "meal", "A1-05"],
  ["SL-1006", "Spamsilog", "Pork Silog", "s3", 72, 115, 24, 12, "meal", "A1-06"],
  ["SL-1007", "Hotsilog", "Pork Silog", "s3", 68, 110, 32, 12, "meal", "A1-07"],
  ["SL-1008", "Cornsilog", "Breakfast Silog", "s3", 70, 115, 20, 10, "meal", "A1-08"],
  ["SL-1009", "Liempog", "Pork Silog", "s3", 92, 145, 16, 10, "meal", "A1-09"],
  ["SL-1010", "Sisigsilog", "Pork Silog", "s3", 98, 155, 14, 10, "meal", "A1-10"],
  ["SL-1011", "Adosilog", "Chicken Silog", "s1", 88, 140, 22, 12, "meal", "A2-01"],
  ["SL-1012", "Hotdog Silog", "Breakfast Silog", "s3", 65, 105, 40, 15, "meal", "A2-02"],
  ["SL-1013", "Daingsilog", "Seafood Silog", "s4", 85, 135, 12, 8, "meal", "A2-03"],
  ["SL-1014", "Hungarian Silog", "Pork Silog", "s3", 90, 145, 19, 10, "meal", "A2-04"],
  ["SL-1015", "Tokwa’t Baboy Silog", "Vegetarian Silog", "s6", 75, 125, 26, 10, "meal", "A2-05"],
  ["SL-1016", "Eggsilog", "Budget Silog", "s5", 35, 70, 55, 20, "meal", "A2-06"],
  ["SL-1017", "Garlic Rice with Egg", "Sides", "s5", 25, 55, 48, 15, "order", "B1-01"],
  ["SL-1018", "Extra Fried Egg", "Sides", "s5", 12, 25, 80, 25, "pc", "B1-02"],
  ["SL-1019", "Iced Coffee", "Drinks", "s8", 25, 55, 45, 15, "cup", "C1-01"],
  ["SL-1020", "Calamansi Juice", "Drinks", "s6", 18, 45, 50, 15, "cup", "C1-02"],
];

const productAge = [2, 5, 1, 9, 14, 3, 6, 2, 8, 11, 1, 4, 12, 7, 2, 5, 16, 3, 9, 6, 4, 10, 2, 7, 18, 5, 13];

export const seedProducts = rawProducts.map(
  ([sku, name, category, supplierId, cost, price, quantity, reorderLevel, unit, location], index) => ({
    id: `p${index + 1}`,
    sku,
    name,
    category,
    supplierId,
    cost,
    price,
    quantity,
    reorderLevel,
    unit,
    location,
    updatedAt: daysAgo(productAge[index], 8 + (index % 9), (index * 7) % 60),
  }),
);

const movementPlan = [
  [0, "p6", "out", 12, "Counter sale — Lunch order #4821", "Ana Villanueva", 10, 24],
  [0, "p11", "out", 30, "Counter sale — Meal order #4822", "Kevin Ramos", 11, 5],
  [0, "p5", "in", 30, "Fresh delivery from Fresh Catch Seafood", "Jomar Dela Cruz", 8, 40],
  [0, "p1", "out", 3, "Released for breakfast service", "Ana Villanueva", 13, 15],
  [1, "p15", "in", 12, "Restock — PO-2026-018", "Jomar Dela Cruz", 9, 20],
  [1, "p20", "out", 40, "Counter sale — Meal order #4814", "Kevin Ramos", 14, 45],
  [1, "p9", "out", 8, "Counter sale — Meal order #4815", "Ana Villanueva", 15, 10],
  [2, "p3", "adjust", 2, "Cycle count variance — station A1-05", "Liza Fernandez", 16, 30],
  [2, "p17", "out", 6, "Counter sale — Meal order #4808", "Kevin Ramos", 11, 50],
  [2, "p11", "in", 12, "Fresh poultry delivery", "Jomar Dela Cruz", 10, 15],
  [3, "p11", "in", 200, "Bulk restock — PO-2026-016", "Jomar Dela Cruz", 9, 5],
  [3, "p2", "out", 4, "Counter sale — Meal order #4801", "Ana Villanueva", 13, 20],
  [3, "p16", "out", 10, "Breakfast set released to kitchen", "Kevin Ramos", 16, 5],
  [4, "p9", "out", 5, "Counter sale — Order #4795", "Ana Villanueva", 12, 25],
  [4, "p13", "out", 11, "Counter sale — Meal order #4796", "Kevin Ramos", 14, 40],
  [4, "p16", "in", 24, "Egg and rice delivery", "Jomar Dela Cruz", 9, 15],
  [5, "p1", "out", 5, "Counter sale — Meal order #4788", "Ana Villanueva", 11, 10],
  [5, "p12", "out", 6, "Counter sale — Order #4789", "Kevin Ramos", 15, 30],
  [5, "p14", "in", 100, "Restock — PO-2026-014", "Jomar Dela Cruz", 8, 50],
  [5, "p5", "out", 2, "Kitchen waste adjustment", "Ana Villanueva", 17, 20],
  [6, "p7", "out", 6, "Counter sale — Meal order #4781", "Kevin Ramos", 10, 45],
  [6, "p15", "out", 14, "Lunch rush meal release", "Ana Villanueva", 13, 20],
  [6, "p18", "in", 40, "Delivery from Lutong Bahay Poultry", "Jomar Dela Cruz", 9, 30],
  [7, "p12", "out", 10, "Counter sale — Meal order #4775", "Kevin Ramos", 11, 55],
  [7, "p4", "adjust", -1, "Spoilage — written off", "Liza Fernandez", 15, 20],
  [7, "p17", "in", 30, "Garlic rice restock", "Jomar Dela Cruz", 8, 25],
  [8, "p10", "out", 3, "Counter sale — Meal order #4768", "Ana Villanueva", 12, 35],
  [8, "p13", "out", 25, "Bulk daingsilog order", "Kevin Ramos", 14, 10],
  [9, "p20", "in", 20, "Calamansi juice restock", "Jomar Dela Cruz", 9, 45],
  [9, "p8", "out", 4, "Counter sale — Meal order #4760", "Ana Villanueva", 16, 25],
];

export const seedMovements = movementPlan
  .map(([days, productId, type, quantity, note, user, hour, minute], index) => ({
    id: `m${index + 1}`,
    productId,
    type,
    quantity,
    note,
    user,
    at: daysAgo(days, hour, minute),
  }))
  .sort((a, b) => new Date(b.at) - new Date(a.at));

const rawOrders = [
  ["PO-2026-019", "s1", "Sent", 2, 5, [["p3", 20, 78], ["p4", 10, 82]]],
  ["PO-2026-018", "s3", "Received", 6, -1, [["p15", 12, 75], ["p17", 15, 25]]],
  ["PO-2026-017", "s6", "Sent", 3, 4, [["p15", 40, 75], ["p16", 50, 35]]],
  ["PO-2026-016", "s7", "Received", 8, -3, [["p11", 200, 95], ["p12", 80, 70]]],
  ["PO-2026-015", "s2", "Draft", 1, 7, [["p13", 50, 210], ["p14", 100, 120]]],
  ["PO-2026-014", "s2", "Received", 12, -5, [["p14", 100, 90], ["p20", 20, 18]]],
  ["PO-2026-013", "s5", "Cancelled", 15, 3, [["p11", 10, 88]]],
  ["PO-2026-012", "s6", "Received", 16, -7, [["p17", 30, 25]]],
];

export const seedOrders = rawOrders.map(([code, supplierId, status, created, expected, items], index) => ({
  id: `o${index + 1}`,
  code,
  supplierId,
  status,
  createdAt: daysAgo(created, 10, 15),
  expectedAt: daysAgo(expected, 10, 15),
  items: items.map(([productId, quantity, unitCost]) => ({ productId, quantity, unitCost })),
}));

export const seedUsers = [
  {
    id: "u1",
    name: "Maria Santos",
    email: "admin@ctinassl.ph",
    role: "Admin",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(0, 8, 12),
  },
  {
    id: "u2",
    name: "Jomar Dela Cruz",
    email: "employee@ctinassl.ph",
    role: "Employee",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(0, 7, 45),
  },
  {
    id: "u3",
    name: "Ana Villanueva",
    email: "ana.villanueva@ctinassl.ph",
    role: "Employee",
    status: "Active",
    mfa: false,
    lastActive: daysAgo(0, 9, 30),
  },
  {
    id: "u4",
    name: "Kevin Ramos",
    email: "user@ctinassl.ph",
    role: "User",
    status: "Active",
    mfa: false,
    lastActive: daysAgo(1, 16, 20),
  },
  {
    id: "u5",
    name: "Liza Fernandez",
    email: "liza.fernandez@ctinassl.ph",
    role: "User",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(2, 14, 5),
  },
  {
    id: "u6",
    name: "Paolo Reyes",
    email: "paolo.reyes@ctinassl.ph",
    role: "User",
    status: "Suspended",
    mfa: false,
    lastActive: daysAgo(21, 11, 40),
  },
];

// Customer orders placed from the shop by Users.
const rawCustomerOrders = [
  ["SO-2026-001", "user@ctinassl.ph", "Kevin Ramos", "Pending", 0, 9, 20, "", [["p6", 2, 115]]],
  ["SO-2026-002", "user@ctinassl.ph", "Kevin Ramos", "Processing", 1, 14, 10, "Please call before delivery.", [["p5", 4, 135]]],
  ["SO-2026-003", "liza.fernandez@ctinassl.ph", "Liza Fernandez", "Ready", 2, 11, 5, "", [["p16", 1, 70]]],
  ["SO-2026-004", "user@ctinassl.ph", "Kevin Ramos", "Completed", 5, 10, 30, "Pick up at counter.", [["p1", 1, 145]]],
  ["SO-2026-005", "liza.fernandez@ctinassl.ph", "Liza Fernandez", "Cancelled", 3, 16, 0, "", [["p9", 2, 145]]],
];

export const seedCustomerOrders = rawCustomerOrders.map(
  ([code, userId, userName, status, days, hour, minute, note, items], index) => {
    const lines = items.map(([productId, quantity, price]) => ({
      productId,
      name: seedProducts.find((product) => product.id === productId)?.name ?? "Item",
      price,
      quantity,
    }));
    return {
      id: `so${index + 1}`,
      code,
      userId,
      userName,
      items: lines,
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      status,
      note,
      createdAt: daysAgo(days, hour, minute),
      updatedAt: daysAgo(days, hour, minute),
    };
  },
);

export const seedAudit = [
  ["Maria Santos", "Updated role permissions", "Admin — purchase order approval"],
  ["Jomar Dela Cruz", "Received purchase order", "PO-2026-018"],
  ["Liza Fernandez", "Ran inventory variance report", "August cycle count"],
  ["Ana Villanueva", "Recorded stock movement", "PT-1001 — 3 units out"],
  ["Maria Santos", "Suspended user account", "Paolo Reyes"],
  ["Jomar Dela Cruz", "Created purchase order", "PO-2026-019"],
  ["Kevin Ramos", "Recorded stock movement", "EL-6003 — 25 units out"],
  ["Maria Santos", "Enabled two-factor authentication", "Own account"],
].map(([actor, action, detail], index) => ({
  id: `a${index + 1}`,
  actor,
  action,
  detail,
  at: daysAgo(index, 9 + (index % 6), (index * 11) % 60),
}));

export const seedState = {
  products: seedProducts,
  suppliers: seedSuppliers,
  movements: seedMovements,
  orders: seedOrders,
  customerOrders: seedCustomerOrders,
  users: seedUsers,
  audit: seedAudit,
};
