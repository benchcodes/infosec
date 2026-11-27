import { useRef } from "react";
import useReducedMotion from "./useReducedMotion";

// Wraps any surface in a pointer-tracked 3D tilt with a soft brand glare.
export default function Tilt3D({
  as: Tag = "div",
  className = "",
  intensity = 7,
  glare = true,
  children,
  ...rest
}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  const handleMove = (event) => {
    const el = ref.current;
    if (!el || reduced || event.pointerType === "touch") return;

    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - py) * intensity * 2;
    const rotateY = (px - 0.5) * intensity * 2;

    el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    el.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
  };

  const handleLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <Tag
      ref={ref}
      className={`tilt-layer ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {children}
      {glare && <span aria-hidden className="tilt-glare" />}
    </Tag>
  );
}
