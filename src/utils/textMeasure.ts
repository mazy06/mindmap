// ─── Text Measurement Utility ────────────────────────────────────────────────
// Accurate SVG text bounding box calculation using a hidden canvas

let measureCanvas: HTMLCanvasElement | null = null;

function getCanvas(): HTMLCanvasElement {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
  }
  return measureCanvas;
}

export function measureText(
  text: string,
  fontSize: number,
  fontFamily: string,
  fontWeight: string = 'normal'
): { width: number; height: number } {
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const lines = text.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, m.width);
  }

  const lineHeight = fontSize * 1.4;
  const height = lineHeight * lines.length;

  return { width: Math.ceil(maxWidth), height: Math.ceil(height) };
}

export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: string = 'normal'
): string[] {
  const canvas = getCanvas();
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
