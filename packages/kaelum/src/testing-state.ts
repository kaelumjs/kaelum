// Shared between `app.start()` and `kaelum/testing`, through a global symbol
// so it works even if the two are loaded as separate module instances.

interface TestingState {
  /** How many `testApp(() => import(...))` calls are loading an app right now. */
  loading: number;
  /** Apps whose `start()` ran while loading, oldest first. */
  started: unknown[];
  /** The app each loaded module started, so a second import of it finds the app. */
  byModule: WeakMap<object, unknown>;
}

const KEY = Symbol.for("kaelum.testing");

/** @internal */
export function testingState(): TestingState {
  const holder = globalThis as { [KEY]?: TestingState };
  return (holder[KEY] ??= { loading: 0, started: [], byModule: new WeakMap() });
}
