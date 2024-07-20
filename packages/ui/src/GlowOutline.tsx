import { CSSProperties } from "react";

import "./GlowOutline.css";

import { cn } from "./util";

export default function GlowOutline({
  speed = 1,
  width = 1,
  radius = 8,
  className,
}: {
  speed?: number;
  width?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("glow", className)}
      style={
        {
          "--speed": speed,
          "--width": width,
          "--radius": radius,
        } as CSSProperties
      }
    />
  );
}
