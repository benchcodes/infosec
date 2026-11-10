export default function Donut({ segments = [], centerLabel = "Total", centerValue, size = 168 }) {
  const radius = 54;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  const arcs = segments.map((segment, index) => {
    const length = (segment.value / total) * circumference;
    const offset = segments
      .slice(0, index)
      .reduce((sum, item) => sum + (item.value / total) * circumference, 0);
    return { ...segment, length, offset };
  });

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {arcs.map((arc) => {
            const dash = `${Math.max(arc.length - 3, 0)} ${circumference}`;
            return (
              <circle
                key={arc.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={dash}
                strokeDashoffset={-arc.offset}
              >
                <title>{`${arc.label}: ${arc.value}`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tracking-tight text-slate-900">{centerValue ?? total}</span>
          <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
              {segment.label}
            </span>
            <span className="font-medium text-slate-900">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
