const tones = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/80",
  rose: "bg-rose-50 text-rose-700 ring-rose-200/80",
  slate: "bg-slate-100 text-slate-600 ring-slate-200/80",
  sky: "bg-sky-50 text-sky-700 ring-sky-200/80",
  violet: "bg-violet-50 text-violet-700 ring-violet-200/80",
};

const dots = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-slate-400",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};

export default function Badge({ tone = "slate", dot = false, children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${tones[tone] ?? tones.slate} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[tone] ?? dots.slate}`} />}
      {children}
    </span>
  );
}
