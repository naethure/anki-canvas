import { options } from './options';
import * as hs from 'hyperscript';
import { renderdom, rendercanvas } from './render';
import {
  Point,
  State,
  Action,
  empty,
  addFirstDrawingPoint,
  addDrawingPoint,
  addLastDrawingPoing,
  undo,
  clear,
} from './app';

import { getColorizer } from './brushcolor';
import * as styles from './styles';
import * as icons from './icons';

function init() {
  const h = hs.context();

  const colorScheme = options.colorScheme();

  const canvas = h('canvas', {
    style: styles.canvas(colorScheme),
    width: options.frontCanvasSize * options.hdpiFactor,
    height: options.frontCanvasSize * options.hdpiFactor,
  });

  const buttons = {
    undo: h('button', { style: styles.action(colorScheme) }),
    clear: h('button', { style: styles.action(colorScheme) }),
  };

  const actions = h(
    'div',
    { style: styles.actions(colorScheme) },
    Object.values(buttons),
  );

  const T = h('div', { style: styles.wrapper(colorScheme) }, [canvas, actions]);

  renderdom('ac-front', T);

  const state = empty();

  const supportsPointerEvents = 'PointerEvent' in window;
  const supportsTouchEvents = typeof TouchEvent !== 'undefined';

  const handler = (canvas: HTMLCanvasElement, state: State, action: Action) => (
    evt: Event,
  ): void => {
    evt.preventDefault();

    if (supportsTouchEvents && evt instanceof TouchEvent) {
      const touch = evt.changedTouches[0];
      if (!touch) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const point: Point = {
        x: (touch.pageX - rect.left) * options.hdpiFactor,
        y: (touch.pageY - rect.top) * options.hdpiFactor,
        pressure: getTouchPressure(touch),
      };
      action(state, point);
      return;
    }

    if (evt instanceof MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const point: Point = {
        x: (evt.pageX - rect.left) * options.hdpiFactor,
        y: (evt.pageY - rect.top) * options.hdpiFactor,
        pressure: getPointerPressure(evt),
      };
      action(state, point);
    }
  };

  const baseEvents: Array<[string, Action]> = supportsPointerEvents
    ? [
        ['pointerdown', addFirstDrawingPoint],
        ['pointermove', addDrawingPoint],
        ['pointerup', addLastDrawingPoing],
        ['pointercancel', addLastDrawingPoing],
      ]
    : [
        ['touchstart', addFirstDrawingPoint],
        ['touchmove', addDrawingPoint],
        ['touchend', addLastDrawingPoing],
        ['touchcancel', addLastDrawingPoing],
        ['mousedown', addFirstDrawingPoint],
        ['mousemove', addDrawingPoint],
        ['mouseup', addLastDrawingPoing],
      ];

  baseEvents.forEach(e => {
    canvas.addEventListener(e[0], handler(canvas, state, e[1]), false);
  });

  function getPointerPressure(evt: MouseEvent): number {
    if (supportsPointerEvents && evt instanceof PointerEvent) {
      const raw = evt.pressure;
      if (raw === 0 && evt.buttons !== 0) {
        return 0.5;
      }
      return raw || 1;
    }

    if (typeof evt.buttons === 'number' && evt.buttons > 0) {
      return 1;
    }

    return 1;
  }

  function getTouchPressure(touch: Touch): number {
    if (typeof touch.force === 'number' && touch.force > 0) {
      return touch.force;
    }
    return 1;
  }

  function renderloop() {
    rendercanvas(canvas, state, {
      colorizer: getColorizer(colorScheme, colorScheme.frontBrushColorizer),
      lineWidth: options.frontLineWidth * options.hdpiFactor,
      colorScheme,
    });
    requestAnimationFrame(renderloop);
  }

  renderloop();

  canvas.addEventListener('click', e => e.preventDefault(), false);
  buttons.undo.addEventListener('click', () => undo(state), false);
  buttons.clear.addEventListener('click', () => clear(state), false);
  buttons.undo.innerHTML = icons.undo;
  buttons.clear.innerHTML = icons.clear;
}

requestAnimationFrame(init);
