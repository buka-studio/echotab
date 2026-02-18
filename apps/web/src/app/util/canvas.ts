export function setupHiDPICtx(canvas: HTMLCanvasElement, width: number, height: number, dpr = 1) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, dpr };
}
