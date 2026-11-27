import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import ProductFormModal from "./forms/ProductFormModal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import ConfirmDialog from "./ui/ConfirmDialog";
import { useData } from "../lib/data-context";
import { useToast } from "./ui/toast-context";
import { formatCurrency, formatNumber } from "../lib/format";
import { productStatus, statusTone } from "../lib/metrics";

const PREVIEW_ROWS = 6;

// Admin shortcut for the menu. It writes through the shared store, so the
// customer shop and the employee carousel pick the change up on their own.
export default function MenuManager() {
  const { products, suppliers, addProduct, updateProduct, deleteProduct } = useData();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const sorted = [...products].sort(
      (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );
    if (!term) return sorted;
    return sorted.filter((product) =>
      [product.name, product.category, product.sku].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [products, query]);

  // Keep the dashboard compact: show a short list until the admin asks for all.
  const shown = expanded ? visible : visible.slice(0, PREVIEW_ROWS);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const submit = (data) => {
    if (editing) {
      updateProduct(editing.id, data);
      toast({
        title: "Menu updated",
        description: `${data.name} now sells for ${formatCurrency(data.price)}.`,
      });
    } else {
      addProduct(data);
      toast({
        title: "Meal added",
        description: `${data.name} is live on the customer menu.`,
      });
    }
    setEditing(null);
  };

  // One tap to stop or resume selling without opening the full form. The
  // previous stock is kept in pausedQuantity so switching back restores it.
  const toggleAvailability = (product) => {
    if (product.quantity > 0) {
      updateProduct(product.id, { pausedQuantity: product.quantity, quantity: 0 });
      toast({
        title: "Marked unavailable",
        description: `${product.name} is out of stock on the customer menu.`,
      });
      return;
    }

    const restore = product.pausedQuantity > 0 ? product.pausedQuantity : Math.max(product.reorderLevel, 1);
    updateProduct(product.id, { quantity: restore, pausedQuantity: 0 });
    toast({
      title: "Back on the menu",
      description: `${product.name} is selling again with ${formatNumber(restore)} ${product.unit}.`,
    });
  };

  return (
    <section id="menu-manager" className="card scroll-mt-24 overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-slate-900">Menu manager</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Add, edit, or remove a meal here. Customers and staff see the change within seconds, no
            reload needed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a meal"
              aria-label="Search menu items"
              className="field h-9 w-44 pl-8 text-[13px]"
            />
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add meal
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-slate-50/70">
            <tr>
              <th className="th">Meal</th>
              <th className="th">Category</th>
              <th className="th">Price</th>
              <th className="th">Available</th>
              <th className="th">Status</th>
              <th className="th">Selling</th>
              <th className="th text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 ? (
              <tr>
                <td className="td text-slate-500" colSpan={7}>
                  No meal matches “{query}”.
                </td>
              </tr>
            ) : (
              shown.map((product) => {
                const status = productStatus(product);
                return (
                  <tr key={product.id} className="transition hover:bg-slate-50/70">
                    <td className="td">
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.sku}</p>
                    </td>
                    <td className="td text-slate-600">{product.category}</td>
                    <td className="td font-medium text-slate-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="td whitespace-nowrap text-slate-600">
                      {formatNumber(product.quantity)}{" "}
                      <span className="text-xs text-slate-500">{product.unit}</span>
                    </td>
                    <td className="td">
                      <Badge tone={statusTone(status)} dot>
                        {status}
                      </Badge>
                    </td>
                    <td className="td">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.quantity > 0}
                        aria-label={`${product.quantity > 0 ? "Stop selling" : "Start selling"} ${product.name}`}
                        title={product.quantity > 0 ? "Stop selling" : "Start selling"}
                        onClick={() => toggleAvailability(product)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${
                          product.quantity > 0
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${
                            product.quantity > 0 ? "translate-x-[18px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="td">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label={`Edit ${product.name}`}
                          title="Edit meal"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>
          Showing {shown.length} of {products.length} meals
        </span>
        <div className="flex items-center gap-3">
          {visible.length > PREVIEW_ROWS && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              {expanded ? "Show fewer" : `Show all ${visible.length}`}
            </button>
          )}
          <Link
            to="/products"
            className="inline-flex items-center gap-1 font-medium text-brand-700 hover:text-brand-800"
          >
            Open full catalog <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {formOpen && (
        <ProductFormModal
          product={editing}
          products={products}
          suppliers={suppliers}
          onClose={closeForm}
          onSubmit={submit}
        />
      )}
    </section>
  );
}
