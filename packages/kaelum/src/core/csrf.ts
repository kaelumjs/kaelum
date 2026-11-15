// core/csrf.js
// Kaelum - CSRF Protection Middleware
//
// Provides two complementary CSRF protection modes:
//
// 1. originCheck(options) — validates Origin/Referer headers against an allowlist.
//    Zero-state, ideal for JSON APIs.
//
// 2. doubleSubmit(options) — generates a random token into a cookie on safe
//    requests, then validates that the same token is echoed back in a custom
//    request header on mutating requests. Ideal for apps with HTML forms.
//
// Safe HTTP methods (GET, HEAD, OPTIONS, TRACE) are always skipped per RFC 7231.

import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { errorBody } from "../http-error.js";
import type { CsrfOptions } from "../types.js";

type CsrfRequest = Request & { _csrfToken?: string };


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Methods that are exempt from CSRF checks (RFC 7231 safe methods) */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

/** Default mutating methods checked by CSRF middleware */
const DEFAULT_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a value to an array of lowercase trimmed strings.
 * @param {string | string[] | undefined} val
 * @returns {string[]}
 */
function toArray(val: unknown): string[] {
  if (!val) return [];
  return (Array.isArray(val) ? val : [val]).map((s) =>
    typeof s === "string" ? s.trim().toLowerCase() : ""
  );
}

/**
 * Extract the origin (scheme + host) from a full URL string.
 * Returns null if unparseable.
 * @param {string} url
 * @returns {string | null}
 */
function extractOrigin(url: string | undefined) {
  try {
    const parsed = new URL(url as string);
    return parsed.origin; // e.g. "https://example.com"
  } catch {
    return null;
  }
}

/**
 * Derive the request's apparent origin from Origin or Referer headers.
 * @param {import('express').Request} req
 * @returns {string | null}
 */
function getRequestOrigin(req: Request) {
  const origin = req.headers["origin"];
  if (origin && origin !== "null") return origin.trim();

  const referer = req.headers["referer"];
  if (referer) return extractOrigin(referer);

  return null;
}

/**
 * Derive the host origin from the Express request (scheme + host).
 * @param {import('express').Request} req
 * @returns {string}
 */
function getHostOrigin(req: Request) {
  const protocol = req.protocol || "http";
  const host = req.headers["host"] || "localhost";
  return `${protocol}://${host}`;
}

/**
 * Parse the Cookie header into an object.
 * Falls back to req.cookies (populated by cookie-parser) when available.
 * @param {import('express').Request} req
 * @returns {Record<string, string>}
 */
function parseCookies(req: Request): Record<string, string> {
  if (req.cookies && typeof req.cookies === "object") return req.cookies;
  const header = req.headers["cookie"] || "";
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((pair: string) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return [pair.trim(), ""];
      return [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1).trim())];
    })
  );
}

/**
 * Check if a path matches any of the exclude patterns.
 * Supports exact strings and simple wildcard suffix (e.g. '/api/*').
 * @param {string} path
 * @param {string[]} excludes
 * @returns {boolean}
 */
