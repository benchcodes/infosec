import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import PurchaseOrderModal from "../components/forms/PurchaseOrderModal";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatCurrency, formatDate } from "../lib/format";
import { nextCode, statusTone } from "../lib/metrics";

const TABS = [
  { value: "all", label: "All" },
  { value: "Draft", label: "Draft" },
  { value: "Sent", label: "Sent" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function Orders() {
  const { orders, suppliers, products, createOrder, setOrderStatus } = useData();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [modalOpenState, setModalOpenState] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);

  const modalOpen = modalOpenState || params.get("new") === "1";

  const closeModal = () => {
    setModalOpenState(false);
    if (params.get("new") === "1") {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  };

  const supplierById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const orderTotal = (order) =>
    order.items.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

  const counts = useMemo(() => {
    const map = { all: orders.length };
    orders.forEach((order) => {
      map[order.status] = (map[order.status] ?? 0) + 1;
    });
    return map;
  }, [orders]);

  const visible = useMemo(
    () =>
      [...orders]
        .filter((order) => tab === "all" || order.status === tab)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders, tab],
  );

  const submitOrder = (payload) => {
    const year = new Date().getFullYear();
    const order = createOrder({
      ...payload,
      code: nextCode(`PO-${year}`, orders.map((item) => item.code)),
    });
    toast({
      title: "Purchase order created",
      description: `${order.code} saved as a draft`,
    });
  };

  const advance = (order, status) => {
    setOrderStatus(order.id, status);
    toast({
      title: status === "Received" ? "Order received" : "Order updated",
      description:
        status === "Received"
          ? `${order.code} — stock levels were updated automatically`
          : `${order.code} marked as ${status.toLowerCase()}`,
      tone: status === "Received" ? "success" : "info",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase orders"
        description="Track replenishment from draft to delivery."
        actions={
          <Button onClick={() => setModalOpenState(true)}>
            <Plus className="h-4 w-4" /> New order
          </Button>
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 p-4">
          {TABS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setTab(option.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                tab === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {option.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  tab === option.value ? "bg-white/20 text-white" : "bg-white text-slate-500"
                }`}
              >
                {counts[option.value] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No purchase orders here"
            description="Create an order to replenish stock from a supplier."
            action={<Button size="sm" onClick={() => setModalOpenState(true)}>New order</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Supplier</th>
                  <th className="th">Items</th>
                  <th className="th">Total</th>
                  <th className="th">Expected</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((order) => {
                  const supplier = supplierById.get(order.supplierId);
                  return (
                    <tr key={order.id} className="transition hover:bg-slate-50/70">
                      <td className="td">
                        <p className="font-medium text-slate-900">{order.code}</p>
                        <p className="text-xs text-slate-400">Created {formatDate(order.createdAt)}</p>
                      </td>
                      <td className="td">
                        <p className="text-slate-800">{supplier?.name ?? "Unassigned"}</p>
                        <p className="text-xs text-slate-400">{supplier?.city ?? "—"}</p>
                      </td>
                      <td className="td text-slate-600">
                        {order.items.length} line{order.items.length === 1 ? "" : "s"}
                        <p className="max-w-[220px] truncate text-xs text-slate-400">
                          {order.items
                            .map((line) => productById.get(line.productId)?.name ?? "Item")
                            .join(", ")}
                        </p>
                      </td>
                      <td className="td font-medium text-slate-900">{formatCurrency(orderTotal(order))}</td>
                      <td className="td whitespace-nowrap text-slate-600">{formatDate(order.expectedAt)}</td>
                      <td className="td">
                        <Badge tone={statusTone(order.status)} dot>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.status === "Draft" && (
                            <Button size="sm" variant="secondary" onClick={() => advance(order, "Sent")}>
                              Send
                            </Button>
                          )}
                          {order.status === "Sent" && (
                            <Button size="sm" onClick={() => advance(order, "Received")}>
                              Receive
                            </Button>
                          )}
                          {(order.status === "Draft" || order.status === "Sent") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelTarget(order)}
                              aria-label={`Cancel ${order.code}`}
                            >
                              Cancel
                            </Button>
                          )}
                          {(order.status === "Received" || order.status === "Cancelled") && (
                            <span className="text-xs text-slate-400">No actions</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <PurchaseOrderModal
          onClose={closeModal}
          suppliers={suppliers}
          products={products}
          onSubmit={submitOrder}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          advance(cancelTarget, "Cancelled");
          setCancelTarget(null);
        }}
        title={`Cancel ${cancelTarget?.code ?? "order"}?`}
        description="The order will be marked as cancelled and cannot be reopened."
        confirmLabel="Cancel order"
      />
    </div>
  );
}
