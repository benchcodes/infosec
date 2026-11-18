import { Link, NavLink } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { NAV_GROUPS } from "../../lib/nav";
import { useData } from "../../lib/data-context";
import { initials } from "../../lib/format";

export default function Sidebar({ open, onClose }) {
  const { session, products, orders } = useData();

  const lowStockCount = products.filter((product) => product.quantity <= product.reorderLevel).length;
  const pendingOrders = orders.filter((order) => order.status === "Sent" || order.status === "Draft").length;

  const counts = {
    "/products": lowStockCount,
    "/orders": pendingOrders,
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col overflow-y-auto bg-ink-900 text-slate-300 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Primary navigation"
      >
        <div className="pointer-events-none absolute -top-24 -left-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />

        <div className="relative flex items-center justify-between px-5 pt-6 pb-5">
          <Link to="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-white">
                CulubongAbad
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-slate-400">
                CTINASSL
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-6 px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const count = counts[item.to];
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={`h-4.5 w-4.5 shrink-0 transition ${
                                isActive ? "text-brand-300" : "text-slate-500 group-hover:text-slate-300"
                              }`}
                            />
                            <span className="flex-1 truncate">{item.label}</span>
                            {count > 0 && (
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                  isActive
                                    ? "bg-brand-400/20 text-brand-200"
                                    : "bg-white/10 text-slate-300"
                                }`}
                              >
                                {count}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="relative px-3 pb-3">
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-[13px] font-medium text-slate-200">
              Audit trail active
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Every stock change is attributed to a user and timestamped.
            </p>
          </div>
        </div>

        <div className="relative border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-300 to-brand-600 text-xs font-semibold text-ink-900">
              {initials(session.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{session.name}</p>
              <p className="truncate text-[11px] text-slate-400">{session.role}</p>
            </div>
            <Link
              to="/login"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
