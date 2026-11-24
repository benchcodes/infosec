import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, RotateCcw, ShoppingBag } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatCurrency, formatDateTime } from "../lib/format";
import { statusTone } from "../lib/metrics";

const ACTIVE = ["Pending", "Processing", "Ready"];
const STEPS = ["Pending", "Processing", "Ready", "Completed"];

function OrderProgress({ status }) {
  if (status === "Cancelled") return null;
  const current = Math.max(0, STEPS.indexOf(status));

  return (
    <div className="flex items-center border-b border-slate-100 px-4 py-3">
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <Fragment key={step}>
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  done ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                }`}
              >
                {index < current ? "✓" : index + 1}
              </span>
              <span
                className={`hidden text-[10px] font-medium sm:inline ${
                  done ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {step}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${index < current ? "bg-brand-500" : "bg-slate-200"}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

export default function MyOrders() {
  const { customerOrders, session, setCustomerOrderStatus, placeOrder } = useData();
  const { toast } = useToast();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reorderTarget, setReorderTarget] = useState(null);

  const mine = useMemo(
    () =>
      customerOrders
        .filter((order) => order.userId === session?.email)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [customerOrders, session?.email],
  );

  const active = mine.filter((order) => ACTIVE.includes(order.status)).length;
  const spent = mine
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My orders"
        description="Track every order you placed, from pending to ready for pickup."
        actions={
          <Button as={Link} to="/shop">
            <ShoppingBag className="h-4 w-4" /> Browse items
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total orders", value: mine.length },
          { label: "Active orders", value: active },
          { label: "Total value", value: formatCurrency(spent) },
        ].map((stat) => (
          <div key={stat.label} className="card p-4">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">
              {stat.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {mine.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={ClipboardList}
            title="You have not placed an order yet"
            description="Browse the catalog and add items to your first order."
            action={
              <Button as={Link} to="/shop" size="sm">
                Browse items
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {mine.map((order) => (
            <article key={order.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{order.code}</p>
                  <p className="text-[11px] text-slate-400">
                    Placed {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(order.status)} dot>
                    {order.status}
                  </Badge>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <OrderProgress status={order.status} />

              <ul className="divide-y divide-slate-50 px-4">
                {order.items.map((line) => (
                  <li key={line.productId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-800">{line.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {line.quantity} × {formatCurrency(line.price)}
                      </p>
                    </div>
                    <p className="text-[13px] text-slate-600">
                      {formatCurrency(line.price * line.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                <p className="min-w-0 flex-1 text-xs text-slate-500">
                  {order.note
                    ? `Note: ${order.note}`
                    : order.status === "Pending"
                      ? "Waiting for an employee to process this order."
                      : order.status === "Processing"
                        ? "An employee is preparing this order."
                        : order.status === "Ready"
                          ? "Ready for pickup or delivery."
                          : order.status === "Completed"
                            ? "Order completed."
                            : "Order cancelled and the stock was returned."}
                </p>
                <div className="flex items-center gap-1.5">
                  {(order.status === "Completed" || order.status === "Cancelled") && (
                    <Button size="sm" variant="secondary" onClick={() => setReorderTarget(order)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Order again
                    </Button>
                  )}
                  {order.status === "Pending" && (
                    <Button size="sm" variant="ghost" onClick={() => setCancelTarget(order)}>
                      Cancel order
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          setCustomerOrderStatus(cancelTarget.id, "Cancelled");
          toast({
            title: "Order cancelled",
            description: `${cancelTarget.code} was cancelled and the stock was returned.`,
            tone: "info",
          });
          setCancelTarget(null);
        }}
        title={`Cancel ${cancelTarget?.code ?? "order"}?`}
        description="The items will go back into stock and the order cannot be reopened."
        confirmLabel="Cancel order"
      />

      <ConfirmDialog
        open={Boolean(reorderTarget)}
        onClose={() => setReorderTarget(null)}
        onConfirm={() => {
          if (!reorderTarget) return;
          try {
            const created = placeOrder({
              items: reorderTarget.items.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
              })),
              note: `Reorder of ${reorderTarget.code}`,
            });
            toast({
              title: "Order placed",
              description: `${created.code} · ${formatCurrency(created.total)}`,
              tone: "success",
            });
          } catch (error) {
            toast({
              title: "Could not reorder",
              description: error.message,
              tone: "error",
            });
          }
          setReorderTarget(null);
        }}
        title={`Order ${reorderTarget?.code ?? ""} again?`}
        description="The same items and quantities will be placed as a new order, subject to available stock."
        confirmLabel="Place order"
      />
    </div>
  );
}
