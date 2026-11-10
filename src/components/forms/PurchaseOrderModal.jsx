import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { formatCurrency } from "../../lib/format";

function defaultDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const emptyLine = () => ({ productId: "", quantity: "1", unitCost: "" });

export default function PurchaseOrderModal({ onClose, suppliers, products, onSubmit }) {
  const [supplierId, setSupplierId] = useState(() => suppliers[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState(() => defaultDate());
  const [items, setItems] = useState(() => [emptyLine()]);
  const [errors, setErrors] = useState({});

  const updateLine = (index, patch) => {
    setItems((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    );
  };

  const chooseProduct = (index, productId) => {
    const product = products.find((item) => item.id === productId);
    updateLine(index, {
      productId,
      unitCost: product ? String(product.cost) : "",
    });
  };

  const total = useMemo(
    () =>
      items.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitCost) || 0), 0),
    [items],
  );

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!supplierId) next.supplier = "Choose a supplier.";
    if (!expectedAt) next.expectedAt = "Choose an expected delivery date.";

    const validLines = items.filter((line) => line.productId && Number(line.quantity) > 0);
    if (validLines.length === 0) next.items = "Add at least one product with a quantity.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      supplierId,
      status: "Draft",
      expectedAt: new Date(`${expectedAt}T09:00:00`).toISOString(),
      items: validLines.map((line) => ({
        productId: line.productId,
        quantity: Number(line.quantity),
        unitCost: Number(line.unitCost) || 0,
      })),
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="New purchase order"
      description="Draft an order, then mark it as sent or received."
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="po-form">
            Create draft
          </Button>
        </>
      }
    >
      <form id="po-form" onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="po-supplier">
              Supplier
            </label>
            <select
              id="po-supplier"
              data-autofocus
              className={`field ${errors.supplier ? "field-error" : ""}`}
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">Select supplier…</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplier && <p className="mt-1 text-xs text-rose-600">{errors.supplier}</p>}
          </div>

          <div>
            <label className="label" htmlFor="po-expected">
              Expected delivery
            </label>
            <input
              id="po-expected"
              type="date"
              className={`field ${errors.expectedAt ? "field-error" : ""}`}
              value={expectedAt}
              onChange={(event) => setExpectedAt(event.target.value)}
            />
            {errors.expectedAt && <p className="mt-1 text-xs text-rose-600">{errors.expectedAt}</p>}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label mb-0">Line items</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setItems((current) => [...current, emptyLine()])}
            >
              <Plus className="h-3.5 w-3.5" /> Add line
            </Button>
          </div>

          <div className="space-y-2">
            {items.map((line, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <select
                  className="field col-span-6 py-2 text-[13px]"
                  value={line.productId}
                  onChange={(event) => chooseProduct(index, event.target.value)}
                  aria-label={`Product for line ${index + 1}`}
                >
                  <option value="">Select product…</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} — {product.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  className="field col-span-2 py-2 text-[13px]"
                  value={line.quantity}
                  onChange={(event) => updateLine(index, { quantity: event.target.value })}
                  aria-label={`Quantity for line ${index + 1}`}
                  placeholder="Qty"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="field col-span-3 py-2 text-[13px]"
                  value={line.unitCost}
                  onChange={(event) => updateLine(index, { unitCost: event.target.value })}
                  aria-label={`Unit cost for line ${index + 1}`}
                  placeholder="Unit cost"
                />

                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  disabled={items.length === 1}
                  className="col-span-1 justify-self-end rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                  aria-label={`Remove line ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.items && <p className="mt-1.5 text-xs text-rose-600">{errors.items}</p>}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
          <span className="text-sm text-slate-500">Order total</span>
          <span className="text-lg font-semibold text-slate-900">{formatCurrency(total)}</span>
        </div>
      </form>
    </Modal>
  );
}
