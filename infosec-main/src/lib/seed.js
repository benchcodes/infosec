const DAY = 86400000;

function daysAgo(days, hour = 9, minute = 0) {
  const date = new Date(Date.now() - days * DAY);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const rawSuppliers = [
  ["Prime Builders Supply", "Alma Reyes", "alma@primebuilders.ph", "+63 917 224 1180", "Quezon City", 3, 4.8, "Active"],
  ["Golden Bolt Manufacturing", "Rico Tan", "rico@goldenbolt.ph", "+63 918 553 9021", "Valenzuela", 5, 4.5, "Active"],
  ["Pacific Paints Inc.", "Grace Lim", "grace@pacificpaints.ph", "+63 920 771 4432", "Pasig", 4, 4.2, "Active"],
  ["Metro Plumbing Depot", "Nestor Aquino", "nestor@metroplumbing.ph", "+63 915 662 8890", "Caloocan", 2, 4.6, "Active"],
  ["Voltwire Electrical Corp.", "Sheila Bautista", "sheila@voltwire.ph", "+63 917 330 7745", "Mandaluyong", 6, 3.9, "Active"],
  ["SafeGuard Industrial", "Dennis Ong", "dennis@safeguard.ph", "+63 921 448 2210", "Makati", 3, 4.7, "Active"],
  ["Northline Fasteners", "Carlo Mendoza", "carlo@northline.ph", "+63 919 887 3341", "Bulacan", 7, 4.1, "Active"],
  ["Handy Tools Trading", "Bea Salvador", "bea@handytools.ph", "+63 916 205 6698", "Manila", 4, 4.4, "Inactive"],
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
  ["PT-1001", "Cordless Drill 18V", "Power Tools", "s1", 2850, 3990, 42, 15, "unit", "A1-03"],
  ["PT-1002", "Impact Driver 20V", "Power Tools", "s1", 3100, 4350, 18, 12, "unit", "A1-04"],
  ["PT-1003", 'Angle Grinder 4"', "Power Tools", "s1", 1980, 2790, 9, 10, "unit", "A1-05"],
  ['PT-1004', 'Circular Saw 7-1/4"', "Power Tools", "s1", 3420, 4890, 6, 8, "unit", "A1-06"],
  ["PT-1005", "Rotary Hammer SDS-Plus", "Power Tools", "s1", 6250, 8790, 0, 5, "unit", "A1-07"],
  ["HT-2001", "Claw Hammer 16oz", "Hand Tools", "s8", 320, 520, 120, 40, "unit", "B2-01"],
  ["HT-2002", "Screwdriver Set 12pc", "Hand Tools", "s8", 540, 890, 64, 20, "set", "B2-02"],
  ["HT-2003", 'Adjustable Wrench 10"', "Hand Tools", "s8", 410, 680, 38, 15, "unit", "B2-03"],
  ["HT-2004", "Tape Measure 5m", "Hand Tools", "s8", 145, 260, 210, 60, "unit", "B2-04"],
  ["HT-2005", "Pliers Set 3pc", "Hand Tools", "s8", 620, 980, 27, 12, "set", "B2-05"],
  ["FS-3001", 'Wood Screws #8 x 1.5" (100)', "Fasteners", "s7", 95, 165, 480, 150, "box", "C1-01"],
  ['FS-3002', 'Concrete Nails 2" (1kg)', "Fasteners", "s7", 70, 120, 95, 40, "pack", "C1-02"],
  ["FS-3003", "Hex Bolts M10 (50)", "Fasteners", "s2", 210, 340, 14, 25, "box", "C1-03"],
  ["FS-3004", "Wall Anchors (100)", "Fasteners", "s2", 120, 210, 160, 50, "box", "C1-04"],
  ["PA-4001", "Latex Paint White 4L", "Paint", "s3", 780, 1150, 22, 10, "gal", "D1-01"],
  ["PA-4002", "Paint Roller Set", "Paint", "s3", 180, 320, 58, 20, "set", "D1-02"],
  ["PA-4003", "Enamel Paint Gray 1L", "Paint", "s3", 340, 540, 7, 12, "can", "D1-03"],
  ['PL-5001', 'PVC Pipe 1/2" x 3m', "Plumbing", "s4", 165, 265, 130, 45, "pc", "E1-01"],
  ["PL-5002", "Faucet Chrome", "Plumbing", "s4", 540, 850, 33, 12, "unit", "E1-02"],
  ['PL-5003', 'Elbow Joint 1/2"', "Plumbing", "s4", 22, 45, 340, 100, "pc", "E1-03"],
  ["EL-6001", "THHN Wire #12 (100m)", "Electrical", "s5", 2450, 3290, 12, 8, "roll", "F1-01"],
  ["EL-6002", "Circuit Breaker 20A", "Electrical", "s5", 290, 470, 45, 15, "unit", "F1-02"],
  ["EL-6003", "LED Bulb 9W", "Electrical", "s5", 78, 145, 260, 80, "pc", "F1-03"],
  ["SF-7001", "Safety Goggles", "Safety", "s6", 135, 240, 76, 25, "pc", "G1-01"],
  ["SF-7002", "Heavy Duty Gloves", "Safety", "s6", 190, 320, 0, 30, "pair", "G1-02"],
  ["AD-8001", "Epoxy Adhesive 250ml", "Adhesives", "s2", 260, 420, 19, 10, "tube", "H1-01"],
  ["AD-8002", "Contact Cement 1L", "Adhesives", "s2", 310, 495, 11, 15, "can", "H1-02"],
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
  [0, "p6", "out", 12, "Counter sale — Job order #4821", "Ana Villanueva", 10, 24],
  [0, "p11", "out", 30, "Counter sale — Job order #4822", "Kevin Ramos", 11, 5],
  [0, "p23", "in", 60, "Delivery from Voltwire Electrical", "Jomar Dela Cruz", 8, 40],
  [0, "p1", "out", 3, "Released to project site — Brgy. San Roque", "Ana Villanueva", 13, 15],
  [1, "p15", "in", 12, "Restock — PO-2026-018", "Jomar Dela Cruz", 9, 20],
  [1, "p20", "out", 40, "Counter sale — Job order #4814", "Kevin Ramos", 14, 45],
  [1, "p9", "out", 8, "Counter sale — Job order #4815", "Ana Villanueva", 15, 10],
  [2, "p3", "adjust", 2, "Cycle count variance — shelf A1-05", "Liza Fernandez", 16, 30],
  [2, "p17", "out", 6, "Counter sale — Job order #4808", "Kevin Ramos", 11, 50],
  [2, "p21", "in", 6, "Delivery from Voltwire Electrical", "Jomar Dela Cruz", 10, 15],
  [3, "p11", "in", 200, "Bulk restock — PO-2026-016", "Jomar Dela Cruz", 9, 5],
  [3, "p2", "out", 4, "Counter sale — Job order #4801", "Ana Villanueva", 13, 20],
  [3, "p24", "out", 10, "Issued to warehouse crew", "Kevin Ramos", 16, 5],
  [4, "p19", "out", 5, "Counter sale — Job order #4795", "Ana Villanueva", 12, 25],
  [4, "p13", "out", 11, "Counter sale — Job order #4796", "Kevin Ramos", 14, 40],
  [4, "p16", "in", 24, "Delivery from Pacific Paints", "Jomar Dela Cruz", 9, 15],
  [5, "p1", "out", 5, "Counter sale — Job order #4788", "Ana Villanueva", 11, 10],
  [5, "p22", "out", 6, "Counter sale — Job order #4789", "Kevin Ramos", 15, 30],
  [5, "p14", "in", 100, "Restock — PO-2026-014", "Jomar Dela Cruz", 8, 50],
  [5, "p5", "out", 2, "Warranty replacement", "Ana Villanueva", 17, 20],
  [6, "p7", "out", 6, "Counter sale — Job order #4781", "Kevin Ramos", 10, 45],
  [6, "p25", "out", 14, "Issued to project site — Brgy. Poblacion", "Ana Villanueva", 13, 20],
  [6, "p18", "in", 40, "Delivery from Metro Plumbing Depot", "Jomar Dela Cruz", 9, 30],
  [7, "p12", "out", 10, "Counter sale — Job order #4775", "Kevin Ramos", 11, 55],
  [7, "p4", "adjust", -1, "Damaged in transit — written off", "Liza Fernandez", 15, 20],
  [7, "p26", "in", 30, "Restock — PO-2026-012", "Jomar Dela Cruz", 8, 25],
  [8, "p10", "out", 3, "Counter sale — Job order #4768", "Ana Villanueva", 12, 35],
  [8, "p23", "out", 25, "Bulk order — Villa Serena buildout", "Kevin Ramos", 14, 10],
  [9, "p27", "in", 20, "Delivery from Golden Bolt", "Jomar Dela Cruz", 9, 45],
  [9, "p8", "out", 4, "Counter sale — Job order #4760", "Ana Villanueva", 16, 25],
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
  ["PO-2026-019", "s1", "Sent", 2, 5, [["p3", 20, 1980], ["p4", 10, 3420]]],
  ["PO-2026-018", "s3", "Received", 6, -1, [["p15", 12, 780], ["p17", 15, 340]]],
  ["PO-2026-017", "s6", "Sent", 3, 4, [["p25", 40, 190], ["p24", 50, 135]]],
  ["PO-2026-016", "s7", "Received", 8, -3, [["p11", 200, 95], ["p12", 80, 70]]],
  ["PO-2026-015", "s2", "Draft", 1, 7, [["p13", 50, 210], ["p14", 100, 120]]],
  ["PO-2026-014", "s2", "Received", 12, -5, [["p14", 100, 120], ["p27", 20, 310]]],
  ["PO-2026-013", "s5", "Cancelled", 15, 3, [["p21", 10, 2450]]],
  ["PO-2026-012", "s6", "Received", 16, -7, [["p26", 30, 190]]],
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
    email: "maria.santos@ctinassl.ph",
    role: "Administrator",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(0, 8, 12),
  },
  {
    id: "u2",
    name: "Jomar Dela Cruz",
    email: "jomar.delacruz@ctinassl.ph",
    role: "Manager",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(0, 7, 45),
  },
  {
    id: "u3",
    name: "Ana Villanueva",
    email: "ana.villanueva@ctinassl.ph",
    role: "Staff",
    status: "Active",
    mfa: false,
    lastActive: daysAgo(0, 9, 30),
  },
  {
    id: "u4",
    name: "Kevin Ramos",
    email: "kevin.ramos@ctinassl.ph",
    role: "Staff",
    status: "Active",
    mfa: false,
    lastActive: daysAgo(1, 16, 20),
  },
  {
    id: "u5",
    name: "Liza Fernandez",
    email: "liza.fernandez@ctinassl.ph",
    role: "Auditor",
    status: "Active",
    mfa: true,
    lastActive: daysAgo(2, 14, 5),
  },
  {
    id: "u6",
    name: "Paolo Reyes",
    email: "paolo.reyes@ctinassl.ph",
    role: "Staff",
    status: "Suspended",
    mfa: false,
    lastActive: daysAgo(21, 11, 40),
  },
];

export const seedAudit = [
  ["Maria Santos", "Updated role permissions", "Manager — purchase order approval"],
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
  users: seedUsers,
  audit: seedAudit,
};
