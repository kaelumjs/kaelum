import createApp from "./createApp.js";
import type { KaelumApp } from "./types.js";

/** Create a Kaelum app: an Express app with Kaelum helpers attached. */
const kaelum = createApp as () => KaelumApp;

export default kaelum;

// Lets CommonJS callers keep writing `require("kaelum")()`.
export { kaelum as "module.exports" };

export type * from "./types.js";
