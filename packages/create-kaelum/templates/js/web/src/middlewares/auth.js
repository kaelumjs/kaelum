/** Demo login: every visitor is "Ada". Views read it as `user`. */
export const fakeLogin = (_req, res, next) => {
  res.locals.user = "Ada";
  next();
};
