import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Plus,
  TriangleAlert,
  Truck,
  Users,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Sparkline from "../components/charts/Sparkline";
import AreaChart from "../components/charts/AreaChart";
import Donut from "../components/charts/Donut";
import HoloCube from "../components/three/HoloCube";
import Tilt3D from "../components/three/Tilt3D";
import MenuManager from "../components/MenuManager";
import { useData } from "../lib/data-context";
import {
  categoryBreakdown,
  countPendingOrders,
  inventoryValue,
  mealSalesSummary,
  movementSeries,
  productStatus,
  stockHealth,
  STOCK_STATUS,
  statusTone,
  topMovingProducts,
} from "../lib/metrics";
import { formatCompactCurrency, formatCurrency, formatNumber, relativeTime } from "../lib/format";

const SALES_DAYS = 7;

function KpiCard({ label, value, hint, trend, sparkline }) {
  return (
    <Tilt3D className="card p-5" intensity={6}>
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
    </Tilt3D>
  );
}

export default function Dashboard() {
  const { products, movements, orders, customerOrders, suppliers, users, session } = useData();
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

  const queuedOrders = customerOrders.filter((order) => order.status === "Pending").length;
  const sales = useMemo(() => mealSalesSummary(customerOrders, SALES_DAYS), [customerOrders]);

  const cubeFaces = [
    {
      key: "value",
      title: "Inventory value",
      value: formatCompactCurrency(value),
      hint: `${formatNumber(products.length)} active SKUs`,
      tone: "brand",
      icon: Boxes,
      to: "/products",
    },
    {
      key: "reorder",
      title: "Needs reorder",
      value: formatNumber(health.low + health.out),
      hint: `${health.out} out of stock`,
      tone: "amber",
      icon: TriangleAlert,
      to: "/products?filter=low",
    },
    {
      key: "orders",
      title: "Purchase orders",
      value: formatNumber(pending),
      hint: `${suppliers.length} active suppliers`,
      tone: "sky",
      icon: ClipboardList,
      to: "/orders",
    },
    {
      key: "suppliers",
      title: "Suppliers",
      value: formatNumber(suppliers.length),
      hint: "Tap to manage partners",
      tone: "violet",
      icon: Truck,
      to: "/suppliers",
    },
    {
      key: "reports",
      title: "Movement window",
      value: `${range} days`,
      hint: `${formatNumber(inboundWeek)} in · ${formatNumber(outboundWeek)} out`,
      tone: "rose",
      icon: BarChart3,
      to: "/reports",
    },
    {
      key: "team",
      title: "Team access",
      value: formatNumber(users?.length ?? 0),
      hint: "Admin, employee, user accounts",
      tone: "slate",
      icon: Users,
      to: "/users",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here is how your silog meals and supplies are moving today."
        actions={
          <>
            <Button variant="secondary" as={Link} to="/reports">
              View reports
            </Button>
            <Button as={Link} to="/products?new=1">
              <Plus className="h-4 w-4" /> Add meal
            </Button>
          </>
        }
      />

      <section className="card relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl"
        />
        <div className="relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="min-w-0">
            <Badge tone="violet" dot>
              Admin control center
            </Badge>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              Your whole operation, one spin away
            </h2>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
              Drag the cube to inspect live numbers, then click any face to jump straight into that
              workspace.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Link
                to="/products?filter=low"
                className="group rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between">
                  <TriangleAlert className="h-4 w-4 text-amber-500" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-700" />
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">{health.low + health.out}</p>
                <p className="text-[11px] text-slate-500">items need reordering</p>
              </Link>

              <Link
                to="/order-queue"
                className="group rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-4 w-4 text-sky-500" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-700" />
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">{queuedOrders}</p>
                <p className="text-[11px] text-slate-500">customer orders waiting</p>
              </Link>

              <Link
                to="/suppliers"
                className="group rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100 transition hover:bg-slate-100"
              >
                <div className="flex items-center justify-between">
                  <Truck className="h-4 w-4 text-violet-500" />
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-slate-700" />
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-900">{suppliers.length}</p>
                <p className="text-[11px] text-slate-500">active suppliers</p>
              </Link>
            </div>
          </div>

          <HoloCube faces={cubeFaces} onSelect={(face) => navigate(face.to)} />
        </div>
      </section>

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

      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Meal sales</h2>
            <p className="text-xs text-slate-500">
              Completed and active customer orders from the last {SALES_DAYS} days.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="emerald" dot>
              {formatNumber(sales.completedCount)} completed
            </Badge>
            <Link
              to="/order-queue"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
            >
              Open order queue <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[11px] font-medium text-slate-500">Completed sales</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(sales.revenue)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {formatNumber(sales.completedCount)}{" "}
              {sales.completedCount === 1 ? "completed order" : "completed orders"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[11px] font-medium text-slate-500">Orders placed</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {formatNumber(sales.placedCount)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {formatNumber(sales.openCount)} still open · {formatNumber(sales.todayCount)} today
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
            <p className="text-[11px] font-medium text-slate-500">Average order</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {formatCurrency(sales.averageOrder)}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">Cancelled orders excluded</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Top meals ordered
            </p>
            <span className="text-[11px] text-slate-400">Units in the last {SALES_DAYS} days</span>
          </div>

          {sales.topMeals.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No customer orders in this window yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-3">
              {sales.topMeals.map((meal, index) => (
                <li
                  key={meal.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-3 py-2.5 ring-1 ring-slate-100"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-900">
                      <span className="mr-1.5 text-slate-400">{index + 1}.</span>
                      {meal.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{formatCurrency(meal.revenue)} sold</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-slate-900">
                    {formatNumber(meal.units)}
                    <span className="ml-1 text-[10px] font-normal text-slate-400">units</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <MenuManager />

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
