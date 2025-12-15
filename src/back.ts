import * as hs from 'hyperscript';
import * as styles from './styles';
import { renderdom, rendercanvas } from './render';
import { map, load, getHdpiFactor } from './app';
import { getColorizer } from './brushcolor';
import { options } from './options';

const h = hs.context();
const RATIO = options.backCanvasSize / options.frontCanvasSize;
const colorScheme = options.colorScheme();

const canvas = h('canvas', {
  style: styles.result(colorScheme),
  width: options.backCanvasSize * options.hdpiFactor,
  height: options.backCanvasSize * options.hdpiFactor,
});

renderdom('ac-back', canvas);

const frontState = load();
const hdpiScale = options.hdpiFactor / getHdpiFactor(frontState);
const coordinateScale = RATIO * hdpiScale;

const state = map(frontState, z => ({
  ...z,
  x: z.x * coordinateScale,
  y: z.y * coordinateScale,
}));

rendercanvas(canvas, state, {
  lineWidth: options.backBaseLineWidth * options.hdpiFactor,
  colorizer: getColorizer(colorScheme, colorScheme.backBrushColorizer),
  colorScheme,
});
