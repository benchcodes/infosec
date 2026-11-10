import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useData();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: "maria.santos@ctinassl.ph", password: "demo1234" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSession({
      name: "Maria Santos",
      email: form.email,
      role: "Administrator",
    });
    toast({ title: "Welcome back", description: "Signed in as Maria Santos · Administrator" });
    navigate("/");
  };

  return (
    <div className="grid min-h-svh bg-slate-100 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-700/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div>
            <p className="text-[15px] font-semibold tracking-tight">CulubongAbad</p>
            <p className="text-[11px] tracking-wide text-slate-400">CTINASSL</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight">
            Every unit accounted for.
            <span className="block text-brand-300">Every change on record.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            A small-business inventory workspace with role-based access, reorder alerts, and an
            audit trail that shows exactly who moved what.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            {[
              "Real-time stock levels and reorder points",
              "Role-based permissions for every action",
              "Immutable, attributed movement history",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-slate-500">
          Demo environment — no real company data.
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold tracking-tight text-slate-900">CulubongAbad</p>
            <p className="text-[11px] text-slate-500">CTINASSL</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use the demo credentials below to explore the workspace.
          </p>

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

            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Keep me signed in
              </label>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: "Password reset",
                    description: "In production, a reset link would be emailed to you.",
                    tone: "info",
                  })
                }
                className="font-medium text-brand-700 hover:text-brand-800"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-900/20 transition hover:bg-brand-700"
            >
              Sign in
            </button>
          </form>

          <div className="mt-5 rounded-xl bg-slate-200/60 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-300/50">
            <p className="font-medium text-slate-700">Demo account</p>
            <p className="mt-0.5">
              maria.santos@ctinassl.ph · <span className="font-mono">demo1234</span>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            <Link to="/" className="font-medium text-slate-600 hover:text-brand-700">
              Skip sign-in and browse the demo
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
