import type { Middleware } from "kaelum";

/** Demo login: marks every visitor as "Admin". Replace with real authentication. */
export const fakeLogin: Middleware = (_req, res, next) => {
  res.locals.user = "Admin";
  next();
};
