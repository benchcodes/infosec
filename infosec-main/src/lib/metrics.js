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
      return "emerald";
    case STOCK_STATUS.low:
    case "Draft":
    case "Sent":
    case "Pending":
      return "amber";
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

export function nextCode(prefix, existing, pad = 3) {
  const numbers = existing
    .map((value) => Number.parseInt(String(value).split("-").pop(), 10))
    .filter((value) => Number.isFinite(value));
  const highest = numbers.length ? Math.max(...numbers) : 0;
  return `${prefix}-${String(highest + 1).padStart(pad, "0")}`;
}
