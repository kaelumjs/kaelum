// core/ipRestriction.js
// IP-based access control middleware.
// Supports exact IPs and CIDR notation (IPv4).
// Zero external dependencies — uses Node's net module + bitwise operations.

import net from "net";
import type { Express, NextFunction, Request, Response } from "express";
import { errorBody } from "../http-error.js";
import type { IpRestrictionOptions } from "../types.js";


/**
 * Parse an IPv4 CIDR string into { ip: number, mask: number }
 * @param {string} cidr - e.g. "192.168.1.0/24" or "192.168.1.5"
 * @returns {{ ip: number, mask: number }}
 */
function parseCIDR(cidr: string) {
  const [ipPart, prefixStr] = cidr.split("/");
  const prefix = prefixStr !== undefined ? parseInt(prefixStr, 10) : 32;
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipNum = ipToNumber(ipPart ?? "");
  return { ip: ipNum & mask, mask };
}

/**
 * Convert a dotted-decimal IPv4 address to a 32-bit unsigned integer.
 * @param {string} ip
 * @returns {number}
 */
function ipToNumber(ip: string) {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) | parseInt(octet, 10)) >>> 0, 0);
}

/**
 * Check if a given IP address is covered by a CIDR rule.
 * @param {string} clientIp
 * @param {string} cidr
 * @returns {boolean}
 */
function matchesCIDR(clientIp: string, cidr: string) {
  // Strip IPv6-mapped IPv4 prefix if present (e.g. "::ffff:127.0.0.1")
  const normalizedIp = clientIp.replace(/^::ffff:/, "");

  // Only handle IPv4
  if (!net.isIPv4(normalizedIp)) return false;

  try {
    const { ip: networkIp, mask } = parseCIDR(cidr);
    const clientIpNum = ipToNumber(normalizedIp);
    return (clientIpNum & mask) === networkIp;
  } catch {
    return false;
  }
}

/**
 * Check if clientIp is matched by any of the rules in the list.
 * @param {string} clientIp
 * @param {string[]} rules
 * @returns {boolean}
 */
function matchesAny(clientIp: string, rules: string[]) {
  return rules.some((rule) => matchesCIDR(clientIp, rule));
}

/**
 * Sets up IP restriction middleware on the app.
 *
 * Logic:
 * - If the IP is in the `allow` list → ALWAYS allow (overrides deny).
 * - If the IP is in the `deny` list → deny.
 * - If neither list matches → allow.
 * - If deny contains "0.0.0.0/0" → deny all unless explicitly allowed.
 *
 * @param {import('express').Application} app
 * @param {Object} options
 * @param {string[]} [options.allow=[]] - CIDR/IP rules that are always allowed
 * @param {string[]} [options.deny=[]] - CIDR/IP rules that are denied
 * @param {Function} [options.onDenied] - Custom handler (req: Request, res: Response) called when access is denied
 */
function setupIpRestriction(app: Express, options: IpRestrictionOptions = {}) {
  app.use(ipRestriction(options));
}

/**
 * The IP restriction middleware on its own, for `app.use()` or a route's `use`.
 * Same rules as above: `allow` always wins, then `deny`, otherwise the request passes.
 */
function ipRestriction(options: IpRestrictionOptions = {}) {
  const allowRules = Array.isArray(options.allow) ? options.allow : [];
  const denyRules = Array.isArray(options.deny) ? options.deny : [];
  const onDenied = typeof options.onDenied === "function" ? options.onDenied : null;

  return function kaelumIpRestriction(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || (req.connection && req.connection.remoteAddress) || "";

    // Allow list takes highest priority
    if (allowRules.length > 0 && matchesAny(clientIp, allowRules)) {
      return next();
    }

    // Check deny list
    if (denyRules.length > 0 && matchesAny(clientIp, denyRules)) {
      if (onDenied) {
        return onDenied(req, res);
      }
      return res
        .status(403)
        .json(errorBody(403, "Your IP address is not allowed to access this resource.", "IP_NOT_ALLOWED"));
    }

    next();
  };
}

export { setupIpRestriction, ipRestriction, matchesCIDR };
