import { cloneElement, isValidElement, useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import useReducedMotion from "./useReducedMotion";

const controlClass =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-800 dark:ring-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100";

const SMALL_QUERY = "(max-width: 639px)";

// Shrinks the ring on phones so the side cards are still reachable.
function useNarrowRing() {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(SMALL_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(SMALL_QUERY);
    const update = (event) => setNarrow(event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return narrow;
}

// Lays out cards on a rotating 3D ring. Drag to spin, click a card to select,
// or use the arrow keys. Selecting a card rotates it round to the front.
export default function Cylinder3D({
  items = [],
  renderItem,
  radius = 220,
  itemWidth = 178,
  itemHeight = 152,
  speed = 9,
  selectedIndex = 0,
  onSelect,
  label = "3D carousel",
}) {
  const ringRef = useRef(null);
  const angle = useRef(0);
  const drag = useRef({ active: false, startX: 0, base: 0, moved: 0 });
  const snapFrame = useRef(0);
  const snapping = useRef(false);
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const narrow = useNarrowRing();

  // Keep the full 3D radius on small screens. Pulling the ring inward makes
  // neighbouring cards overlap into a jumbled stack, which looks broken. Side
  // cards may clip at the edges instead, and the selected card still rotates
  // to the front where it stays fully visible.
  const cardWidth = narrow ? Math.min(itemWidth, 144) : itemWidth;
  const cardHeight = narrow ? Math.min(itemHeight, 150) : itemHeight;

  const ringRadius = (() => {
    // Neighbouring cards sit on a chord that grows with the radius. Enforce a
    // minimum so card edges keep a small gap even when a category or meal is
    // added, instead of piling into each other near the front.
    const chordFactor = items.length > 1 ? 2 * Math.sin(Math.PI / items.length) : 2;
    return Math.max(radius, Math.round((cardWidth + 12) / chordFactor));
  })();
  const stageHeight = cardHeight + (narrow ? 112 : 104);

  const step = items.length ? 360 / items.length : 360;

  const apply = useCallback(() => {
    if (ringRef.current) {
      ringRef.current.style.transform = `rotateY(${angle.current.toFixed(2)}deg)`;
    }
  }, []);

  useEffect(() => {
    apply();
  }, [apply]);

  useEffect(() => {
    if (reduced || paused || items.length < 2) return undefined;

    let frame = 0;
    let last = performance.now();

    const tick = (now) => {
      const delta = Math.min(64, now - last) / 1000;
      last = now;

      // Let an in-flight snap own the ring while it settles.
      if (!drag.current.active && !snapping.current) {
        angle.current = (angle.current + speed * delta) % 360;
        apply();
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [apply, items.length, paused, reduced, speed]);

  // Swing the selected card round to the front, taking the shortest way.
  useEffect(() => {
    if (!items.length) return undefined;

    const index = Math.min(Math.max(selectedIndex, 0), items.length - 1);
    const target = -index * step;
    const delta = ((target - angle.current + 540) % 360) - 180;

    if (Math.abs(delta) < 0.5) return undefined;

    if (reduced) {
      angle.current = target;
      apply();
      return undefined;
    }

    const from = angle.current;
    const to = from + delta;
    const start = performance.now();
    snapping.current = true;

    const animate = (now) => {
      const progress = Math.min(1, (now - start) / 520);
      const eased = 1 - Math.pow(1 - progress, 3);
      angle.current = from + delta * eased;
      apply();

      if (progress < 1) {
        snapFrame.current = requestAnimationFrame(animate);
      } else {
        angle.current = ((to % 360) + 360) % 360;
        snapping.current = false;
        apply();
      }
    };

    snapFrame.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(snapFrame.current);
      snapping.current = false;
    };
  }, [apply, items.length, reduced, selectedIndex, step]);

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { active: true, startX: event.clientX, base: angle.current, moved: 0 };
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
    state.moved = Math.max(state.moved, Math.abs(dx));
    angle.current = state.base + dx * 0.34;
    apply();
  };

  const handlePointerUp = () => {
    drag.current.active = false;
  };

  // A drag that ends on a card should not also select that card.
  const handleClickCapture = (event) => {
    if (drag.current.moved > 8) {
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = 0;
    }
  };

  const focusCard = (index) => {
    const buttons = ringRef.current?.querySelectorAll("button");
    buttons?.[index]?.focus();
  };

  const handleKeyDown = (event) => {
    if (!items.length) return;

    const current = Math.min(Math.max(selectedIndex, 0), items.length - 1);
    let next = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (current + 1) % items.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = (current - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = items.length - 1;
    }

    if (next === null) return;

    event.preventDefault();
    setPaused(true);
    onSelect?.(next);

    // Keep focus on the card the keyboard just moved to.
    window.requestAnimationFrame(() => focusCard(next));
  };

  return (
    <div className="relative" role="group" aria-label={label} onKeyDown={handleKeyDown}>
      <div
        className="scene-3d relative flex touch-pan-y items-center justify-center overflow-hidden"
        style={{ height: stageHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-3 left-1/2 h-10 w-2/3 -translate-x-1/2 rounded-full bg-brand-700/15 blur-2xl"
        />

        <div
          ref={ringRef}
          className="preserve-3d relative"
          style={{ width: cardWidth, height: cardHeight }}
        >
          {items.map((item, index) => {
            const active = index === selectedIndex;
            const content = renderItem(item, index, active, () => onSelect?.(index));

            return (
              <div
                key={item.key ?? item.id ?? index}
                className="backface-hidden absolute top-1/2 left-1/2"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  marginLeft: -cardWidth / 2,
                  marginTop: -cardHeight / 2,
                  transform: `rotateY(${index * step}deg) translateZ(${ringRadius}px)`,
                }}
              >
                {isValidElement(content)
                  ? cloneElement(content, {
                      tabIndex: active ? 0 : -1,
                      "aria-current": active ? "true" : undefined,
                    })
                  : content}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className={controlClass}
          aria-label={paused ? "Resume carousel rotation" : "Pause carousel rotation"}
        >
          {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          {paused ? "Resume spin" : "Pause spin"}
        </button>
        <span className="text-[11px] text-slate-400">Drag, tap, or use arrow keys</span>
      </div>
    </div>
  );
}
