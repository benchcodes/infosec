import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Package,
  PackagePlus,
  Plus,
  TriangleAlert,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProductFormModal from "../components/forms/ProductFormModal";
import StockAdjustModal from "../components/forms/StockAdjustModal";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatCurrency, formatNumber, relativeTime } from "../lib/format";
import { productStatus, statusTone } from "../lib/metrics";

export default function EmployeeHome() {
  const {
    products,
    suppliers,
    movements,
    customerOrders,
    addProduct,
    recordMovement,
  } = useData();
  const { toast } = useToast();

  const [productModal, setProductModal] = useState(false);
  const [adjust, setAdjust] = useState(null);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const lowStock = useMemo(
    () => products.filter((product) => product.quantity <= product.reorderLevel),
    [products],
  );
  const outOfStock = products.filter((product) => product.quantity <= 0);
  const totalUnits = products.reduce((sum, product) => sum + product.quantity, 0);
  const pendingOrders = customerOrders.filter((order) => order.status === "Pending");

  const stats = [
    {
      label: "Meals in catalog",
      value: formatNumber(products.length),
      hint: "Everything customers can see",
      icon: Package,
      tone: "text-slate-500",
    },
    {
      label: "Units on hand",
      value: formatNumber(totalUnits),
      hint: `${formatNumber(outOfStock.length)} items out of stock`,
      icon: Boxes,
      tone: "text-slate-500",
    },
    {
      label: "Low stock",
      value: formatNumber(lowStock.length),
      hint: "At or below the reorder level",
      icon: TriangleAlert,
      tone: "text-amber-600",
    },
    {
      label: "Orders waiting",
      value: formatNumber(pendingOrders.length),
      hint: "Customer orders to process",
      icon: PackagePlus,
      tone: "text-sky-600",
    },
  ];

  const recent = movements.slice(0, 6);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Meal kitchen workspace"
        description="Add meals, keep stock counts accurate, and process customer orders."
        actions={
          <>
            <Button variant="secondary" onClick={() => setAdjust({ defaultProductId: products[0]?.id })}>
              <ArrowDownToLine className="h-4 w-4" /> Record stock
            </Button>
            <Button onClick={() => setProductModal(true)}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4">
              <div className="flex items-start justify-between">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
                  {stat.label}
                </p>
                <Icon className={`h-4 w-4 ${stat.tone}`} />
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{stat.hint}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Needs restocking</p>
              <p className="text-[11px] text-slate-400">
                Items at or below their reorder level
              </p>
            </div>
            <Button as={Link} to="/products?filter=low" size="sm" variant="secondary">
              View all
            </Button>
          </div>

          {lowStock.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-800">Every item is above its reorder level</p>
              <p className="mt-1 text-sm text-slate-500">No restocking needed right now.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="th">Item</th>
                    <th className="th">On hand</th>
                    <th className="th">Reorder at</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStock.slice(0, 8).map((product) => {
                    const status = productStatus(product);
                    return (
                      <tr key={product.id} className="transition hover:bg-slate-50/70">
                        <td className="td">
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400">
                            {product.sku} · {product.category}
                          </p>
                        </td>
                        <td className="td text-slate-700">
                          {formatNumber(product.quantity)} {product.unit}
                        </td>
                        <td className="td text-slate-600">{formatNumber(product.reorderLevel)}</td>
                        <td className="td">
                          <Badge tone={statusTone(status)} dot>
                            {status}
                          </Badge>
                        </td>
                        <td className="td text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAdjust({ defaultProductId: product.id })}
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" /> Restock
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Recent movements</p>
              <Button as={Link} to="/movements" size="sm" variant="ghost">
                All
              </Button>
            </div>
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No movements yet.</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {recent.map((movement) => {
                  const product = productById.get(movement.productId);
                  const incoming = movement.type === "in";
                  return (
                    <li key={movement.id} className="flex items-start gap-3 px-4 py-3">
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          incoming
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {incoming ? (
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-slate-800">
                          {product?.name ?? "Item"}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {incoming ? "+" : "−"}
                          {movement.quantity} · {movement.user}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {relativeTime(movement.at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-900">Inventory value</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatCurrency(products.reduce((sum, product) => sum + product.cost * product.quantity, 0))}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">At cost, across all items</p>
            <Button as={Link} to="/order-queue" size="sm" variant="secondary" className="mt-3 w-full">
              Open customer orders
            </Button>
          </div>
        </section>
      </div>

      {productModal && (
        <ProductFormModal
          onClose={() => setProductModal(false)}
          products={products}
          suppliers={suppliers}
          onSubmit={(payload) => {
            const product = addProduct(payload);
            toast({
              title: "Item added",
              description: `${product.name} is now visible in the shop.`,
            });
          }}
        />
      )}

      {adjust && (
        <StockAdjustModal
          onClose={() => setAdjust(null)}
          products={products}
          defaultProductId={adjust.defaultProductId}
          onSubmit={(payload) => {
            recordMovement(payload);
            toast({
              title: payload.type === "in" ? "Stock received" : "Stock updated",
              description: "The item count was adjusted and logged.",
              tone: "success",
            });
          }}
        />
      )}
    </div>
  );
}
