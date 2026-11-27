import { useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import Cylinder3D from "./Cylinder3D";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import { formatCurrency, formatNumber } from "../../lib/format";
import { productStatus, statusTone } from "../../lib/metrics";
import { CARD_TONES } from "../../lib/palette";

export default function ProductOrbit({ products = [], cart = {}, onAdd, onBrowse }) {
  const featured = useMemo(
    () => products.filter((product) => product.quantity > 0).slice(0, 7),
    [products],
  );
  const [selected, setSelected] = useState(0);

  const current = featured[Math.min(selected, Math.max(0, featured.length - 1))];

  if (!current) return null;

  const inCart = cart[current.id] ?? 0;
  const status = productStatus(current);

  return (
    <section className="card overflow-hidden">
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Today’s featured silog</h2>
              <p className="text-xs text-slate-500">
                Spin the ring, tap a dish, then add it straight to your order.
              </p>
            </div>
            <Badge tone="sky" dot>
              {featured.length} featured
            </Badge>
          </div>

          <Cylinder3D
            items={featured}
            radius={212}
            itemWidth={178}
            itemHeight={160}
            selectedIndex={Math.min(selected, featured.length - 1)}
            onSelect={setSelected}
            label="Featured meals carousel"
            renderItem={(item, index, active, select) => (
              <button
                type="button"
                onClick={select}
                className={`flex h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-white p-3 text-left ring-1 transition ${
                  active
                    ? "shadow-xl ring-2 ring-brand-400"
                    : "ring-slate-200 hover:ring-brand-300"
                }`}
              >
                <span
                  className={`-mx-3 -mt-3 mb-2 block bg-gradient-to-r px-3 py-2 text-[10px] font-semibold tracking-wide text-white uppercase ${
                    CARD_TONES[index % CARD_TONES.length]
                  }`}
                >
                  {item.category}
                </span>

                <p className="line-clamp-2 text-[13px] leading-snug font-semibold text-slate-900">
                  {item.name}
                </p>

                <div>
                  <p className="text-base leading-none font-semibold text-slate-900">
                    {formatCurrency(item.price)}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatNumber(item.quantity)} {item.unit} left
                  </p>
                </div>
              </button>
            )}
          />
        </div>

        <aside className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-100">
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
            Selected meal
          </p>
          <h3 className="mt-1 text-lg leading-snug font-semibold text-slate-900">{current.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {current.category} · {current.sku}
          </p>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-xl font-semibold text-slate-900">
              {formatCurrency(current.price)}
            </span>
            <Badge tone={statusTone(status)} dot>
              {status}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {formatNumber(current.quantity)} {current.unit} available
          </p>

          {inCart > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-brand-700">
              {inCart} already in your order
            </p>
          )}

          <Button
            className="mt-4 w-full justify-center"
            onClick={() => onAdd?.(current)}
            disabled={current.quantity <= 0}
          >
            <Plus className="h-4 w-4" /> Add to order
          </Button>

          {onBrowse && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-center"
              onClick={() => onBrowse(current.category)}
            >
              Browse {current.category} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </aside>
      </div>
    </section>
  );
}
