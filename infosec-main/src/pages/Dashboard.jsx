import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Sparkline from "../components/charts/Sparkline";
import AreaChart from "../components/charts/AreaChart";
import Donut from "../components/charts/Donut";
import { useData } from "../lib/data-context";
import {
  categoryBreakdown,
  countPendingOrders,
  inventoryValue,
  movementSeries,
  productStatus,
  stockHealth,
  STOCK_STATUS,
  statusTone,
  topMovingProducts,
} from "../lib/metrics";
import { formatCompactCurrency, formatCurrency, formatNumber, relativeTime } from "../lib/format";

function KpiCard({ label, value, hint, trend, sparkline }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        {trend && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              trend.positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>

      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>

      {sparkline && <Sparkline data={sparkline} color="#10b981" height={32} className="mt-3" />}
    </div>
  );
}

export default function Dashboard() {
  const { products, movements, orders, suppliers, session } = useData();
  const navigate = useNavigate();
  const [range, setRange] = useState(7);

  const series = useMemo(() => movementSeries(movements, range), [movements, range]);
  const health = useMemo(() => stockHealth(products), [products]);
  const categories = useMemo(() => categoryBreakdown(products), [products]);
  const topMovers = useMemo(() => topMovingProducts(movements, products, 4), [movements, products]);

  const lowStock = products
    .filter((product) => product.quantity <= product.reorderLevel)
    .sort((a, b) => a.quantity / (a.reorderLevel || 1) - b.quantity / (b.reorderLevel || 1));

  const value = inventoryValue(products);
  const retail = products.reduce((total, product) => total + product.price * product.quantity, 0);
  const pending = countPendingOrders(orders);
  const outCount = products.filter((product) => productStatus(product) === STOCK_STATUS.out).length;

  const recent = movements.slice(0, 6);
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const inboundWeek = series.reduce((total, day) => total + day.inbound, 0);
  const outboundWeek = series.reduce((total, day) => total + day.outbound, 0);
  const flowSparkline = series.map((day) => day.inbound + day.outbound);

  const firstName = session.name.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here is how CTINASSL's stock is moving today."
        actions={
          <>
            <Button variant="secondary" as={Link} to="/reports">
              View reports
            </Button>
            <Button as={Link} to="/products?new=1">
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Inventory value (cost)"
          value={formatCompactCurrency(value)}
          hint={`${formatCompactCurrency(retail)} at retail price`}
          trend={{ positive: true, value: "4.2%" }}
          sparkline={flowSparkline}
        />
        <KpiCard
          label="Active SKUs"
          value={formatNumber(products.length)}
          hint={`Across ${categories.length} categories`}
          trend={{ positive: true, value: "2 new" }}
        />
        <KpiCard
          label="Needs reordering"
          value={formatNumber(health.low + health.out)}
          hint={`${outCount} item${outCount === 1 ? "" : "s"} out of stock`}
          trend={{ positive: false, value: `${health.out} critical` }}
        />
        <KpiCard
          label="Open purchase orders"
          value={formatNumber(pending)}
          hint={`${suppliers.length} active suppliers`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Stock movement</h2>
              <p className="text-xs text-slate-500">
                {formatNumber(inboundWeek)} units received · {formatNumber(outboundWeek)} units released
              </p>
            </div>
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              {[7, 14].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    range === option
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {option}d
                </button>
              ))}
            </div>
          </div>
          <AreaChart data={series} height={252} />
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Stock health</h2>
              <p className="text-xs text-slate-500">Based on reorder points</p>
            </div>
            <Badge tone={health.out > 0 ? "rose" : "emerald"} dot>
              {health.out > 0 ? `${health.out} critical` : "Healthy"}
            </Badge>
          </div>

          <Donut
            centerLabel="SKUs"
            centerValue={products.length}
            segments={[
              { label: "In stock", value: health.in, color: "#10b981" },
              { label: "Low stock", value: health.low, color: "#f59e0b" },
              { label: "Out of stock", value: health.out, color: "#f43f5e" },
            ]}
          />

          <div className="mt-5 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[13px] font-medium text-slate-700">Suggested next step</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {health.low + health.out} SKUs are at or below their reorder point. Raise a purchase
              order to avoid stockouts this week.
            </p>
            <Button
              variant="subtle"
              size="sm"
              className="mt-3 w-full justify-center"
              onClick={() => navigate("/orders?new=1")}
            >
              Create purchase order
            </Button>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Reorder queue</h2>
              <p className="text-xs text-slate-500">Items at or below their reorder point</p>
            </div>
            <Link
              to="/products?filter=low"
              className="text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-t border-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">On hand</th>
                  <th className="th">Reorder at</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStock.slice(0, 5).map((product) => {
                  const status = productStatus(product);
                  return (
                    <tr key={product.id} className="transition hover:bg-slate-50/70">
                      <td className="td">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.sku}</p>
                      </td>
                      <td className="td">
                        <span className="font-medium text-slate-900">{product.quantity}</span>
                        <span className="text-slate-400"> {product.unit}</span>
                      </td>
                      <td className="td text-slate-500">{product.reorderLevel}</td>
                      <td className="td">
                        <Badge tone={statusTone(status)} dot>
                          {status}
                        </Badge>
                      </td>
                      <td className="td text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/movements?product=${product.id}`)}
                        >
                          Restock
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-slate-900">Recent activity</h2>
            <Link to="/movements" className="text-xs font-medium text-brand-700 hover:text-brand-800">
              All
            </Link>
          </div>

          <ol className="mt-4 space-y-4">
            {recent.map((movement) => {
              const product = productById.get(movement.productId);
              const inbound = movement.type === "in";
              return (
                <li key={movement.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      inbound
                        ? "bg-emerald-50 text-emerald-700"
                        : movement.type === "out"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {inbound ? "+" : movement.type === "out" ? "−" : "±"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug text-slate-700">
                      <span className="font-medium text-slate-900">{movement.user}</span>{" "}
                      {inbound ? "received" : movement.type === "out" ? "released" : "adjusted"}{" "}
                      <span className="font-medium text-slate-900">
                        {movement.quantity} {product?.unit ?? "units"}
                      </span>{" "}
                      of {product?.name ?? "an item"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{relativeTime(movement.at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Top movers</h2>
            <p className="text-xs text-slate-500">Units released in the selected period</p>
          </div>
          <Badge tone="violet">{formatCurrency(topMovers.reduce((sum, item) => sum + item.value, 0))}</Badge>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {topMovers.map((item, index) => {
            const max = topMovers[0]?.units || 1;
            return (
              <li key={item.id} className="rounded-xl bg-slate-50/80 p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[13px] font-medium text-slate-800">
                    <span className="mr-1.5 text-slate-400">{index + 1}.</span>
                    {item.name}
                  </p>
                  <span className="shrink-0 text-xs font-semibold text-slate-900">{item.units}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${Math.max((item.units / max) * 100, 6)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  {item.sku} · {formatCurrency(item.value)} sold
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
