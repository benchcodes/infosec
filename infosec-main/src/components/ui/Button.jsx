const variants = {
  primary:
    "bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:ring-slate-300",
  subtle: "bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-rose-600 text-white shadow-sm shadow-rose-900/20 hover:bg-rose-700",
};

const sizes = {
  sm: "h-9 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  icon: "h-9 w-9 justify-center",
};

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag
      className={`inline-flex items-center rounded-xl font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
