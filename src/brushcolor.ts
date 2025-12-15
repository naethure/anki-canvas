import { ColorScheme } from './options';

type RGB = {
  readonly r: number;
  readonly g: number;
  readonly b: number;
};

type HSV = {
  readonly h: number;
  readonly s: number;
  readonly v: number;
};

type HEX = string;

function hex(c: RGB): HEX {
  return (
    '#' +
    [c.r, c.g, c.b]
      .map(x => {
        const h = x.toString(16);
        return h.length === 1 ? '0' + h : h;
      })
      .join('')
  );
}

function rgb(color: HSV): RGB {
  let r = 0;
  let g = 0;
  let b = 0;

  const s = color.s;
  const v = color.v;
  const h = color.h;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }

  return {
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255),
  };
}

export function spectrum(idx: number, count: number, s = 0.95, v = 0.75): HEX {
  return hex(rgb({ h: idx / count, s, v }));
}

export function contrast(idx: number, _count: number, s = 0.95, v = 0.75): HEX {
  const angle = 0.618033988749895; // conjugate of the golden ratio
  return hex(rgb({ h: idx / angle, s, v }));
}
export function prebaked(idx: number, _count: number, _s = 0.95, _v = 0.75): HEX {
  const rgb = [
    "#ff0000", 
    "#ff7f00", 
    "#ffff00", 
    "#54ff00", 
    "#00ffd4", 
    "#003fff", 
    "#9400ff", 
    "#ff00d4", 
    "#b24759", 
    "#b26b47", 
    "#b2a047", 
    "#7cb247", 
    "#47b28e", 
    "#4774b2", 
    "#7447b2", 
    "#b247b2", 
    "#661000", 
    "#664400", 
    "#556600", 
    "#116600", 
    "#006666", 
    "#000866", 
    "#4c0066", 
    "#660044", 
    "#e58989", 
    "#e5b789", 
    "#e5e589", 
    "#a8e589", 
    "#89e5d6", 
    "#89a0e5", 
    "#bf89e5", 
    "#e589d6",
  ];
  return rgb[idx % rgb.length];
}

export const none = (colorscheme: ColorScheme) => (
  _idx: number,
  _count: number,
): HEX => colorscheme.brush;

export type Colorizers = 'none' | 'spectrum' | 'contrast' | 'prebaked';

export function getColorizer(colorscheme: ColorScheme, c: Colorizers) {
  switch (c) {
    case 'none':
      return none(colorscheme);
    case 'spectrum':
      return spectrum;
    case 'contrast':
      return contrast;
    case 'prebaked':
      return prebaked;
  }
}
