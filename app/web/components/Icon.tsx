import { CSSProperties } from "react";

/** أيقونة Material Symbols. fill=true للنسخة المملوءة. */
export default function Icon({
  name, size = 24, fill = false, className = "", style = {},
}: { name: string; size?: number; fill?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0", ...style }}
    >
      {name}
    </span>
  );
}
