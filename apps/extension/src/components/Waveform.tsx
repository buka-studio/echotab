import { cn } from "@echotab/ui/util";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { CSSProperties, forwardRef, useEffect } from "react";

interface BarProps {
  minHeight?: number;
  maxHeight?: number;
  playing?: boolean;
  width?: number;
  className?: string;
  style?: CSSProperties;
  speed?: number;
}

const Bar = forwardRef<HTMLDivElement, BarProps>(
  (
    { maxHeight = 18, playing, minHeight = 3, className, width = 2, style, speed = 150, ...props },
    ref,
  ) => {
    const height = useMotionValue(minHeight);
    const spring = useSpring(height, { stiffness: 100, damping: 10 });

    useEffect(() => {
      if (playing) {
        const interval = setInterval(() => {
          height.set(Math.floor(Math.random() * maxHeight) + minHeight);
        }, speed);

        return () => clearInterval(interval);
      } else {
        spring.set(minHeight);
      }
    }, [maxHeight, playing, speed]);

    return (
      <motion.div
        ref={ref}
        className={cn("bg-primary rounded-full transition-colors", className, {
          "bg-muted-foreground": !playing,
        })}
        style={{ height: spring, width, ...style }}
        {...props}
      />
    );
  },
);

interface WaveformProps extends BarProps {
  bars: number;
  gap?: number;
}

export function Waveform({
  bars,
  playing,
  maxHeight = 16,
  width = 2,
  gap = 1,
  style,
  ...props
}: WaveformProps) {
  const maxWidth = bars * width + (bars - 1) * gap;

  return (
    <div className="relative flex items-center" style={{ width: maxWidth, height: maxHeight }}>
      {Array.from({ length: bars }).map((_, index) => {
        const offset = index * (width + gap);
        return (
          <Bar
            key={index}
            maxHeight={maxHeight}
            playing={playing}
            width={width}
            className="absolute left-[calc(var(--offset)*1px)] top-1/2 translate-y-[-50%]"
            style={
              {
                "--offset": offset,
                ...style,
              } as CSSProperties
            }
            {...props}
          />
        );
      })}
    </div>
  );
}
