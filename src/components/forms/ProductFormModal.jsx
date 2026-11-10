import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const EMPTY = {
  name: "",
  sku: "",
  category: "",
  supplierId: "",
  unit: "unit",
  cost: "",
  price: "",
  quantity: "",
  reorderLevel: "",
  location: "",
};

const UNITS = ["unit", "pc", "box", "set", "pack", "roll", "can", "gal", "pair", "tube"];

export default function ProductFormModal({ onClose, product, products, suppliers, onSubmit }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          supplierId: product.supplierId,
          unit: product.unit,
          cost: String(product.cost),
          price: String(product.price),
          quantity: String(product.quantity),
          reorderLevel: String(product.reorderLevel),
          location: product.location ?? "",
        }
      : { ...EMPTY, supplierId: suppliers[0]?.id ?? "" },
  );
  const [errors, setErrors] = useState({});

  const categories = [...new Set(products.map((item) => item.category))].sort();

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = "Product name is required.";
    if (!form.sku.trim()) next.sku = "SKU is required.";
    else if (
      products.some(
        (item) => item.sku.toLowerCase() === form.sku.trim().toLowerCase() && item.id !== product?.id,
      )
    ) {
      next.sku = "That SKU already exists.";
    }
    if (!form.category.trim()) next.category = "Category is required.";
    if (form.cost === "" || Number(form.cost) < 0) next.cost = "Enter a valid cost.";
    if (form.price === "" || Number(form.price) < 0) next.price = "Enter a valid price.";
    if (Number(form.price) < Number(form.cost)) next.price = "Price should not be below cost.";
    if (form.quantity === "" || Number(form.quantity) < 0) next.quantity = "Enter a valid quantity.";
    if (form.reorderLevel === "" || Number(form.reorderLevel) < 0) {
      next.reorderLevel = "Enter a reorder point.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      category: form.category.trim(),
      supplierId: form.supplierId,
      unit: form.unit,
      cost: Number(form.cost),
      price: Number(form.price),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel),
      location: form.location.trim() || "Unassigned",
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? "Edit product" : "Add product"}
      description={
        product ? "Update the details for this inventory item." : "Create a new item in your catalog."
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="product-form">
            {product ? "Save changes" : "Create product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="product-name">
            Product name
          </label>
          <input
            id="product-name"
            data-autofocus
            className={`field ${errors.name ? "field-error" : ""}`}
            value={form.name}
            onChange={update("name")}
            placeholder="e.g. Cordless Drill 18V"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-sku">
            SKU
          </label>
          <input
            id="product-sku"
            className={`field uppercase ${errors.sku ? "field-error" : ""}`}
            value={form.sku}
            onChange={update("sku")}
            placeholder="PT-1006"
          />
          {errors.sku && <p className="mt-1 text-xs text-rose-600">{errors.sku}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-category">
            Category
          </label>
          <input
            id="product-category"
            list="category-options"
            className={`field ${errors.category ? "field-error" : ""}`}
            value={form.category}
            onChange={update("category")}
            placeholder="Power Tools"
          />
          <datalist id="category-options">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-supplier">
            Supplier
          </label>
          <select
            id="product-supplier"
            className="field"
            value={form.supplierId}
            onChange={update("supplierId")}
          >
            <option value="">Unassigned</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="product-unit">
              Unit
            </label>
            <select id="product-unit" className="field" value={form.unit} onChange={update("unit")}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="product-location">
              Shelf
            </label>
            <input
              id="product-location"
              className="field"
              value={form.location}
              onChange={update("location")}
              placeholder="A1-08"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="product-cost">
            Unit cost (₱)
          </label>
          <input
            id="product-cost"
            type="number"
            min="0"
            step="0.01"
            className={`field ${errors.cost ? "field-error" : ""}`}
            value={form.cost}
            onChange={update("cost")}
            placeholder="0.00"
          />
          {errors.cost && <p className="mt-1 text-xs text-rose-600">{errors.cost}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-price">
            Selling price (₱)
          </label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            className={`field ${errors.price ? "field-error" : ""}`}
            value={form.price}
            onChange={update("price")}
            placeholder="0.00"
          />
          {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-quantity">
            Quantity on hand
          </label>
          <input
            id="product-quantity"
            type="number"
            min="0"
            step="1"
            className={`field ${errors.quantity ? "field-error" : ""}`}
            value={form.quantity}
            onChange={update("quantity")}
            placeholder="0"
          />
          {errors.quantity && <p className="mt-1 text-xs text-rose-600">{errors.quantity}</p>}
        </div>

        <div>
          <label className="label" htmlFor="product-reorder">
            Reorder point
          </label>
          <input
            id="product-reorder"
            type="number"
            min="0"
            step="1"
            className={`field ${errors.reorderLevel ? "field-error" : ""}`}
            value={form.reorderLevel}
            onChange={update("reorderLevel")}
            placeholder="10"
          />
          {errors.reorderLevel && <p className="mt-1 text-xs text-rose-600">{errors.reorderLevel}</p>}
        </div>
      </form>
    </Modal>
  );
}
