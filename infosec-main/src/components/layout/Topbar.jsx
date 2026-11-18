import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";
import { PAGE_TITLES } from "../../lib/nav";
import { useData } from "../../lib/data-context";
import { formatDate, initials } from "../../lib/format";

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { session, products, orders } = useData();
  const [query, setQuery] = useState("");
  const [openMenu, setOpenMenu] = useState(null);

  const title = PAGE_TITLES[pathname] ?? "CulubongAbad";
  const lowStock = products.filter((product) => product.quantity <= product.reorderLevel);
  const pendingOrders = orders.filter((order) => order.status === "Sent" || order.status === "Draft");
  const alerts = lowStock.length + pendingOrders.length;

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/products?q=${encodeURIComponent(value)}` : "/products");
    setQuery("");
    setOpenMenu(null);
  };

  const toggle = (menu) => setOpenMenu((current) => (current === menu ? null : menu));

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">{title}</p>
          <p className="hidden text-[11px] text-slate-400 sm:block">
            {formatDate(new Date(), { weekday: "long" })}
          </p>
        </div>

        <form onSubmit={submitSearch} className="ml-auto hidden w-full max-w-xs md:block" role="search">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, SKU…"
              aria-label="Search products"
              className="h-10 w-full rounded-xl bg-slate-100/80 pr-3 pl-9 text-sm text-slate-800 ring-1 ring-transparent transition placeholder:text-slate-400 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button
            type="button"
            onClick={() => toggle("alerts")}
            className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label={`Notifications (${alerts})`}
            aria-expanded={openMenu === "alerts"}
          >
            <Bell className="h-5 w-5" />
            {alerts > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                {alerts > 9 ? "9+" : alerts}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => toggle("profile")}
            className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-slate-100"
            aria-expanded={openMenu === "profile"}
            aria-label="Account menu"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-[11px] font-semibold text-ink-900">
              {initials(session.name)}
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
        </div>
      </div>

      {openMenu && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default"
          onClick={() => setOpenMenu(null)}
          aria-label="Close menu"
          tabIndex={-1}
        />
      )}

      {openMenu === "alerts" && (
        <div className="animate-rise absolute top-16 right-4 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {alerts} open
            </span>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {lowStock.slice(0, 3).map((product) => (
              <li key={product.id}>
                <Link
                  to="/products?filter=low"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-800">
                      {product.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {product.quantity} {product.unit} left · reorder at {product.reorderLevel}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {pendingOrders.slice(0, 2).map((order) => (
              <li key={order.id}>
                <Link
                  to="/orders"
                  onClick={() => setOpenMenu(null)}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-slate-800">
                      {order.code} is {order.status.toLowerCase()}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {order.items.length} line items · expected {formatDate(order.expectedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {alerts === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-500">You are all caught up.</li>
            )}
          </ul>
        </div>
      )}

      {openMenu === "profile" && (
        <div className="animate-rise absolute top-16 right-4 z-40 w-64 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{session.name}</p>
            <p className="truncate text-xs text-slate-500">{session.email}</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 ring-1 ring-brand-200">
              {session.role}
            </span>
          </div>
          <div className="p-1.5">
            <Link
              to="/settings"
              onClick={() => setOpenMenu(null)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Account settings
            </Link>
            <Link
              to="/users"
              onClick={() => setOpenMenu(null)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Users &amp; roles
            </Link>
            <Link
              to="/login"
              onClick={() => setOpenMenu(null)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
            >
              Sign out
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
