import { useMemo, useState } from "react";
import { ClipboardList, Download, Search } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatCurrency, formatDateTime } from "../lib/format";
import { statusTone } from "../lib/metrics";
import { downloadCsv } from "../lib/csv";

const TABS = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Ready", label: "Ready" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

const NEXT_STEP = {
  Pending: { label: "Start processing", status: "Processing" },
  Processing: { label: "Mark ready", status: "Ready" },
  Ready: { label: "Complete", status: "Completed" },
};

export default function OrderQueue() {
  const { customerOrders, setCustomerOrderStatus } = useData();
  const { toast } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [cancelTarget, setCancelTarget] = useState(null);

  const counts = useMemo(() => {
    const map = { all: customerOrders.length };
    customerOrders.forEach((order) => {
      map[order.status] = (map[order.status] ?? 0) + 1;
    });
    return map;
  }, [customerOrders]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...customerOrders]
      .filter((order) => tab === "all" || order.status === tab)
      .filter((order) => {
        if (!needle) return true;
        return [order.code, order.userName, order.userId, order.note]
          .concat(order.items.map((line) => line.name))
          .some((value) => String(value ?? "").toLowerCase().includes(needle));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [customerOrders, tab, query]);

  const exportCsv = () => {
    const rows = [
      ["Order", "Customer", "Email", "Items", "Total", "Status", "Placed", "Note"],
      ...visible.map((order) => [
        order.code,
        order.userName,
        order.userId,
        order.items.map((line) => `${line.quantity}x ${line.name}`).join("; "),
        order.total,
        order.status,
        formatDateTime(order.createdAt),
        order.note ?? "",
      ]),
    ];
    downloadCsv(`customer-orders-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast({
      title: "Export ready",
      description: `${visible.length} order${visible.length === 1 ? "" : "s"} exported to CSV.`,
      tone: "success",
    });
  };

  const advance = (order) => {
    const step = NEXT_STEP[order.status];
    if (!step) return;
    setCustomerOrderStatus(order.id, step.status);
    toast({
      title: `Order ${step.status.toLowerCase()}`,
      description: `${order.code} — ${order.userName}`,
      tone: step.status === "Completed" ? "success" : "info",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customer orders"
        description="Orders placed by users. Move each one from pending to ready, then complete it."
        actions={
          <Badge tone="amber" dot>
            {counts.Pending ?? 0} waiting
          </Badge>
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-wrap gap-1.5">
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

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search code, customer, item…"
                aria-label="Search customer orders"
                className="field h-9 w-56 pl-9 text-[13px]"
              />
            </div>
            <Button size="sm" variant="secondary" onClick={exportCsv} disabled={visible.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={query ? "No orders match your search" : "No customer orders here"}
            description={
              query
                ? "Try a different order code, customer, or item name."
                : "When a user places an order from the shop it will appear in this list."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Order</th>
                  <th className="th">Customer</th>
                  <th className="th">Items</th>
                  <th className="th">Total</th>
                  <th className="th">Placed</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((order) => {
                  const step = NEXT_STEP[order.status];
                  const canCancel = ["Pending", "Processing", "Ready"].includes(order.status);
                  return (
                    <tr key={order.id} className="transition hover:bg-slate-50/70">
                      <td className="td">
                        <p className="font-medium text-slate-900">{order.code}</p>
                        <p className="max-w-[180px] truncate text-xs text-slate-400">
                          {order.note || "No note"}
                        </p>
                      </td>
                      <td className="td">
                        <p className="text-slate-800">{order.userName}</p>
                        <p className="text-xs text-slate-400">{order.userId}</p>
                      </td>
                      <td className="td text-slate-600">
                        {order.items.length} line{order.items.length === 1 ? "" : "s"}
                        <p className="max-w-[220px] truncate text-xs text-slate-400">
                          {order.items.map((line) => `${line.quantity}× ${line.name}`).join(", ")}
                        </p>
                      </td>
                      <td className="td font-medium text-slate-900">{formatCurrency(order.total)}</td>
                      <td className="td whitespace-nowrap text-slate-600">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="td">
                        <Badge tone={statusTone(order.status)} dot>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1.5">
                          {step && (
                            <Button size="sm" onClick={() => advance(order)}>
                              {step.label}
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelTarget(order)}
                              aria-label={`Cancel ${order.code}`}
                            >
                              Cancel
                            </Button>
                          )}
                          {!step && !canCancel && (
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

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (!cancelTarget) return;
          setCustomerOrderStatus(cancelTarget.id, "Cancelled");
          toast({
            title: "Order cancelled",
            description: `${cancelTarget.code} — stock was returned to inventory.`,
            tone: "info",
          });
          setCancelTarget(null);
        }}
        title={`Cancel ${cancelTarget?.code ?? "order"}?`}
        description="The items will be returned to stock and the customer will see the order as cancelled."
        confirmLabel="Cancel order"
      />
    </div>
  );
}
