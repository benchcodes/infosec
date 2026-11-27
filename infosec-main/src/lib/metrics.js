export const STOCK_STATUS = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

export function productStatus(product) {
  if (!product) return STOCK_STATUS.out;
  if (product.quantity <= 0) return STOCK_STATUS.out;
  if (product.quantity <= product.reorderLevel) return STOCK_STATUS.low;
  return STOCK_STATUS.in;
}

export function statusTone(status) {
  switch (status) {
    case STOCK_STATUS.in:
    case "Active":
    case "Received":
    case "Approved":
    case "Completed":
      return "emerald";
    case STOCK_STATUS.low:
    case "Draft":
    case "Sent":
    case "Pending":
      return "amber";
    case "Processing":
    case "Ready":
      return "sky";
    case STOCK_STATUS.out:
    case "Suspended":
    case "Cancelled":
    case "Rejected":
      return "rose";
    default:
      return "slate";
  }
}

export function inventoryValue(products) {
  return products.reduce((total, product) => total + product.cost * product.quantity, 0);
}

export function retailValue(products) {
  return products.reduce((total, product) => total + product.price * product.quantity, 0);
}

export function stockHealth(products) {
  const counts = { in: 0, low: 0, out: 0 };
  products.forEach((product) => {
    const status = productStatus(product);
    if (status === STOCK_STATUS.in) counts.in += 1;
    else if (status === STOCK_STATUS.low) counts.low += 1;
    else counts.out += 1;
  });
  return counts;
}

export function categoryBreakdown(products) {
  const map = new Map();
  products.forEach((product) => {
    const current = map.get(product.category) ?? { category: product.category, units: 0, value: 0 };
    current.units += product.quantity;
    current.value += product.quantity * product.cost;
    map.set(product.category, current);
  });
  return [...map.values()].sort((a, b) => b.value - a.value);
}

export function movementSeries(movements, days = 7) {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const start = new Date(today);
    start.setDate(start.getDate() - offset);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    buckets.push({
      start,
      end,
      label: start.toLocaleDateString("en-PH", { weekday: "short" }),
      inbound: 0,
      outbound: 0,
    });
  }

  movements.forEach((movement) => {
    const at = new Date(movement.at);
    const bucket = buckets.find((item) => at >= item.start && at < item.end);
    if (!bucket) return;
    if (movement.type === "in") bucket.inbound += movement.quantity;
    else if (movement.type === "out") bucket.outbound += movement.quantity;
  });

  return buckets;
}

export function topMovingProducts(movements, products, limit = 5) {
  const totals = new Map();
  movements
    .filter((movement) => movement.type === "out")
    .forEach((movement) => {
      totals.set(movement.productId, (totals.get(movement.productId) ?? 0) + movement.quantity);
    });

  return [...totals.entries()]
    .map(([productId, units]) => {
      const product = products.find((item) => item.id === productId);
      return {
        id: productId,
        name: product?.name ?? "Unknown item",
        sku: product?.sku ?? "—",
        units,
        value: units * (product?.price ?? 0),
      };
    })
    .sort((a, b) => b.units - a.units)
    .slice(0, limit);
}

export function countPendingOrders(orders) {
  return orders.filter((order) => order.status === "Sent" || order.status === "Draft").length;
}

// Meal sales summary for the admin dashboard. Revenue only counts completed
// orders, while the top-meal list uses every order that was not cancelled.
export function mealSalesSummary(customerOrders = [], days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const since = new Date(today);
  since.setDate(since.getDate() - (days - 1));

  const windowOrders = customerOrders.filter((order) => {
    const at = new Date(order.createdAt);
    return !Number.isNaN(at.getTime()) && at >= since;
  });
  const billable = windowOrders.filter((order) => order.status !== "Cancelled");
  const completed = windowOrders.filter((order) => order.status === "Completed");

  const revenue = completed.reduce((total, order) => total + (Number(order.total) || 0), 0);
  const orderValue = billable.reduce((total, order) => total + (Number(order.total) || 0), 0);

  const meals = new Map();
  billable.forEach((order) => {
    (order.items ?? []).forEach((line) => {
      const current = meals.get(line.productId) ?? {
        id: line.productId,
        name: line.name,
        units: 0,
        revenue: 0,
      };
      const quantity = Number(line.quantity) || 0;
      current.units += quantity;
      current.revenue += quantity * (Number(line.price) || 0);
      meals.set(line.productId, current);
    });
  });

  return {
    revenue,
    completedCount: completed.length,
    placedCount: billable.length,
    openCount: customerOrders.filter((order) =>
      ["Pending", "Processing", "Ready"].includes(order.status),
    ).length,
    todayCount: customerOrders.filter((order) => {
      const at = new Date(order.createdAt);
      return !Number.isNaN(at.getTime()) && at >= today && order.status !== "Cancelled";
    }).length,
    averageOrder: billable.length ? orderValue / billable.length : 0,
    topMeals: [...meals.values()]
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 3),
  };
}

export function nextCode(prefix, existing, pad = 3) {
  const numbers = existing
    .map((value) => Number.parseInt(String(value).split("-").pop(), 10))
    .filter((value) => Number.isFinite(value));
  const highest = numbers.length ? Math.max(...numbers) : 0;
  return `${prefix}-${String(highest + 1).padStart(pad, "0")}`;
}
