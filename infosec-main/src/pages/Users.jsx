import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useData } from "../lib/data-context";
import { useToast } from "../components/ui/toast-context";
import { initials, relativeTime } from "../lib/format";

const ROLES = ["Administrator", "Manager", "Staff", "Auditor"];

const ROLE_INFO = {
  Administrator: "Full access, including user management and audit logs.",
  Manager: "Runs purchasing, suppliers, and catalog changes.",
  Staff: "Records stock movements and handles counter sales.",
  Auditor: "Read-only access to inventory records and the audit trail.",
};

const PERMISSIONS = [
  { capability: "View dashboard and reports", roles: ["Administrator", "Manager", "Staff", "Auditor"] },
  { capability: "Create and edit products", roles: ["Administrator", "Manager"] },
  { capability: "Record stock movements", roles: ["Administrator", "Manager", "Staff"] },
  { capability: "Manage purchase orders", roles: ["Administrator", "Manager"] },
  { capability: "Manage suppliers", roles: ["Administrator", "Manager"] },
  { capability: "Delete inventory records", roles: ["Administrator"] },
  { capability: "View audit trail", roles: ["Administrator", "Auditor"] },
  { capability: "Manage users and roles", roles: ["Administrator"] },
];

function InviteModal({ onClose, onInvite }) {
  const [form, setForm] = useState({ name: "", email: "", role: "Staff" });
  const [errors, setErrors] = useState({});

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onInvite({ ...form, name: form.name.trim(), email: form.email.trim() });
    setForm({ name: "", email: "", role: "Staff" });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Invite a user"
      description="They will receive an email invitation with a temporary password."
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form">
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="invite-name">
            Full name
          </label>
          <input
            id="invite-name"
            data-autofocus
            className={`field ${errors.name ? "field-error" : ""}`}
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Juan Dela Cruz"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="invite-email">
            Work email
          </label>
          <input
            id="invite-email"
            type="email"
            className={`field ${errors.email ? "field-error" : ""}`}
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="name@ctinassl.ph"
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="invite-role">
            Role
          </label>
          <select
            id="invite-role"
            className="field"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500">{ROLE_INFO[form.role]}</p>
        </div>
      </form>
    </Modal>
  );
}

export default function Users() {
  const { users, addUser, updateUser, deleteUser, session } = useData();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const roleCounts = useMemo(() => {
    const map = { Administrator: 0, Manager: 0, Staff: 0, Auditor: 0 };
    users.forEach((user) => {
      map[user.role] = (map[user.role] ?? 0) + 1;
    });
    return map;
  }, [users]);

  const invite = (payload) => {
    addUser({ ...payload, status: "Active", mfa: false, lastActive: new Date().toISOString() });
    toast({ title: "Invitation sent", description: `${payload.email} · ${payload.role}` });
  };

  const toggleStatus = (user) => {
    const status = user.status === "Active" ? "Suspended" : "Active";
    updateUser(user.id, { status });
    toast({
      title: status === "Active" ? "Account reactivated" : "Account suspended",
      description: `${user.name} is now ${status.toLowerCase()}`,
      tone: status === "Active" ? "success" : "warning",
    });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & roles"
        description="Role-based access control for everyone who touches inventory."
        actions={
          <Button onClick={() => setInviteOpen(true)}>Invite user</Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => (
          <div key={role} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-600">{role}</p>
              <Badge tone={role === "Administrator" ? "violet" : role === "Auditor" ? "sky" : "slate"}>
                {roleCounts[role]}
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">{ROLE_INFO[role]}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Permission matrix</h2>
            <p className="text-xs text-slate-500">What each role is allowed to do</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-t border-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th">Capability</th>
                {ROLES.map((role) => (
                  <th key={role} className="th text-center">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSIONS.map((row) => (
                <tr key={row.capability} className="hover:bg-slate-50/60">
                  <td className="td font-medium text-slate-700">{row.capability}</td>
                  {ROLES.map((role) => (
                    <td key={role} className="td text-center">
                      {row.roles.includes(role) ? (
                        <span className="text-[13px] font-medium text-emerald-600">Yes</span>
                      ) : (
                        <span className="text-[13px] text-slate-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Team accounts</h2>
            <p className="text-xs text-slate-500">{users.length} accounts · MFA recommended for admins</p>
          </div>
          <Badge tone="emerald" dot>
            {users.filter((user) => user.mfa).length} with MFA
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-t border-slate-100">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="th">User</th>
                <th className="th">Role</th>
                <th className="th">MFA</th>
                <th className="th">Last active</th>
                <th className="th">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-50/70">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[11px] font-semibold text-slate-600">
                        {initials(user.name)}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.name}
                          {user.email === session.email && (
                            <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <select
                      value={user.role}
                      onChange={(event) => {
                        updateUser(user.id, { role: event.target.value });
                        toast({
                          title: "Role updated",
                          description: `${user.name} is now ${event.target.value}`,
                        });
                      }}
                      className="field h-9 w-auto py-0 pr-8 text-[13px]"
                      aria-label={`Role for ${user.name}`}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="td">
                    <span
                      className={`text-[13px] ${
                        user.mfa ? "text-emerald-600" : "text-slate-400"
                      }`}
                    >
                      {user.mfa ? "Enabled" : "Off"}
                    </span>
                  </td>
                  <td className="td text-xs whitespace-nowrap text-slate-500">
                    {relativeTime(user.lastActive)}
                  </td>
                  <td className="td">
                    <Badge tone={user.status === "Active" ? "emerald" : "rose"} dot>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleStatus(user)}
                        disabled={user.email === session.email}
                      >
                        {user.status === "Active" ? "Suspend" : "Activate"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(user)}
                        disabled={user.email === session.email}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                        aria-label={`Remove ${user.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onInvite={invite} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteUser(deleteTarget.id);
          toast({
            title: "User removed",
            description: `${deleteTarget.name} no longer has access`,
            tone: "warning",
          });
          setDeleteTarget(null);
        }}
        title={`Remove ${deleteTarget?.name ?? "user"}?`}
        description="Their access is revoked immediately. Movement history stays intact."
        confirmLabel="Remove user"
      />
    </div>
  );
}
