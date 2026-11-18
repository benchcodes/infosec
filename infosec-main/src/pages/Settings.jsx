import { useState } from "react";
import { RefreshCcw } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { formatDateTime, initials } from "../lib/format";

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const { session, setSession, resetData, movements } = useData();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: session.name, email: session.email });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [mfa, setMfa] = useState(true);
  const [alerts, setAlerts] = useState({ lowStock: true, orders: true, weekly: false });
  const [resetOpen, setResetOpen] = useState(false);

  const saveProfile = (event) => {
    event.preventDefault();
    const next = {};
    if (!profile.name.trim()) next.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) next.email = "Enter a valid email.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSession({ ...session, name: profile.name.trim(), email: profile.email.trim() });
    toast({ title: "Profile saved", description: "Your account details were updated" });
  };

  const savePassword = (event) => {
    event.preventDefault();
    const next = {};
    if (!passwords.current) next.current = "Enter your current password.";
    if (passwords.next.length < 8) next.next = "Use at least 8 characters.";
    if (passwords.next !== passwords.confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPasswords({ current: "", next: "", confirm: "" });
    toast({
      title: "Password changed",
      description: "Other sessions would be signed out in a live environment",
    });
  };

  const lastMovement = movements[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and workspace preferences."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <section className="card p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Profile</h2>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-300 to-brand-600 text-lg font-semibold text-ink-900">
                {initials(profile.name)}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{profile.name || "Unnamed user"}</p>
                <p className="text-xs text-slate-500">{session.role} · CTINASSL</p>
                <Badge tone="emerald" className="mt-1.5">
                  Verified account
                </Badge>
              </div>
            </div>

            <form onSubmit={saveProfile} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
              <div>
                <label className="label" htmlFor="profile-name">
                  Full name
                </label>
                <input
                  id="profile-name"
                  className={`field ${errors.name ? "field-error" : ""}`}
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="profile-email">
                  Email
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className={`field ${errors.email ? "field-error" : ""}`}
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                />
                {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save profile</Button>
              </div>
            </form>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Password</h2>
            </div>

            <form onSubmit={savePassword} className="mt-4 grid gap-4 sm:grid-cols-3" noValidate>
              <div>
                <label className="label" htmlFor="pw-current">
                  Current password
                </label>
                <input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  className={`field ${errors.current ? "field-error" : ""}`}
                  value={passwords.current}
                  onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
                />
                {errors.current && <p className="mt-1 text-xs text-rose-600">{errors.current}</p>}
              </div>
              <div>
                <label className="label" htmlFor="pw-next">
                  New password
                </label>
                <input
                  id="pw-next"
                  type="password"
                  autoComplete="new-password"
                  className={`field ${errors.next ? "field-error" : ""}`}
                  value={passwords.next}
                  onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
                />
                {errors.next && <p className="mt-1 text-xs text-rose-600">{errors.next}</p>}
              </div>
              <div>
                <label className="label" htmlFor="pw-confirm">
                  Confirm new password
                </label>
                <input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  className={`field ${errors.confirm ? "field-error" : ""}`}
                  value={passwords.confirm}
                  onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                />
                {errors.confirm && <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>}
              </div>
              <div className="sm:col-span-3">
                <Button type="submit">Update password</Button>
              </div>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Notifications</h2>
            <p className="text-xs text-slate-500">Choose what lands in your inbox.</p>

            <div className="mt-2 divide-y divide-slate-100">
              <Toggle
                label="Low stock alerts"
                description="Email me when an item hits its reorder point."
                checked={alerts.lowStock}
                onChange={(value) => setAlerts({ ...alerts, lowStock: value })}
              />
              <Toggle
                label="Purchase order updates"
                description="Notify me when an order is sent, received, or cancelled."
                checked={alerts.orders}
                onChange={(value) => setAlerts({ ...alerts, orders: value })}
              />
              <Toggle
                label="Weekly summary"
                description="A Monday digest of stock movement and valuation."
                checked={alerts.weekly}
                onChange={(value) => setAlerts({ ...alerts, weekly: value })}
              />
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="card p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-slate-900">Security</h2>
            </div>

            <div className="mt-3">
              <Toggle
                label="Two-factor authentication"
                description="Require a 6-digit code from your authenticator app."
                checked={mfa}
                onChange={(value) => {
                  setMfa(value);
                  toast({
                    title: value ? "MFA enabled" : "MFA disabled",
                    description: value
                      ? "Authenticator app required at next sign-in"
                      : "Your account is less protected",
                    tone: value ? "success" : "warning",
                  });
                }}
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <p className="text-[13px] font-medium text-slate-700">Active sessions</p>
              <ul className="mt-2 space-y-2 text-xs">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Windows · Chrome</span>
                  <span className="text-emerald-600">This device</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Android · CulubongAbad app</span>
                  <span className="text-slate-400">{formatDateTime(lastMovement?.at)}</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-semibold text-slate-900">Workspace</h2>
            <dl className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Currency</dt>
                <dd className="font-medium text-slate-900">PHP (₱)</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Timezone</dt>
                <dd className="font-medium text-slate-900">Asia/Manila</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Default reorder point</dt>
                <dd className="font-medium text-slate-900">10 units</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Audit retention</dt>
                <dd className="font-medium text-slate-900">12 months</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-rose-50/60 p-5 ring-1 ring-rose-200/70">
            <h2 className="text-[15px] font-semibold text-rose-900">Danger zone</h2>
            <p className="mt-1 text-xs leading-relaxed text-rose-700/80">
              Reset the demo workspace back to its seeded products, suppliers, and movements.
            </p>
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setResetOpen(true)}>
              <RefreshCcw className="h-3.5 w-3.5" /> Reset demo data
            </Button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetData();
          toast({
            title: "Workspace reset",
            description: "All demo records were restored to their original state",
            tone: "warning",
          });
        }}
        title="Reset demo data?"
        description="Every change you made in this session will be discarded."
        confirmLabel="Reset workspace"
      />
    </div>
  );
}
