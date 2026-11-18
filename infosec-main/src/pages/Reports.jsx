import { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Donut from "../components/charts/Donut";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { downloadCsv } from "../lib/csv";
import {
  categoryBreakdown,
  inventoryValue,
  retailValue,
  stockHealth,
  topMovingProducts,
} from "../lib/metrics";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "../lib/format";

export default function Reports() {
  const { products, movements, suppliers, orders } = useData();
  const { toast } = useToast();

  const categories = useMemo(() => categoryBreakdown(products), [products]);
  const health = useMemo(() => stockHealth(products), [products]);
  const movers = useMemo(() => topMovingProducts(movements, products, 6), [movements, products]);

  const cost = inventoryValue(products);
  const retail = retailValue(products);
  const margin = retail - cost;

  const slowMovers = useMemo(() => {
    const newest = movements.reduce(
      (max, movement) => Math.max(max, new Date(movement.at).getTime()),
      0,
    );
    const cutoff = newest - 30 * 86400000;
    const recentOut = new Set(
      movements
        .filter((movement) => movement.type === "out" && new Date(movement.at).getTime() >= cutoff)
        .map((movement) => movement.productId),
    );
    return products
      .filter((product) => !recentOut.has(product.id) && product.quantity > 0)
      .map((product) => ({
        ...product,
        tiedUp: product.quantity * product.cost,
      }))
      .sort((a, b) => b.tiedUp - a.tiedUp)
      .slice(0, 6);
  }, [products, movements]);

  const maxCategory = categories[0]?.value || 1;

  const exportSummary = () => {
    downloadCsv("inventory-report.csv", [
      ["Metric", "Value"],
      ["Inventory value (cost)", cost.toFixed(2)],
      ["Retail value", retail.toFixed(2)],
      ["Potential margin", margin.toFixed(2)],
      ["Active SKUs", products.length],
      ["Low stock SKUs", health.low],
      ["Out of stock SKUs", health.out],
      ["Suppliers", suppliers.length],
      ["Purchase orders", orders.length],
      [],
      ["Category", "Units", "Value at cost"],
      ...categories.map((category) => [category.category, category.units, category.value.toFixed(2)]),
    ]);
    toast({ title: "Report exported", description: "inventory-report.csv downloaded" });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Valuation, movement, and stock health at a glance."
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={exportSummary}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Inventory value (cost)", value: formatCompactCurrency(cost), hint: "Capital tied up" },
          { label: "Retail value", value: formatCompactCurrency(retail), hint: "If everything sells" },
          {
            label: "Potential margin",
            value: formatCompactCurrency(margin),
            hint: `${formatPercent((margin / (retail || 1)) * 100)} of retail`,
          },
          {
            label: "Units on hand",
            value: formatNumber(products.reduce((sum, product) => sum + product.quantity, 0)),
            hint: `${products.length} active SKUs`,
          },
        ].map((item) => (
          <div key={item.label} className="card p-5">
            <p className="text-[13px] font-medium text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Value by category</h2>
              <p className="text-xs text-slate-500">Stock at cost, highest first</p>
            </div>
            <Badge tone="sky">{categories.length} categories</Badge>
          </div>

          <ul className="space-y-4">
            {categories.map((category) => (
              <li key={category.category}>
                <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-medium text-slate-700">{category.category}</span>
                  <span className="text-slate-500">
                    {formatCurrency(category.value)}
                    <span className="ml-2 text-xs text-slate-400">{formatNumber(category.units)} units</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                    style={{ width: `${Math.max((category.value / maxCategory) * 100, 3)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold text-slate-900">Stock health</h2>
          <p className="mb-4 text-xs text-slate-500">Distribution across reorder points</p>

          <Donut
            centerLabel="SKUs"
            centerValue={products.length}
            segments={[
              { label: "In stock", value: health.in, color: "#10b981" },
              { label: "Low stock", value: health.low, color: "#f59e0b" },
              { label: "Out of stock", value: health.out, color: "#f43f5e" },
            ]}
          />

          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Service level</span>
              <span className="font-medium text-slate-900">
                {formatPercent((health.in / (products.length || 1)) * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Units released (30d)</span>
              <span className="font-medium text-slate-900">
                {formatNumber(
                  movements
                    .filter((movement) => movement.type === "out")
                    .reduce((sum, movement) => sum + movement.quantity, 0),
                )}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Top movers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-t border-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Product</th>
                  <th className="th text-right">Units out</th>
                  <th className="th text-right">Sales value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movers.map((item) => (
                  <tr key={item.id}>
                    <td className="td">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.sku}</p>
                    </td>
                    <td className="td text-right font-medium text-slate-900">{item.units}</td>
                    <td className="td text-right text-slate-600">{formatCurrency(item.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Slow-moving stock</h2>
            <Badge tone="amber">{formatCompactCurrency(slowMovers.reduce((sum, item) => sum + item.tiedUp, 0))} tied up</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-t border-slate-100">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Product</th>
                  <th className="th text-right">On hand</th>
                  <th className="th text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {slowMovers.map((item) => (
                  <tr key={item.id}>
                    <td className="td">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.sku} · no sales in 30 days
                      </p>
                    </td>
                    <td className="td text-right text-slate-600">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="td text-right text-slate-600">{formatCurrency(item.tiedUp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
