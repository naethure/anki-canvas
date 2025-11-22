import { Point, State, willdisplay } from './app';
import { ColorScheme } from './options';

const DEFAULT_CONFIG = {
  lineWidth: 18,
};

type DrawConfig = {
  colorizer: (_index: number, _count: number) => string;
  lineWidth: number;
  colorScheme: ColorScheme;
};

function rendergrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  colorscheme: ColorScheme,
) {
  const mw = w / 2;
  const mh = h / 2;

  const lines: Array<[number, number, number, number]> = [
    [0, 0, w, h],
    [w, 0, 0, h],
    [mw, 0, mw, h],
    [0, mh, w, mh],
  ];

  ctx.save();
  for (let i = 0; i < lines.length; i++) {
    const x = lines[i];
    ctx.beginPath();
    ctx.setLineDash([w / 80, h / 80]);
    ctx.strokeStyle = colorscheme.grid;
    ctx.lineWidth = 1;
    ctx.moveTo(x[0], x[1]);
    ctx.lineTo(x[2], x[3]);
    ctx.stroke();
  }
  ctx.restore();
}

export function rendercanvas(
  canvas: HTMLCanvasElement,
  s: State,
  customConfig: DrawConfig,
) {
  willdisplay(s, lines => {
    const ctx = canvas.getContext('2d');

    if (ctx === null) {
      return false;
    }

    const config = { ...DEFAULT_CONFIG, ...customConfig };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    rendergrid(ctx, canvas.width, canvas.height, config.colorScheme);

    ctx.save();
    ctx.lineWidth = config.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const color = config.colorizer(i, lines.length);
      drawStroke(ctx, line, color, config.lineWidth);
    }

    ctx.restore();

    return true;
  });
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  line: Point[],
  color: string,
  baseWidth: number,
) {
  if (line.length === 0) {
    return;
  }

  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  if (line.length === 1) {
    drawDot(ctx, line[0], baseWidth);
    return;
  }

  for (let i = 1; i < line.length; i++) {
    const src = line[i - 1];
    const dst = line[i];
    const avgPressure = (src.pressure + dst.pressure) / 2;
    ctx.lineWidth = baseWidth * avgPressure;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(dst.x, dst.y);
    ctx.stroke();
  }
}

function drawDot(
  ctx: CanvasRenderingContext2D,
  point: Point,
  baseWidth: number,
) {
  const radius = (baseWidth * point.pressure) / 2;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function renderdom(id: string, t: HTMLElement) {
  const el = document.getElementById(id);
  if (el !== null) {
    if (el.firstChild !== null) {
      el.removeChild(el.firstChild);
    }
    el.appendChild(t);
  }
}
