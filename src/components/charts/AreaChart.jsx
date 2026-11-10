import { useId } from "react";

const WIDTH = 640;
const HEIGHT = 240;
const PADDING = { top: 16, right: 12, bottom: 28, left: 34 };

export default function AreaChart({ data = [], height = 260 }) {
  const inboundGradient = useId();
  const outboundGradient = useId();

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const max = Math.max(1, ...data.map((item) => Math.max(item.inbound, item.outbound)));
  const roundedMax = Math.ceil(max / 20) * 20 || 20;
  const step = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;

  const toPoint = (value, index) => {
    const x = PADDING.left + index * step;
    const y = PADDING.top + plotHeight - (value / roundedMax) * plotHeight;
    return [x, y];
  };

  const buildPath = (key) =>
    data
      .map((item, index) => {
        const [x, y] = toPoint(item[key], index);
        return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  const buildArea = (key) => {
    const line = buildPath(key);
    const lastX = PADDING.left + (data.length - 1) * step;
    return `${line} L${lastX} ${PADDING.top + plotHeight} L${PADDING.left} ${PADDING.top + plotHeight} Z`;
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-500" /> Stock in
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Stock out
        </span>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        style={{ height }}
        className="w-full"
        role="img"
        aria-label="Stock movement over the last seven days"
      >
        <defs>
          <linearGradient id={inboundGradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={outboundGradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = PADDING.top + plotHeight - tick * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={tick === 0 ? undefined : "3 4"}
                vectorEffect="non-scaling-stroke"
              />
              <text x={PADDING.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(roundedMax * tick)}
              </text>
            </g>
          );
        })}

        <path d={buildArea("outbound")} fill={`url(#${outboundGradient})`} />
        <path d={buildArea("inbound")} fill={`url(#${inboundGradient})`} />

        <path
          d={buildPath("outbound")}
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={buildPath("inbound")}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {data.map((item, index) => {
          const [x] = toPoint(0, index);
          return (
            <text
              key={item.label + index}
              x={x}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
              {item.label}
            </text>
          );
        })}

        {data.map((item, index) => {
          const [x, y] = toPoint(item.inbound, index);
          return (
            <g key={`point-${item.label}-${index}`}>
              <circle cx={x} cy={y} r="8" fill="transparent">
                <title>{`${item.label}: ${item.inbound} in / ${item.outbound} out`}</title>
              </circle>
              <circle cx={x} cy={y} r="2.5" fill="#10b981" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
