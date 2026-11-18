// Allow or deny clients by IPv4 address or CIDR range. No dependencies.

import net from "node:net";
import type { Request, Response } from "express";
import { errorBody } from "../http-error.js";
import type { Middleware } from "../routing/types.js";

export interface IpRestrictionOptions {
  /** IPs or CIDR ranges always allowed. Wins over `deny`. */
  allow?: string[];
  /** IPs or CIDR ranges denied. `"0.0.0.0/0"` denies everyone not in `allow`. */
  deny?: string[];
  /** Answer denied requests yourself instead of the default 403. */
  onDenied?: (req: Request, res: Response) => unknown;
}

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => ((acc << 8) | parseInt(octet, 10)) >>> 0, 0);
}

function parseCIDR(cidr: string): { ip: number; mask: number } {
  const [ipPart, prefixStr] = cidr.split("/");
  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : 32;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return { ip: ipToNumber(ipPart ?? "") & mask, mask };
}

/** True when `clientIp` is inside `cidr` (an exact IP counts as a /32). IPv4 only. */
export function matchesCIDR(clientIp: string, cidr: string): boolean {
  // IPv4 clients often show up as IPv6-mapped addresses ("::ffff:127.0.0.1").
  const ip = clientIp.replace(/^::ffff:/, "");
  if (!net.isIPv4(ip)) return false;

  const { ip: network, mask } = parseCIDR(cidr);
  return (ipToNumber(ip) & mask) === network;
}

/**
 * Restrict access by client IP: `allow` always wins, then `deny`, otherwise
 * the request passes. For the whole app use `security.ipRestriction`; this
 * factory is for one route or subtree, through `use`.
 */
export function ipRestriction(options: IpRestrictionOptions = {}): Middleware {
  const allow = options.allow ?? [];
  const deny = options.deny ?? [];
  const matches = (ip: string, rules: string[]) => rules.some((rule) => matchesCIDR(ip, rule));

  return function kaelumIpRestriction(req, res, next) {
    const ip = req.ip ?? req.socket.remoteAddress ?? "";

    if (allow.length > 0 && matches(ip, allow)) return next();

    if (deny.length > 0 && matches(ip, deny)) {
      if (options.onDenied) {
        options.onDenied(req, res);
        return;
      }
      res
        .status(403)
        .json(errorBody(403, "Your IP address is not allowed to access this resource.", "IP_NOT_ALLOWED"));
      return;
    }

    next();
  };
}
