import { load, willdisplay } from '../src/app';

describe('state hydration', () => {
  beforeEach(() => {
    window.localStorage?.clear();
    window.sessionStorage?.clear();
  });

  test('fills in missing pressure values for legacy data', () => {
    const storage = window.localStorage ?? window.sessionStorage;
    if (!storage) {
      throw new Error('No web storage available for tests');
    }

    storage.setItem(
      'state',
      JSON.stringify({
        lines: [[{ x: 1, y: 2 }]],
      }),
    );

    const state = load();
    let pressure = 0;

    willdisplay(state, lines => {
      pressure = lines[0][0].pressure;
      return true;
    });

    expect(pressure).toBe(1);
  });
});
