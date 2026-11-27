import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Boxes } from "lucide-react";
import Cylinder3D from "./Cylinder3D";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency, formatNumber } from "../../lib/format";
import { CARD_TONES } from "../../lib/palette";

export default function CategoryCarousel({ categories = [], products = [] }) {
  const [selected, setSelected] = useState(0);

  const enriched = useMemo(
    () =>
      categories.map((entry) => {
        const items = products.filter((product) => product.category === entry.category);
        return {
          ...entry,
          key: entry.category,
          itemCount: items.length,
          low: items.filter((product) => product.quantity <= product.reorderLevel).length,
          top: [...items].sort((a, b) => b.quantity - a.quantity).slice(0, 3),
        };
      }),
    [categories, products],
  );

  const current = enriched[Math.min(selected, Math.max(0, enriched.length - 1))];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="card overflow-hidden p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Stock carousel</h2>
            <p className="text-xs text-slate-500">
              Spin through every category, then tap a card to inspect it.
            </p>
          </div>
          <Badge tone="sky" dot>
            {enriched.length} categories
          </Badge>
        </div>

        <Cylinder3D
          items={enriched}
          radius={258}
          itemWidth={180}
          itemHeight={156}
          selectedIndex={selected}
          onSelect={setSelected}
          label="Stock by category carousel"
          renderItem={(item, index, active, select) => (
            <button
              type="button"
              onClick={select}
              className={`flex h-full w-full flex-col justify-between rounded-2xl bg-white p-3.5 text-left ring-1 transition ${
                active
                  ? "shadow-xl ring-2 ring-brand-400"
                  : "ring-slate-200 hover:ring-brand-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${
                    CARD_TONES[index % CARD_TONES.length]
                  }`}
                >
                  <Boxes className="h-4 w-4" />
                </span>
                {item.low > 0 ? (
                  <Badge tone="amber" dot>
                    {item.low} low
                  </Badge>
                ) : (
                  <Badge tone="emerald" dot>
                    OK
                  </Badge>
                )}
              </div>

              <div>
                <p className="truncate text-[13px] font-semibold text-slate-900">{item.category}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
                </p>
              </div>

              <div>
                <p className="text-lg leading-none font-semibold text-slate-900">
                  {formatNumber(item.units)}{" "}
                  <span className="text-[11px] font-medium text-slate-400">units</span>
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {formatCurrency(item.value)} at cost
                </p>
              </div>
            </button>
          )}
        />
      </section>

      <aside className="card flex flex-col p-5">
        {current ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
                  Selected category
                </p>
                <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">
                  {current.category}
                </h3>
              </div>
              <Badge tone={current.low > 0 ? "amber" : "emerald"} dot>
                {current.low > 0 ? `${current.low} low` : "Healthy"}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-500">Units</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatNumber(current.units)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-500">Menu items</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatNumber(current.itemCount)}
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-[10px] text-slate-500">Stock value at cost</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatCurrency(current.value)}
                </p>
              </div>
            </div>

            <p className="mt-4 text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              Most stocked
            </p>
            <ul className="mt-2 space-y-1.5">
              {current.top.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate text-slate-600">{product.name}</span>
                  <span className="shrink-0 font-medium text-slate-900">
                    {formatNumber(product.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              as={Link}
              to={`/products?category=${encodeURIComponent(current.category)}`}
              size="sm"
              variant="secondary"
              className="mt-auto w-full justify-center"
            >
              Open in catalog <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-500">No categories yet.</p>
        )}
      </aside>
    </div>
  );
}
