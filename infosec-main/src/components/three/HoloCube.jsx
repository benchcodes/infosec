import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import useReducedMotion from "./useReducedMotion";

const SIZE = 208;
const HALF = SIZE / 2;

const TONES = {
  brand: "from-emerald-700 via-emerald-800 to-teal-900",
  sky: "from-sky-800 via-sky-900 to-slate-900",
  amber: "from-amber-700 via-amber-800 to-amber-950",
  violet: "from-violet-800 via-violet-900 to-indigo-950",
  rose: "from-rose-800 via-rose-900 to-rose-950",
  slate: "from-slate-700 via-slate-800 to-slate-950",
};

// Faces are laid out front, right, back, left, top, bottom.
function transformFor(index) {
  switch (index) {
    case 0:
      return `translateZ(${HALF}px)`;
    case 1:
      return `rotateY(90deg) translateZ(${HALF}px)`;
    case 2:
      return `rotateY(180deg) translateZ(${HALF}px)`;
    case 3:
      return `rotateY(-90deg) translateZ(${HALF}px)`;
    case 4:
      return `rotateX(90deg) translateZ(${HALF}px)`;
    case 5:
      return `rotateX(-90deg) translateZ(${HALF}px)`;
    default:
      return "";
  }
}

const controlClass =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-800 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100";

export default function HoloCube({ faces = [], onSelect, caption = "Drag to rotate · click a face" }) {
  const cubeRef = useRef(null);
  const rotation = useRef({ x: -18, y: 28 });
  const drag = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0, moved: 0 });
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();

  const apply = useCallback(() => {
    const el = cubeRef.current;
    if (!el) return;
    el.style.transform = `rotateX(${rotation.current.x.toFixed(2)}deg) rotateY(${rotation.current.y.toFixed(2)}deg)`;
  }, []);

  useEffect(() => {
    apply();
  }, [apply]);

  useEffect(() => {
    if (reduced || paused) return undefined;

    let frame = 0;
    let last = performance.now();

    const tick = (now) => {
      const delta = Math.min(64, now - last) / 1000;
      last = now;

      if (!drag.current.active) {
        rotation.current.y = (rotation.current.y + 8 * delta) % 360;
        apply();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [apply, paused, reduced]);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: rotation.current.x,
      baseY: rotation.current.y,
      moved: 0,
    };
    try {
      event.target.setPointerCapture?.(event.pointerId);
    } catch {
      /* pointer capture is best-effort */
    }
    setPaused(true);
  };

  const handlePointerMove = (event) => {
    const state = drag.current;
    if (!state.active) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    state.moved = Math.max(state.moved, Math.abs(dx) + Math.abs(dy));

    rotation.current.x = Math.max(-70, Math.min(70, state.baseX - dy * 0.35));
    rotation.current.y = state.baseY + dx * 0.45;
    apply();
  };

  const handlePointerUp = () => {
    drag.current.active = false;
  };

  const reset = () => {
    rotation.current = { x: -18, y: 28 };
    apply();
  };

  const handleFace = (face) => {
    // A drag that ends on a face should not also open it. Reset so a later
    // click or Enter press (which sends no pointermove) still works.
    if (drag.current.moved > 8) {
      drag.current.moved = 0;
      return;
    }
    onSelect?.(face);
  };

  return (
    <div className="relative flex flex-col items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-44 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-700/20 blur-3xl"
      />

      <div
        role="group"
        aria-label="Rotating inventory command cube"
        className="scene-3d relative flex h-[318px] w-full touch-pan-y items-center justify-center"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="scene-floor" aria-hidden />

        <div ref={cubeRef} className="preserve-3d relative" style={{ width: SIZE, height: SIZE }}>
          {faces.map((face, index) => {
            const Icon = face.icon;
            return (
              <button
                key={face.key ?? face.title ?? index}
                type="button"
                onClick={() => handleFace(face)}
                aria-label={`${face.title}: ${face.value}. Open.`}
                className={`backface-hidden absolute inset-0 flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-5 text-left text-white shadow-2xl ring-1 ring-white/25 outline-none transition hover:ring-white/60 focus-visible:ring-2 focus-visible:ring-white ${
                  TONES[face.tone] ?? TONES.brand
                }`}
                style={{ transform: transformFor(index) }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-8 h-24 w-24 rounded-full bg-white/20 blur-2xl"
                />
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.18em] uppercase opacity-80">
                    {face.title}
                  </span>
                  {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-80" /> : null}
                </div>

                <div>
                  <p className="text-[26px] leading-none font-semibold tracking-tight">{face.value}</p>
                  <p className="mt-1.5 text-[11px] leading-snug opacity-80">{face.hint}</p>
                </div>

                <span className="text-[10px] font-medium opacity-70">Open workspace →</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className={controlClass}
          aria-label={paused ? "Resume cube rotation" : "Pause cube rotation"}
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {paused ? "Resume spin" : "Pause spin"}
        </button>
        <button type="button" onClick={reset} className={controlClass} aria-label="Reset cube view">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        <span className="text-[11px] text-slate-400">{caption}</span>
      </div>
    </div>
  );
}
