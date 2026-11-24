import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, ShoppingBag, UserRound } from "lucide-react";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../lib/auth";
import { ROLE_INFO, ROLES } from "../lib/roles";

const ROLE_CARDS = [
  {
    role: ROLES.USER,
    icon: ShoppingBag,
    blurb: "Browse the menu and place a meal order.",
    account: DEMO_ACCOUNTS.find((account) => account.role === ROLES.USER),
  },
  {
    role: ROLES.EMPLOYEE,
    icon: UserRound,
    blurb: "Manage meals and monitor stock counts.",
    account: DEMO_ACCOUNTS.find((account) => account.role === ROLES.EMPLOYEE),
  },
  {
    role: ROLES.ADMIN,
    icon: ShieldCheck,
    blurb: "Full access to every page.",
    account: DEMO_ACCOUNTS.find((account) => account.role === ROLES.ADMIN),
  },
];

export default function Login() {
  const navigate = useNavigate();
  const { session, signIn } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({
    email: DEMO_ACCOUNTS[0].email,
    password: DEMO_PASSWORD,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (session) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const user = await signIn(form.email, form.password);
      toast({ title: "Welcome back", description: `Signed in as ${user.name} · ${user.role}` });
      navigate("/", { replace: true });
    } catch (error) {
      setErrors({ password: error.message ?? "Could not sign in." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-svh bg-slate-100 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-700/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight">Silog Express</p>
            <p className="text-[11px] tracking-wide text-slate-400">Meal Ordering System</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Silog meals made simple.
            <span className="block text-brand-300">Order, prepare, and serve.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Customers browse the silog menu and place orders. Employees manage meals and stock
            counts. Admins see every order and report.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Customers order from the live meal menu",
              "Employees prepare meals and monitor stock",
              "Admins manage users, suppliers, and sales reports",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-slate-500">Demo environment — no real company data.</div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold tracking-tight text-slate-900">Silog Express</p>
            <p className="text-[11px] text-slate-500">Meal Ordering System</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick a role to fill in its demo account, or type your own credentials.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              const active = form.email === card.account.email;
              return (
                <button
                  key={card.role}
                  type="button"
                  onClick={() => {
                    setForm({ email: card.account.email, password: DEMO_PASSWORD });
                    setErrors({});
                  }}
                  aria-pressed={active}
                  className={`rounded-xl p-3 text-left ring-1 transition ${
                    active
                      ? "bg-brand-50 ring-brand-300"
                      : "bg-white ring-slate-200 hover:bg-slate-50 hover:ring-slate-300"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-brand-600" : "text-slate-400"}`} />
                  <p className="mt-2 text-[13px] font-semibold text-slate-800">{card.role}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{card.blurb}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                className={`field bg-white ${errors.email ? "field-error" : ""}`}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`field bg-white pr-11 ${errors.password ? "field-error" : ""}`}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-200/60 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-300/50">
            <p className="font-medium text-slate-700">Demo accounts · password {DEMO_PASSWORD}</p>
            <ul className="mt-1 space-y-0.5">
              {ROLE_CARDS.map((card) => (
                <li key={card.role} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px]">{card.account.email}</span>
                  <span className="text-slate-500">{card.role}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">
              {ROLE_INFO[ROLES.ADMIN]}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
