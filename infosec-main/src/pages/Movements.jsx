import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  Download,
  Search,
  X,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import StockAdjustModal from "../components/forms/StockAdjustModal";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { downloadCsv } from "../lib/csv";
import { formatDateTime, formatNumber, relativeTime } from "../lib/format";

const TYPE_META = {
  in: { label: "Stock in", tone: "emerald", sign: "+" },
  out: { label: "Stock out", tone: "amber", sign: "−" },
  adjust: { label: "Adjustment", tone: "slate", sign: "±" },
};

const PAGE_SIZE = 10;

export default function Movements() {
  const { products, movements, recordMovement } = useData();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpenState, setModalOpenState] = useState(false);
  const [presetProduct, setPresetProduct] = useState(null);

  const productParam = params.get("product");
  const modalOpen = modalOpenState || Boolean(productParam);
  const activeProduct = presetProduct ?? productParam;

  const closeModal = () => {
    setModalOpenState(false);
    setPresetProduct(null);
    if (params.get("product")) {
      const next = new URLSearchParams(params);
      next.delete("product");
      setParams(next, { replace: true });
    }
  };

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return movements.filter((movement) => {
      if (type !== "all" && movement.type !== type) return false;
      if (!needle) return true;
      const product = productById.get(movement.productId);
      return [movement.note, movement.user, product?.name, product?.sku]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [movements, type, query, productById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const unitsIn = filtered.filter((item) => item.type === "in").reduce((sum, item) => sum + item.quantity, 0);
  const unitsOut = filtered
    .filter((item) => item.type === "out")
    .reduce((sum, item) => sum + item.quantity, 0);

  const submitMovement = (payload) => {
    const product = products.find((item) => item.id === payload.productId);
    recordMovement(payload);
    toast({
      title: "Movement recorded",
      description: `${product?.name ?? "Item"} · ${payload.type === "out" ? "−" : "+"}${Math.abs(payload.quantity)} ${product?.unit ?? "units"}`,
    });
  };

  const exportCsv = () => {
    downloadCsv("stock-movements.csv", [
      ["Date", "Product", "SKU", "Type", "Quantity", "Reference", "User"],
      ...filtered.map((movement) => {
        const product = productById.get(movement.productId);
        return [
          new Date(movement.at).toISOString(),
          product?.name ?? "Unknown",
          product?.sku ?? "—",
          TYPE_META[movement.type]?.label ?? movement.type,
          movement.quantity,
          movement.note,
          movement.user,
        ];
      }),
    ]);
    toast({ title: "Export ready", description: `${filtered.length} movements written to CSV` });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stock movements"
        description="A complete, attributed log of everything that entered or left the warehouse."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => {
                setPresetProduct(null);
                setModalOpenState(true);
              }}
            >
              <ArrowLeftRight className="h-4 w-4" /> Record movement
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Movements logged</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-900">{formatNumber(filtered.length)}</p>
        </div>
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Units received</p>
          <p className="mt-0.5 text-xl font-semibold text-emerald-600">+{formatNumber(unitsIn)}</p>
        </div>
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Units released</p>
          <p className="mt-0.5 text-xl font-semibold text-amber-600">−{formatNumber(unitsOut)}</p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "all", label: "All" },
              { value: "in", label: "Stock in" },
              { value: "out", label: "Stock out" },
              { value: "adjust", label: "Adjustments" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setType(option.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  type === option.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search product, note, or user…"
              aria-label="Search stock movements"
              className="field pl-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState
            title="No movements found"
            description="Adjust your filters or record a new stock movement."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Date</th>
                  <th className="th">Product</th>
                  <th className="th">Type</th>
                  <th className="th">Quantity</th>
                  <th className="th">Reference</th>
                  <th className="th">Recorded by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((movement) => {
                  const meta = TYPE_META[movement.type] ?? TYPE_META.adjust;
                  const product = productById.get(movement.productId);
                  return (
                    <tr key={movement.id} className="transition hover:bg-slate-50/70">
                      <td className="td whitespace-nowrap">
                        <p className="text-slate-800">{formatDateTime(movement.at)}</p>
                        <p className="text-xs text-slate-400">{relativeTime(movement.at)}</p>
                      </td>
                      <td className="td">
                        <p className="font-medium text-slate-900">{product?.name ?? "Deleted product"}</p>
                        <p className="text-xs text-slate-400">{product?.sku ?? "—"}</p>
                      </td>
                      <td className="td">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="td">
                        <span
                          className={`font-semibold ${
                            movement.type === "in"
                              ? "text-emerald-600"
                              : movement.type === "out"
                                ? "text-amber-600"
                                : "text-slate-600"
                          }`}
                        >
                          {movement.type === "in" ? "+" : movement.type === "out" ? "−" : "±"}
                          {Math.abs(movement.quantity)}
                        </span>
                        <span className="ml-1 text-xs text-slate-400">{product?.unit ?? "units"}</span>
                      </td>
                      <td className="td max-w-[280px]">
                        <p className="truncate text-slate-600">{movement.note}</p>
                      </td>
                      <td className="td whitespace-nowrap text-slate-600">{movement.user}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <p className="text-xs text-slate-500">
            Page <span className="font-medium text-slate-700">{safePage}</span> of {totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <StockAdjustModal
          onClose={closeModal}
          products={products}
          defaultProductId={activeProduct}
          onSubmit={submitMovement}
        />
      )}
    </div>
  );
}
