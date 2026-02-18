"use client";

import { cn } from "@echotab/ui/util";
import { ScreenQuad, shaderMaterial } from "@react-three/drei";
import { Canvas, CanvasProps, extend, ThreeElement, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";

import fragmentShaderSource from "./Warp.frag";
import vertexShaderSource from "./Warp.vert";

// copied from https://github.com/buka-studio/www-marijanapav, not all options are needed, cleanup later
export interface GenieTarget {
  id: string;
  texture: THREE.Texture;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  progress: number;
  opacity?: number;
  easing?: number;
  warpRange?: { left: number; right: number };
  motionBlur?: number;
  isReversed?: boolean;
  side?: "top" | "bottom";
}

type ImageSource = HTMLImageElement | HTMLCanvasElement | OffscreenCanvas | ImageBitmap;

declare module "@react-three/fiber" {
  interface ThreeElements {
    warpMaterial: ThreeElement<typeof WarpMaterial>;
  }
}

const WarpMaterial = shaderMaterial(
  {
    uProgress: 0,
    uRangeLeft: 0.475,
    uRangeRight: 0.525,
    uMotionBlur: 0.01,
    uEasingFunction: 1,
    uIsReversed: false,
    uTexture: null as THREE.Texture | null,
    uSide: 0,
    uImagePos: new THREE.Vector2(0, 0),
    uImageSize: new THREE.Vector2(1, 1),
    uOpacity: 1,
  },
  vertexShaderSource,
  fragmentShaderSource,
);

extend({ WarpMaterial });

type WarpMatImpl = THREE.ShaderMaterial & {
  uniforms: {
    uProgress: { value: number };
    uRangeLeft: { value: number };
    uRangeRight: { value: number };
    uMotionBlur: { value: number };
    uEasingFunction: { value: number };
    uIsReversed: { value: number };
    uTexture: { value: THREE.Texture | null };
    uSide: { value: number };
    uImagePos: { value: THREE.Vector2 };
    uImageSize: { value: THREE.Vector2 };
    uOpacity: { value: number };
  };
};

export function imageToTexture(image: ImageSource) {
  const texture = (image as HTMLCanvasElement).getContext
    ? new THREE.CanvasTexture(image as HTMLCanvasElement)
    : new THREE.Texture(image as HTMLImageElement);
  texture.flipY = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}

function WarpQuad({ target, renderOrder }: { target: GenieTarget; renderOrder: number }) {
  const matRef = useRef<WarpMatImpl>(null!);

  const {
    texture,
    position,
    dimensions,
    easing = 1,
    warpRange,
    motionBlur = 0.01,
    isReversed = false,
    side = "bottom",
  } = target;

  const rangeLeft = warpRange?.left ?? 0.475;
  const rangeRight = warpRange?.right ?? 0.525;

  const glPosX = position.x;
  const glPosY = 1 - position.y - dimensions.height;
  const glSizeX = dimensions.width;
  const glSizeY = dimensions.height;

  useLayoutEffect(() => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms;
    u.uTexture.value = texture;
    u.uRangeLeft.value = rangeLeft;
    u.uRangeRight.value = rangeRight;
    u.uMotionBlur.value = motionBlur;
    u.uEasingFunction.value = easing | 0;
    u.uIsReversed.value = isReversed ? 1 : 0;
    u.uSide.value = side === "top" ? 1 : 0;
    u.uImagePos.value.set(glPosX, glPosY);
    u.uImageSize.value.set(glSizeX, glSizeY);
  }, [
    texture,
    rangeLeft,
    rangeRight,
    motionBlur,
    easing,
    isReversed,
    side,
    glPosX,
    glPosY,
    glSizeX,
    glSizeY,
  ]);

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uProgress.value = target.progress;
    matRef.current.uniforms.uOpacity.value = target.opacity ?? 1;
  });

  return (
    <ScreenQuad renderOrder={renderOrder}>
      <warpMaterial ref={matRef} transparent depthWrite={false} depthTest={false} />
    </ScreenQuad>
  );
}

type Subscribable = { on: (event: "change", cb: (v: number) => void) => () => void };

function Invalidator({ onUpdate, fadeInMs = 2000 }: { onUpdate?: Subscribable; fadeInMs?: number }) {
  const invalidate = useThree((s) => s.invalidate);
  const mountTime = useRef(0);
  useLayoutEffect(() => { mountTime.current = performance.now(); }, []);

  useEffect(() => {
    if (!onUpdate) return;
    return onUpdate.on("change", () => invalidate());
  }, [onUpdate, invalidate]);

  useFrame(() => {
    if (performance.now() - mountTime.current < fadeInMs) {
      invalidate();
    }
  });

  return null;
}

export default function Warp({
  targets,
  height,
  width,
  className,
  onUpdate,
  ...props
}: CanvasProps & {
  targets: GenieTarget[];
  height: number;
  width: number;
  onUpdate?: Subscribable;
}) {
  return (
    <Canvas
      className={cn(className)}
      orthographic
      frameloop={onUpdate ? "demand" : "always"}
      gl={{
        alpha: true,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
      }}
      dpr={typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1}
      camera={{ position: [0, 0, 1], zoom: 1 }}
      style={{ width, height, pointerEvents: "none" }}
      {...props}>
      {onUpdate && <Invalidator onUpdate={onUpdate} />}
      {targets.map((target, i) => (
        <WarpQuad key={target.id} target={target} renderOrder={i} />
      ))}
    </Canvas>
  );
}
