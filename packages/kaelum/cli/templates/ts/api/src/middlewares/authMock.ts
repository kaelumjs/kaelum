// middlewares/authMock.ts
// Simple mock "authentication" middleware for demo purposes.
// Checks for header "x-api-key: secret" — if absent, returns 401.

const authMock = (req: any, res: any, next: any): void => {
  const key = req.headers["x-api-key"] || req.query.api_key;
  if (!key || key !== "secret") {
    res
      .status(401)
      .json({ error: { message: "Unauthorized. Provide x-api-key: secret" } });
    return;
  }
  next();
};

export { authMock };
