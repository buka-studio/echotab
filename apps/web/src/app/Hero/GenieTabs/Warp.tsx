"use client";

import { cn } from "@echotab/ui/util";
import { shaderMaterial } from "@react-three/drei";
import { Canvas, CanvasProps, extend, ThreeElement, useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
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
    uMotionBlur: 0,
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

const MAX_WARP_DPR = 2;
const DEFAULT_RANGE_LEFT = 0.475;
const DEFAULT_RANGE_RIGHT = 0.525;
const QUAD_PADDING = 0.02;

export function getWarpDpr() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Math.min(window.devicePixelRatio || 1, MAX_WARP_DPR);
}

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

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function createTargetGeometry(target: GenieTarget) {
  const rangeLeft = target.warpRange?.left ?? DEFAULT_RANGE_LEFT;
  const rangeRight = target.warpRange?.right ?? DEFAULT_RANGE_RIGHT;
  const imageLeft = target.position.x;
  const imageRight = target.position.x + target.dimensions.width;
  const imageBottom = 1 - target.position.y - target.dimensions.height;
  const imageTop = imageBottom + target.dimensions.height;
  const isTop = target.side === "top";

  const left = clamp01(Math.min(imageLeft, rangeLeft, rangeRight) - QUAD_PADDING);
  const right = clamp01(Math.max(imageRight, rangeLeft, rangeRight) + QUAD_PADDING);
  const bottom = clamp01((isTop ? imageBottom : imageBottom - 1) - QUAD_PADDING);
  const top = clamp01((isTop ? imageTop + 1 : imageTop) + QUAD_PADDING);

  const x0 = left * 2 - 1;
  const x1 = right * 2 - 1;
  const y0 = bottom * 2 - 1;
  const y1 = top * 2 - 1;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array([x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0]), 3),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeBoundingSphere();

  return geometry;
}

const WarpQuad = memo(function WarpQuad({
  target,
  renderOrder,
}: {
  target: GenieTarget;
  renderOrder: number;
}) {
  const matRef = useRef<WarpMatImpl>(null!);
  const geometry = useMemo(() => createTargetGeometry(target), [target]);

  const {
    texture,
    position,
    dimensions,
    easing = 1,
    warpRange,
    motionBlur = 0,
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

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.uniforms.uProgress.value = target.progress;
    matRef.current.uniforms.uOpacity.value = target.opacity ?? 1;
  });

  return (
    <mesh geometry={geometry} renderOrder={renderOrder} frustumCulled={false}>
      <warpMaterial ref={matRef} transparent depthWrite={false} depthTest={false} />
    </mesh>
  );
});

type Subscribable = { on: (event: "change", cb: (v: number) => void) => () => void };

function Invalidator({
  onUpdate,
  fadeInMs = 2000,
}: {
  onUpdate?: Subscribable;
  fadeInMs?: number;
}) {
  const invalidate = useThree((s) => s.invalidate);
  const mountTime = useRef(0);
  useLayoutEffect(() => {
    mountTime.current = performance.now();
  }, []);

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
        depth: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        stencil: false,
      }}
      dpr={getWarpDpr()}
      camera={{ position: [0, 0, 1], zoom: 1 }}
      style={{ width, height, pointerEvents: "none", display: "block" }}
      {...props}>
      {onUpdate && <Invalidator onUpdate={onUpdate} />}
      {targets.map((target, i) => (
        <WarpQuad key={target.id} target={target} renderOrder={i} />
      ))}
    </Canvas>
  );
}
