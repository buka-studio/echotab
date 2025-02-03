import { useAnimationFrame } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";

import ShieldInner from "~/../public/echotab/bento/shield-inner.svg";
import ShieldOutline from "~/../public/echotab/bento/shield-outline.svg";
import Shield from "~/../public/echotab/bento/shield.svg";
import DownloadIcon from "~/../public/echotab/download.svg";

import BentoCard from "./BentoCard";

import "./PrivacyCard.css";

export default function PrivacyCard({ className }: { className?: string }) {
  const [hovering, setHovering] = useState(false);

  return (
    <BentoCard
      onMouseEnter={() => {
        setHovering(true);
      }}
      onMouseLeave={() => {
        setHovering(false);
      }}
      className={className}
      illustration={
        <div className="shield-container group relative h-full w-full">
          <CanvasSwitchboard animating={hovering} />
          <ShieldOutline className="shield-outline absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]" />
          <Shield className="shield absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]" />
          <ShieldInner className="shield-inner absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] opacity-0" />
        </div>
      }>
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-mono text-sm uppercase">
          <DownloadIcon /> Data Privacy
        </h3>
        <p className="text-balance text-left text-neutral-400">
          Your data is stored exclusively on your browser and is not shared with anyone.
        </p>
      </div>
    </BentoCard>
  );
}

class Dot {
  private step = 0;

  constructor(
    private x: number,
    private y: number,
    private size: number,
    private ctx: CanvasRenderingContext2D,
  ) {}

  draw() {
    this.drawDefaultState();
  }

  setStep(step: number) {
    this.step = step;
  }

  get playing() {
    return this.step !== 0;
  }

  private clear() {
    this.ctx.clearRect(this.x - 20, this.y - 20, this.size + 40, this.size + 40);
  }

  private drawDefaultState() {
    this.ctx.save();
    this.clear();
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    this.ctx.fillStyle = "#707070";
    this.ctx.fill();
    this.ctx.restore();
  }

  play() {
    this.ctx.save();
    this.ctx.beginPath();
    this.clear();

    if (this.step === 0) {
      this.ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#707070";
    } else if (this.step === 1) {
      this.ctx.arc(this.x, this.y, this.size + 1, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#ec4d20";
    } else if (this.step === 2) {
      this.ctx.shadowColor = "#ec4d20";
      this.ctx.shadowBlur = 5;
      this.ctx.arc(this.x, this.y, this.size + 2, 0, 2 * Math.PI);
      this.ctx.fillStyle = "#ec4d20";
    } else if (this.step === 3) {
      this.ctx.shadowColor = "#ec4d20";
      this.ctx.shadowBlur = 10;
      this.ctx.arc(this.x, this.y, this.size + 1, 1, 2 * Math.PI);
      this.ctx.fillStyle = "#ffffff";
    }

    this.ctx.fill();
    this.ctx.restore();

    this.step++;
    this.step = this.step % 4;
  }

  stop() {
    this.drawDefaultState();
  }
}

const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

interface SwitchboardProps {
  cols?: number;
  rows?: number;
  width?: number;
  height?: number;
  dotSize?: number;
  animating: boolean;
}

const CanvasSwitchboard = ({
  animating,
  cols = 30,
  rows = 20,
  width = 1800,
  height = 800,
  dotSize = 2,
}: SwitchboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const playingDots = useRef<number[]>([]);

  useLayoutEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const dots = Array.from({ length: cols * rows }).map((_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = (width / cols) * col + dotSize;
      const y = (height / rows) * row + dotSize;

      return new Dot(x, y, dotSize, canvasRef.current!.getContext("2d")!);
    });
    for (const d of dots) {
      d.draw();
    }
    dotsRef.current = dots;
  }, [width, height, cols, rows, dotSize]);

  const prevTimestamp = useRef(0);

  useAnimationFrame((timestamp) => {
    if (timestamp - prevTimestamp.current < 1000 / 5) {
      return;
    }

    prevTimestamp.current = timestamp;
    if (!animating) {
      playingDots.current.forEach((i) => {
        dotsRef.current[i].stop();
      });
    } else {
      if (playingDots.current.length) {
        playingDots.current.forEach((i) => {
          dotsRef.current[i].play();
        });
      } else {
        const playing = Array.from({ length: cols * rows })
          .map((_, i) => (Math.random() > 0.8 ? i : null))
          .filter(Boolean) as number[];
        playingDots.current = playing;
        playing.forEach((i) => {
          dotsRef.current[i].setStep(getRandomNumber(0, 3));
          dotsRef.current[i].play();
        });
      }
    }
  });

  return <canvas ref={canvasRef} className="switchboard-canvas" />;
};
