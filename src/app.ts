import { Newtype, _iso } from './newtype';
import { defaultStorage, isStorageSupported, dump, parse } from './storage';

const defaultHdpiFactor = window.devicePixelRatio ?? 2;

export type Point = {
  readonly x: number;
  readonly y: number;
  readonly pressure: number;
};

type S = {
  lines: Array<Point[]>;
  drawing: Point[];
  dirty: boolean;
  down: boolean;
  hdpiFactor: number;
};

export interface State extends Newtype<{ readonly State: unique symbol }, S> {}

const iso = _iso<State>();
const db = defaultStorage();

function save(x: S): void {
  if (!isStorageSupported(db)) {
    return;
  }

  db.setItem('state', dump(x));
}

export function load(): State {
  if (!isStorageSupported(db)) {
    return empty();
  }
  const item = db.getItem('state');
  if (item === null || item === undefined) {
    return empty();
  }
  const parsed = parse(item) as Partial<S>;
  const hdpiFactor =
    typeof parsed.hdpiFactor === 'number' ? parsed.hdpiFactor : defaultHdpiFactor;
  return iso.wrap({
    lines: parsed.lines ?? [],
    drawing: parsed.drawing ?? [],
    dirty: true,
    down: parsed.down ?? false,
    hdpiFactor,
  });
}

export function empty(): State {
  const result: S = {
    lines: [],
    drawing: [],
    dirty: true,
    down: false,
    hdpiFactor: defaultHdpiFactor,
  };

  save(result);
  return iso.wrap(result);
}

export function map(s: State, cb: (x: Point) => Point): State {
  const state = iso.unwrap(s);
  const dup: S = parse(dump(state));
  dup.lines = dup.lines.map(l => l.map(cb));
  dup.dirty = true;
  return iso.wrap(dup);
}

export function getHdpiFactor(s: State): number {
  return iso.unwrap(s).hdpiFactor;
}

export function undo(s: State): void {
  const state = iso.unwrap(s);
  state.lines.splice(-1, 1);
  state.dirty = true;
  save(state);
}

export function clear(s: State): void {
  const state = iso.unwrap(s);
  state.lines.splice(0, state.lines.length);
  state.dirty = true;
  save(state);
}

export type Action = (state: State, p: Point) => void;

export function addDrawingPoint(s: State, p: Point): void {
  const state = iso.unwrap(s);

  if (!state.down) {
    return;
  }

  state.drawing.push(p);
  state.dirty = true;
  save(state);
}

export function addFirstDrawingPoint(s: State, p: Point): void {
  const state = iso.unwrap(s);
  state.down = true;
  addDrawingPoint(s, p);
}

export function addLastDrawingPoint(s: State, p: Point): void {
  const state = iso.unwrap(s);
  if(!state.down) {
    return;
  }
  state.drawing.push(p);
  state.lines.push(state.drawing);
  state.drawing = [];
  state.dirty = true;
  state.down = false;
  save(state);
}

export function willdisplay(s: State, cb: (lines: Array<Point[]>) => boolean) {
  const state = iso.unwrap(s);
  if (state.dirty) {
    const successful = cb(
      [...state.lines, state.drawing].filter(x => x.length > 0),
    );
    state.dirty = !successful;
  }
}
