import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import SupplierFormModal from "../components/forms/SupplierFormModal";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { initials } from "../lib/format";

export default function Suppliers() {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier } = useData();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const skuCount = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      map.set(product.supplierId, (map.get(product.supplierId) ?? 0) + 1);
    });
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      if (status !== "all" && supplier.status !== status) return false;
      if (!needle) return true;
      return [supplier.name, supplier.contact, supplier.city, supplier.email]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [suppliers, query, status]);

  const submitSupplier = (data) => {
    if (editing) {
      updateSupplier(editing.id, data);
      toast({ title: "Supplier updated", description: data.name });
    } else {
      addSupplier(data);
      toast({ title: "Supplier added", description: data.name });
    }
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Suppliers"
        description="Your approved vendors, contacts, and delivery lead times."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add supplier
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search suppliers…"
            aria-label="Search suppliers"
            className="field pl-9"
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { value: "all", label: "All" },
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                status === option.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-slate-500 sm:ml-auto">
          {filtered.length} of {suppliers.length} suppliers
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No suppliers found"
            description="Try a different search, or add a new vendor."
            action={
              <Button size="sm" onClick={() => setFormOpen(true)}>
                Add supplier
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((supplier) => (
            <article key={supplier.id} className="card flex min-w-0 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-600">
                    {initials(supplier.name)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-[15px] font-semibold text-slate-900">{supplier.name}</h2>
                    <p className="text-xs text-slate-400">{supplier.city}</p>
                  </div>
                </div>
                <Badge tone={supplier.status === "Active" ? "emerald" : "slate"} dot>
                  {supplier.status}
                </Badge>
              </div>

              <dl className="mt-4 min-w-0 space-y-2 text-[13px]">
                <div className="text-slate-600">{supplier.contact}</div>
                <div className="min-w-0 text-slate-600">
                  <a href={`mailto:${supplier.email}`} className="block min-w-0 truncate hover:text-brand-700">
                    {supplier.email}
                  </a>
                </div>
                <div className="text-slate-600">{supplier.phone}</div>
              </dl>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">Lead</p>
                  <p className="text-sm font-semibold text-slate-900">{supplier.leadTime}d</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">SKUs</p>
                  <p className="text-sm font-semibold text-slate-900">{skuCount.get(supplier.id) ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">Rating</p>
                  <p className="text-sm font-semibold text-slate-900">{supplier.rating.toFixed(1)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(supplier);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(supplier)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${supplier.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <SupplierFormModal
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          supplier={editing}
          onSubmit={submitSupplier}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteSupplier(deleteTarget.id);
          toast({
            title: "Supplier removed",
            description: `${deleteTarget.name} was deleted`,
            tone: "warning",
          });
          setDeleteTarget(null);
        }}
        title={`Delete ${deleteTarget?.name ?? "supplier"}?`}
        description="Products linked to this supplier will show as unassigned."
        confirmLabel="Delete supplier"
      />
    </div>
  );
}
