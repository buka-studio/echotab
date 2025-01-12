interface SnapshotOptions {
  quality?: number;
  width?: number;
  ratio?: number;
}

export async function snapshotActiveTab(windowId: number, options: SnapshotOptions = {}) {
  const { quality = 80, width = 1024, ratio = 16 / 9 } = options;

  const image = await chrome.tabs.captureVisibleTab(windowId, {
    quality,
  });

  const blob = await fetch(image).then((r) => r.blob());
  const imageBitmap = await createImageBitmap(blob);

  const { width: originalWidth, height: originalHeight } = imageBitmap;
  // 16:9, 1024x576
  // may need to reduce size further if this clogs up IDB
  const newWidth = width;
  const newHeight = newWidth / ratio;

  const canvas = new OffscreenCanvas(newWidth, newHeight);
  const ctx = canvas.getContext("2d");
  ctx!.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

  const resizedBlob = await canvas.convertToBlob();

  return resizedBlob;
}
