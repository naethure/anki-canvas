import { Newtype, _iso } from './newtype';
import { defaultStorage, isStorageSupported, dump, parse } from './storage';

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
};

type SerializablePoint = {
  readonly x: number;
  readonly y: number;
  readonly pressure?: number;
};

type SerializableState = {
  readonly lines?: Array<SerializablePoint[]>;
  readonly drawing?: SerializablePoint[];
};

const DEFAULT_PRESSURE = 1;
const MIN_PRESSURE = 0.05;

function clampPressure(raw?: number): number {
  if (typeof raw !== 'number' || Number.isNaN(raw)) {
    return DEFAULT_PRESSURE;
  }

  const clamped = Math.min(1, Math.max(MIN_PRESSURE, raw));
  return clamped;
}

function isSerializablePoint(p: unknown): p is SerializablePoint {
  if (p === null || typeof p !== 'object') {
    return false;
  }

  const candidate = p as Record<string, unknown>;
  return typeof candidate.x === 'number' && typeof candidate.y === 'number';
}

function withPressure(p: SerializablePoint): Point {
  return {
    x: p.x,
    y: p.y,
    pressure: clampPressure(p.pressure),
  };
}

function normalizeLine(points: SerializablePoint[] | undefined): Point[] {
  if (!Array.isArray(points)) {
    return [];
  }

  return points.filter(isSerializablePoint).map(withPressure);
}

function hydrate(state: SerializableState): S {
  const lines = Array.isArray(state.lines)
    ? state.lines.map(normalizeLine)
    : [];

  const drawing = normalizeLine(state.drawing);

  return {
    lines,
    drawing,
    dirty: true,
    down: false,
  };
}

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
  return iso.wrap(hydrate(parse(item)));
}

export function empty(): State {
  const result: S = {
    lines: [],
    drawing: [],
    dirty: true,
    down: false,
  };

  save(result);
  return iso.wrap(result);
}

export function map(s: State, cb: (x: Point) => Point): State {
  const state = iso.unwrap(s);
  const dup: S = parse(dump(state));
  dup.lines = dup.lines.map(l => l.map(cb));
  dup.drawing = dup.drawing.map(cb);
  return iso.wrap(dup);
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

  state.drawing.push(withPressure(p));
  state.dirty = true;
  save(state);
}

export function addFirstDrawingPoint(s: State, p: Point): void {
  const state = iso.unwrap(s);
  state.down = true;
  addDrawingPoint(s, p);
}

export function addLastDrawingPoing(s: State, p: Point): void {
  const state = iso.unwrap(s);
  state.drawing.push(withPressure(p));
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
