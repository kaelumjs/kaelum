import type { RequestIdOptions } from "../config.js";
import type { Middleware } from "../routing/types.js";

// What a client may send as a request ID: short, printable and safe to log.
const SAFE_ID = /^[\w.:-]{1,128}$/;

/**
 * Give every request an ID: reuse the one sent by the client or a proxy when
 * it looks sane, otherwise generate one. The ID is stored on `req.id` and
 * echoed in the response header.
 */
export function requestId({ header, generate }: Required<RequestIdOptions>): Middleware {
  return (req, res, next) => {
    const incoming = req.get(header);
    const id = incoming !== undefined && SAFE_ID.test(incoming) ? incoming : generate();

    req.id = id;
    res.setHeader(header, id);
    next();
  };
}
