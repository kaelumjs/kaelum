/** Demo login: marks every visitor as "Admin". Replace with real authentication. */
export const fakeLogin = (_req, res, next) => {
  res.locals.user = "Admin";
  next();
};
