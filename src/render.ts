import { State, willdisplay } from './app';
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length === 0) {
        continue;
      }

      const color = config.colorizer(i, lines.length);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (line.length === 1) {
        const p = line[0];
        const pressure = p.pressure ?? 0.5;
        const width = config.lineWidth * (pressure + 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, width / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      for (let j = 1; j < line.length; j++) {
        const src = line[j - 1];
        const dst = line[j];

        const srcPressure = src.pressure ?? 0.5;
        const dstPressure = dst.pressure ?? 0.5;
        const avgPressure = (srcPressure + dstPressure) / 2;
        const width = config.lineWidth * (avgPressure + 0.5);

        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(dst.x, dst.y);
        ctx.stroke();
      }
    }

    ctx.restore();

    return true;
  });
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
