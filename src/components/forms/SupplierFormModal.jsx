import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

const EMPTY = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  city: "",
  leadTime: "3",
  status: "Active",
};

export default function SupplierFormModal({ onClose, supplier, onSubmit }) {
  const [form, setForm] = useState(() =>
    supplier
      ? {
          name: supplier.name,
          contact: supplier.contact,
          email: supplier.email,
          phone: supplier.phone,
          city: supplier.city,
          leadTime: String(supplier.leadTime),
          status: supplier.status,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState({});

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Supplier name is required.";
    if (!form.contact.trim()) next.contact = "Contact person is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.phone.trim()) next.phone = "Phone number is required.";
    if (Number(form.leadTime) < 0) next.leadTime = "Lead time must be zero or more.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      ...form,
      name: form.name.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || "—",
      leadTime: Number(form.leadTime),
      rating: supplier?.rating ?? 4,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Edit supplier" : "Add supplier"}
      description="Keep contact and lead-time details up to date for reordering."
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="supplier-form">
            {supplier ? "Save changes" : "Create supplier"}
          </Button>
        </>
      }
    >
      <form id="supplier-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="supplier-name">
            Company name
          </label>
          <input
            id="supplier-name"
            data-autofocus
            className={`field ${errors.name ? "field-error" : ""}`}
            value={form.name}
            onChange={update("name")}
            placeholder="Prime Builders Supply"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="supplier-contact">
            Contact person
          </label>
          <input
            id="supplier-contact"
            className={`field ${errors.contact ? "field-error" : ""}`}
            value={form.contact}
            onChange={update("contact")}
            placeholder="Alma Reyes"
          />
          {errors.contact && <p className="mt-1 text-xs text-rose-600">{errors.contact}</p>}
        </div>

        <div>
          <label className="label" htmlFor="supplier-city">
            City
          </label>
          <input
            id="supplier-city"
            className="field"
            value={form.city}
            onChange={update("city")}
            placeholder="Quezon City"
          />
        </div>

        <div>
          <label className="label" htmlFor="supplier-email">
            Email
          </label>
          <input
            id="supplier-email"
            type="email"
            className={`field ${errors.email ? "field-error" : ""}`}
            value={form.email}
            onChange={update("email")}
            placeholder="orders@supplier.ph"
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="supplier-phone">
            Phone
          </label>
          <input
            id="supplier-phone"
            className={`field ${errors.phone ? "field-error" : ""}`}
            value={form.phone}
            onChange={update("phone")}
            placeholder="+63 917 000 0000"
          />
          {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="label" htmlFor="supplier-lead">
            Lead time (days)
          </label>
          <input
            id="supplier-lead"
            type="number"
            min="0"
            className={`field ${errors.leadTime ? "field-error" : ""}`}
            value={form.leadTime}
            onChange={update("leadTime")}
          />
          {errors.leadTime && <p className="mt-1 text-xs text-rose-600">{errors.leadTime}</p>}
        </div>

        <div>
          <label className="label" htmlFor="supplier-status">
            Status
          </label>
          <select
            id="supplier-status"
            className="field"
            value={form.status}
            onChange={update("status")}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}