function isExcluded(path: string, excludes: string[]) {
  for (const pattern of excludes) {
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -1); // remove '*'
      if (path.startsWith(prefix)) return true;
    } else {
      if (path === pattern || path.startsWith(pattern + "/")) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Mode 1: Origin Check
// ---------------------------------------------------------------------------

/**
 * Middleware that validates the Origin / Referer header against an allowlist.
 *
 * @param {Object}          [options]
 * @param {string|string[]} [options.origin]   Allowed origins. Defaults to the request host.
 * @param {string[]}        [options.exclude]  Paths to skip (exact or prefix with '/*').
 * @param {string[]}        [options.methods]  HTTP methods to protect. Default: POST/PUT/PATCH/DELETE.
 * @returns {import('express').RequestHandler}
 */
function originCheck(options: CsrfOptions = {}) {
  const {
    origin: allowedOrigins,
    exclude: excludePaths = [],
    methods: protectedMethods = DEFAULT_METHODS,
  } = options;

  const methodSet = new Set(protectedMethods.map((m) => m.toUpperCase()));
  const excludeList = Array.isArray(excludePaths) ? excludePaths : [excludePaths];

  return function csrfOriginCheck(req: Request, res: Response, next: NextFunction) {
    // Always skip safe methods
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();
    // Skip if method not in protection list
    if (!methodSet.has(req.method.toUpperCase())) return next();
    // Skip excluded paths
    if (excludeList.length && isExcluded(req.path, excludeList)) return next();

    const requestOrigin = getRequestOrigin(req);

    // Build the effective allowlist on first use (or if dynamic)
    let allowed;
    if (!allowedOrigins) {
      // Auto-detect from host
      allowed = [getHostOrigin(req)];
    } else {
      allowed = Array.isArray(allowedOrigins) ? allowedOrigins : [allowedOrigins];
    }

    // Normalise both sides for comparison
    const allowedNorm = allowed.map((o) => o.trim().replace(/\/$/, ""));

    if (!requestOrigin) {
      return res.status(403).json(errorBody(403, "CSRF validation failed", "CSRF_FAILED"));
    }

    const reqOriginNorm = requestOrigin.replace(/\/$/, "");
    if (!allowedNorm.includes(reqOriginNorm)) {
      return res.status(403).json(errorBody(403, "CSRF validation failed", "CSRF_FAILED"));
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Mode 2: Double-Submit Cookie
// ---------------------------------------------------------------------------

/**
 * Middleware that generates a CSRF token into a cookie (on all requests) and
 * validates that the same token is echoed in a custom request header on
 * mutating requests.
 *
 * @param {Object}   [options]
 * @param {string}   [options.cookie='csrf-token']   Cookie name.
 * @param {string}   [options.header='X-CSRF-Token'] Request header name.
 * @param {string[]} [options.exclude]               Paths to skip.
 * @param {string[]} [options.methods]               Methods to protect.
 * @param {Object}   [options.cookieOptions]         Extra options for res.cookie().
 * @returns {import('express').RequestHandler}
 */
function doubleSubmit(options: CsrfOptions = {}) {
  const {
    cookie: cookieName = "csrf-token",
    header: headerName = "X-CSRF-Token",
    exclude: excludePaths = [],
    methods: protectedMethods = DEFAULT_METHODS,
    cookieOptions: extraCookieOpts = {},
  } = options;

  const methodSet = new Set(protectedMethods.map((m) => m.toUpperCase()));
  const excludeList = Array.isArray(excludePaths) ? excludePaths : [excludePaths];
  const headerLower = headerName.toLowerCase();

  return function csrfDoubleSubmit(req: Request, res: Response, next: NextFunction) {
    const cookies = parseCookies(req);

    // Always generate / refresh the cookie so the client always has a valid token
    if (!cookies[cookieName]) {
      const token = crypto.randomBytes(32).toString("hex");
      res.cookie(cookieName, token, {
        httpOnly: false, // JS must be able to read it
        sameSite: "strict",
        ...extraCookieOpts,
      });
      // Store on req so handlers in the same request can read it
      (req as CsrfRequest)._csrfToken = token;
    } else {
      (req as CsrfRequest)._csrfToken = cookies[cookieName];
    }

    // Skip safe methods after ensuring cookie is set
    if (SAFE_METHODS.has(req.method.toUpperCase())) return next();
    if (!methodSet.has(req.method.toUpperCase())) return next();
    if (excludeList.length && isExcluded(req.path, excludeList)) return next();

    const cookieToken = cookies[cookieName];
    const headerToken = req.headers[headerLower];

    if (!cookieToken || !headerToken) {
      return res.status(403).json(errorBody(403, "CSRF validation failed", "CSRF_FAILED"));
    }

    // Constant-time comparison to prevent timing attacks
    const cookieBuf = Buffer.from(cookieToken);
    const headerBuf = Buffer.from(headerToken as string);
    if (
      cookieBuf.length !== headerBuf.length ||
      !crypto.timingSafeEqual(cookieBuf, headerBuf)
    ) {
      return res.status(403).json(errorBody(403, "CSRF validation failed", "CSRF_FAILED"));
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { originCheck, doubleSubmit };
