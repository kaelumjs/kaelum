/**
 * Demo authentication: requires the header `x-api-key: secret`.
 * Any Express middleware works in `use`.
 */
export const requireApiKey = (req, res, next) => {
  if (req.get("x-api-key") !== "secret") {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Send x-api-key: secret" } });
    return;
  }
  next();
};
