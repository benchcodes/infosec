import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { formatCurrency } from "../../lib/format";

const TYPES = [
  { value: "in", label: "Stock in", icon: ArrowDownLeft, hint: "Delivery received from a supplier" },
  { value: "out", label: "Stock out", icon: ArrowUpRight, hint: "Released to a customer or project" },
  { value: "adjust", label: "Adjustment", icon: SlidersHorizontal, hint: "Correct a count or write off damage" },
];

export default function StockAdjustModal({
  onClose,
  products,
  defaultProductId,
  onSubmit,
}) {
  const [productId, setProductId] = useState(() => defaultProductId ?? products[0]?.id ?? "");
  const [type, setType] = useState("in");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [products, productId],
  );

  const amount = Number(quantity) || 0;
  const delta = type === "out" ? -Math.abs(amount) : amount;
  const resulting = Math.max(0, (product?.quantity ?? 0) + delta);

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!productId) next.product = "Choose a product.";
    if (!Number.isFinite(amount) || amount === 0) next.quantity = "Enter a non-zero quantity.";
    if (type !== "adjust" && amount < 0) next.quantity = "Use a positive number for this movement.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({ productId, type, quantity: amount, note });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Record stock movement"
      description="Every movement is attributed to you in the audit trail."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="movement-form">
            Save movement
          </Button>
        </>
      }
    >
      <form id="movement-form" onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="movement-product">
            Product
          </label>
          <select
            id="movement-product"
            data-autofocus
            className={`field ${errors.product ? "field-error" : ""}`}
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sku} — {item.name}
              </option>
            ))}
          </select>
          {errors.product && <p className="mt-1 text-xs text-rose-600">{errors.product}</p>}
        </div>

        <div>
          <span className="label">Movement type</span>
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map((option) => {
              const Icon = option.icon;
              const active = type === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  aria-pressed={active}
                  className={`flex flex-col items-start gap-1 rounded-xl p-3 text-left ring-1 transition ${
                    active
                      ? "bg-brand-50 ring-2 ring-brand-500"
                      : "bg-white ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex items-center gap-1.5 text-[13px] font-medium ${
                      active ? "text-brand-800" : "text-slate-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {option.label}
                  </span>
                  <span className="text-[11px] leading-snug text-slate-500">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="movement-quantity">
              {type === "adjust" ? "Quantity change (+/−)" : "Quantity"}
            </label>
            <input
              id="movement-quantity"
              type="number"
              step="1"
              className={`field ${errors.quantity ? "field-error" : ""}`}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>}
          </div>

          <div>
            <label className="label" htmlFor="movement-note">
              Reference / note
            </label>
            <input
              id="movement-note"
              className="field"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. PO-2026-019, Job order #4821"
            />
          </div>
        </div>

        {product && (
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">On hand</span>
              <span className="font-medium text-slate-900">
                {product.quantity} {product.unit}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-slate-500">After this movement</span>
              <span
                className={`font-semibold ${
                  resulting === 0 ? "text-rose-600" : resulting <= product.reorderLevel ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {resulting} {product.unit}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>Stock value change</span>
              <span>{formatCurrency(Math.abs(delta) * product.cost)}</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
