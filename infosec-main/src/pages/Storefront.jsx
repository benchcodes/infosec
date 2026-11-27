import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpDown,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ProductOrbit from "../components/three/ProductOrbit";
import Tilt3D from "../components/three/Tilt3D";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatCurrency, formatNumber } from "../lib/format";
import { productStatus, statusTone } from "../lib/metrics";
import { toneFor } from "../lib/palette";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

function readSavedCart(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { cart: {}, note: "" };
    const parsed = JSON.parse(raw);
    return {
      cart: parsed?.cart && typeof parsed.cart === "object" ? parsed.cart : {},
      note: typeof parsed?.note === "string" ? parsed.note : "",
    };
  } catch {
    return { cart: {}, note: "" };
  }
}

export default function Storefront() {
  const navigate = useNavigate();
  const { products, placeOrder, session } = useData();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const cartKey = `silogexpress.cart.v1:${session?.email ?? "guest"}`;
  const saved = useMemo(() => readSavedCart(cartKey), [cartKey]);

  const [term, setTerm] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [cart, setCart] = useState(saved.cart);
  const [note, setNote] = useState(saved.note);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(cartKey, JSON.stringify({ cart, note }));
    } catch {
      /* storage blocked — the cart still works for this visit */
    }
  }, [cartKey, cart, note]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    let list = products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesTerm =
        !needle ||
        [product.name, product.sku, product.category].some((value) =>
          String(value).toLowerCase().includes(needle),
        );
      return matchesCategory && matchesTerm;
    });

    if (inStockOnly) list = list.filter((product) => product.quantity > 0);
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, term, category, sort, inStockOnly]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([productId, quantity]) => {
          const product = products.find((item) => item.id === productId);
          if (!product || product.quantity <= 0) return null;
          return {
            product,
            quantity: Math.max(1, Math.min(Number(quantity) || 0, product.quantity)),
          };
        })
        .filter(Boolean),
    [cart, products],
  );

  const total = cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const itemCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);

  const addToCart = (product) => {
    setCart((current) => {
      const next = Math.min(product.quantity, (current[product.id] ?? 0) + 1);
      return { ...current, [product.id]: next };
    });
  };

  const changeQuantity = (product, quantity) => {
    setCart((current) => {
      const next = { ...current };
      const value = Math.max(0, Math.min(product.quantity, quantity));
      if (value === 0) delete next[product.id];
      else next[product.id] = value;
      return next;
    });
  };

  const removeLine = (productId) => {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const submit = () => {
    if (cartLines.length === 0) return;
    setPlacing(true);
    try {
      const order = placeOrder({
        items: cartLines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        note,
      });
      toast({
        title: "Order placed",
        description: `${order.code} · ${formatCurrency(order.total)}`,
        tone: "success",
      });
      setCart({});
      setNote("");
      navigate("/my-orders");
    } catch (error) {
      toast({ title: "Could not place the order", description: error.message, tone: "error" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-0">
      <PageHeader
        title="Silog Express Menu"
        description="Choose your favorite silog meal, add sides or drinks, and place your order."
        actions={
          <Badge tone="sky" dot>
            {formatNumber(products.filter((product) => product.quantity > 0).length)} items available
          </Badge>
        }
      />

      <ProductOrbit
        products={products}
        cart={cart}
        onAdd={addToCart}
        onBrowse={(category) => {
          setTerm("");
          setCategory(category);
          document
            .getElementById("menu-catalog")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section id="menu-catalog" className="scroll-mt-24 space-y-4">
          <div className="card p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={term}
                onChange={(event) => {
                  setTerm(event.target.value);
                  const next = new URLSearchParams(params);
                  if (event.target.value) next.set("q", event.target.value);
                  else next.delete("q");
                  setParams(next, { replace: true });
                }}
                placeholder="Search by name, SKU, or category"
                aria-label="Search items"
                className="field pl-9"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {categories.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
                  className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                    category === option
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {option}
                </button>
              ))}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInStockOnly((current) => !current)}
                  aria-pressed={inStockOnly}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition ${
                    inStockOnly
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  In stock only
                </button>
                <div className="relative">
                  <ArrowUpDown className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort items"
                    className="field h-9 w-auto py-0 pr-8 pl-8 text-[13px]"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Package}
                title="No items match your search"
                description="Try a different keyword or pick another category."
                action={
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setTerm("");
                      setCategory("All");
                      setInStockOnly(false);
                      setSort("featured");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => {
                const status = productStatus(product);
                const out = product.quantity <= 0;
                const inCart = cart[product.id] ?? 0;
                return (
                  <Tilt3D
                    as="article"
                    key={product.id}
                    intensity={5}
                    className="card flex flex-col overflow-hidden"
                  >
                    <div
                      className={`flex h-28 items-center justify-between bg-gradient-to-br px-4 text-white ${toneFor(
                        product.category,
                      )}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium tracking-wide uppercase opacity-80">
                          {product.category}
                        </p>
                        <p className="mt-1 line-clamp-2 text-[15px] leading-snug font-semibold">
                          {product.name}
                        </p>
                      </div>
                      <Package className="h-8 w-8 shrink-0 opacity-70" />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatCurrency(product.price)}
                          </p>
                          <p className="text-[11px] text-slate-400">per {product.unit}</p>
                        </div>
                        <Badge tone={statusTone(status)} dot>
                          {status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span>SKU {product.sku}</span>
                        <span>
                          {product.quantity} {product.unit} on hand
                        </span>
                      </div>
                      {product.quantity > 0 && product.quantity <= product.reorderLevel && (
                        <p className="text-[11px] font-medium text-amber-600">
                          Only {product.quantity} {product.unit} left
                        </p>
                      )}

                      <div className="mt-auto flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={out ? "secondary" : "primary"}
                          disabled={out}
                          onClick={() => addToCart(product)}
                          className="flex-1"
                        >
                          <Plus className="h-4 w-4" />
                          {out ? "Out of stock" : "Add to order"}
                        </Button>
                        {inCart > 0 && (
                          <span className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200">
                            {inCart} in order
                          </span>
                        )}
                      </div>
                    </div>
                  </Tilt3D>
                );
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div id="your-order" className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-900">Your order</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            </div>

            {cartLines.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="Your order is empty"
                description="Add an item from the catalog to start an order."
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {cartLines.map(({ product, quantity }) => (
                    <li key={product.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">
                            {product.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {formatCurrency(product.price)} per {product.unit}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(product.id)}
                          className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-lg bg-slate-100">
                          <button
                            type="button"
                            onClick={() => changeQuantity(product, quantity - 1)}
                            className="rounded-l-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                            aria-label={`Decrease ${product.name}`}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-[13px] font-semibold text-slate-800">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQuantity(product, quantity + 1)}
                            disabled={quantity >= product.quantity}
                            className="rounded-r-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40"
                            aria-label={`Increase ${product.name}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {formatCurrency(product.price * quantity)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 px-4 py-3">
                  <label className="label" htmlFor="order-note">
                    Note for the staff (optional)
                  </label>
                  <textarea
                    id="order-note"
                    rows={2}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Delivery instructions, pickup time…"
                    className="field resize-none"
                  />
                </div>

                <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <Button
                    className="mt-3 w-full"
                    onClick={submit}
                    disabled={placing || cartLines.length === 0}
                  >
                    {placing ? "Placing order…" : "Place order"}
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Stock is reserved as soon as the order is placed.
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {cartLines.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div>
              <p className="text-[11px] text-slate-500">
                {itemCount} item{itemCount === 1 ? "" : "s"} in your order
              </p>
              <p className="text-sm font-semibold text-slate-900">{formatCurrency(total)}</p>
            </div>
            <Button
              size="sm"
              onClick={() =>
                document.getElementById("your-order")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Review order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
