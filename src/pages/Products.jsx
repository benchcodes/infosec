import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import ProductFormModal from "../components/forms/ProductFormModal";
import StockAdjustModal from "../components/forms/StockAdjustModal";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { downloadCsv } from "../lib/csv";
import { formatCurrency, formatNumber, relativeTime } from "../lib/format";
import { productStatus, statusTone, STOCK_STATUS } from "../lib/metrics";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

const SORTS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "qty-asc", label: "Lowest stock first" },
  { value: "value-desc", label: "Highest value first" },
  { value: "updated", label: "Recently updated" },
];

function statusKey(product) {
  const status = productStatus(product);
  if (status === STOCK_STATUS.in) return "in";
  if (status === STOCK_STATUS.low) return "low";
  return "out";
}

export default function Products() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct, recordMovement } = useData();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const query = params.get("q") ?? "";
  const statusFilter = params.get("filter") ?? "all";

  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);

  const [formOpenState, setFormOpenState] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formOpen = formOpenState || params.get("new") === "1";

  const closeForm = () => {
    setFormOpenState(false);
    setEditing(null);
    if (params.get("new") === "1") {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  };

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const supplierName = useMemo(() => {
    const map = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    return (id) => map.get(id) ?? "Unassigned";
  }, [suppliers]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = products.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (statusFilter !== "all" && statusKey(product) !== statusFilter) return false;
      if (!needle) return true;
      return [product.name, product.sku, product.category, supplierName(product.supplierId)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });

    list = [...list].sort((a, b) => {
      if (sort === "qty-asc") return a.quantity - b.quantity;
      if (sort === "value-desc") return b.quantity * b.cost - a.quantity * a.cost;
      if (sort === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [products, query, category, statusFilter, sort, supplierName]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalValue = filtered.reduce((total, product) => total + product.quantity * product.cost, 0);
  const lowCount = filtered.filter((product) => product.quantity <= product.reorderLevel).length;

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
    setPage(1);
  };

  const submitProduct = (data) => {
    if (editing) {
      updateProduct(editing.id, data);
      toast({ title: "Product updated", description: `${data.sku} — ${data.name}` });
    } else {
      addProduct(data);
      toast({ title: "Product created", description: `${data.sku} added to the catalog` });
    }
    setEditing(null);
  };

  const submitMovement = (payload) => {
    const product = products.find((item) => item.id === payload.productId);
    recordMovement(payload);
    toast({
      title: "Stock movement saved",
      description: `${product?.name ?? "Item"} · ${payload.type === "out" ? "−" : "+"}${Math.abs(payload.quantity)} ${product?.unit ?? "units"}`,
    });
  };

  const exportCsv = () => {
    downloadCsv("products.csv", [
      ["SKU", "Name", "Category", "Supplier", "Unit", "On hand", "Reorder point", "Cost", "Price", "Status"],
      ...filtered.map((product) => [
        product.sku,
        product.name,
        product.category,
        supplierName(product.supplierId),
        product.unit,
        product.quantity,
        product.reorderLevel,
        product.cost,
        product.price,
        productStatus(product),
      ]),
    ]);
    toast({ title: "Export ready", description: `${filtered.length} products written to CSV` });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Products"
        description="Manage your catalog, stock levels, and reorder points."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpenState(true);
              }}
            >
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Matching items</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-900">{formatNumber(filtered.length)}</p>
        </div>
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Stock value at cost</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-900">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card-flat px-4 py-3">
          <p className="text-xs font-medium text-slate-500">At or below reorder point</p>
          <p className="mt-0.5 text-xl font-semibold text-amber-600">{formatNumber(lowCount)}</p>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => updateParam("q", event.target.value)}
              placeholder="Search name, SKU, category…"
              aria-label="Search products"
              className="field pl-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => updateParam("q", "")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by category"
              className="field h-10 w-auto py-0 pr-8 text-[13px]"
            >
              <option value="all">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => updateParam("filter", event.target.value)}
              aria-label="Filter by status"
              className="field h-10 w-auto py-0 pr-8 text-[13px]"
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort products"
              className="field h-10 w-auto py-0 pr-8 text-[13px]"
            >
              {SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <EmptyState
            title="No products match your filters"
            description="Try a different search term, category, or status."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setParams({}, { replace: true });
                  setCategory("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead className="bg-slate-50/70">
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Supplier</th>
                  <th className="th">On hand</th>
                  <th className="th">Cost / Price</th>
                  <th className="th">Status</th>
                  <th className="th">Updated</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((product) => {
                  const status = productStatus(product);
                  const ratio = Math.min(100, (product.quantity / Math.max(product.reorderLevel * 3, 1)) * 100);
                  return (
                    <tr key={product.id} className="group transition hover:bg-slate-50/70">
                      <td className="td">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400">
                            {product.sku} · {product.category}
                          </p>
                        </div>
                      </td>
                      <td className="td text-slate-600">{supplierName(product.supplierId)}</td>
                      <td className="td">
                        <div className="w-28">
                          <p className="font-medium text-slate-900">
                            {formatNumber(product.quantity)}{" "}
                            <span className="text-xs font-normal text-slate-400">{product.unit}</span>
                          </p>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                status === STOCK_STATUS.out
                                  ? "bg-rose-500"
                                  : status === STOCK_STATUS.low
                                    ? "bg-amber-400"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.max(ratio, 3)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <p className="text-slate-900">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(product.cost)} cost</p>
                      </td>
                      <td className="td">
                        <Badge tone={statusTone(status)} dot>
                          {status}
                        </Badge>
                      </td>
                      <td className="td text-xs whitespace-nowrap text-slate-500">
                        {relativeTime(product.updatedAt)}
                      </td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(product);
                              setFormOpenState(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label={`Edit ${product.name}`}
                            title="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdjustTarget(product.id)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                            aria-label={`Adjust stock for ${product.name}`}
                            title="Record movement"
                          >
                            <ArrowLeftRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            aria-label={`Delete ${product.name}`}
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-700">
              {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-slate-700">{filtered.length}</span> products
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-xs font-medium text-slate-600">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {formOpen && (
        <ProductFormModal
          onClose={closeForm}
          product={editing}
          products={products}
          suppliers={suppliers}
          onSubmit={submitProduct}
        />
      )}

      {adjustTarget && (
        <StockAdjustModal
          onClose={() => setAdjustTarget(null)}
          products={products}
          defaultProductId={adjustTarget}
          onSubmit={submitMovement}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteProduct(deleteTarget.id);
          toast({
            title: "Product deleted",
            description: `${deleteTarget.sku} and its movement history were removed`,
            tone: "warning",
          });
          setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.name ?? "product"}?`}
        description="Its stock movement history will also be removed from this demo."
        confirmLabel="Delete product"
      />
    </div>
  );
}
