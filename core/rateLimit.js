// core/rateLimit.js
// Kaelum built-in rate limiting middleware.
// Zero-dependency, in-memory sliding-window rate limiter.

/**
 * In-memory store for tracking request counts per key.
 * Automatically cleans up expired entries on an interval.
 */
class MemoryStore {
  /**
   * @param {number} windowMs - window duration in milliseconds
   */
  constructor(windowMs) {
    this.windowMs = windowMs;
    /** @type {Map<string, { hits: number, resetTime: number }>} */
    this.hits = new Map();
    // clean up expired entries every 60s (or every window if shorter)
    this._cleanupInterval = setInterval(
      () => this._cleanup(),
      Math.min(windowMs, 60000)
    );
    // don't block process exit
    if (this._cleanupInterval.unref) {
      this._cleanupInterval.unref();
    }
  }

  /**
   * Increment the hit counter for a key.
   * @param {string} key
   * @returns {{ totalHits: number, resetTime: number }}
   */
  increment(key) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (entry && now < entry.resetTime) {
      entry.hits += 1;
      return { totalHits: entry.hits, resetTime: entry.resetTime };
    }

    // new window
    const resetTime = now + this.windowMs;
    const record = { hits: 1, resetTime };
    this.hits.set(key, record);
    return { totalHits: 1, resetTime };
  }

  /**
   * Reset the counter for a specific key.
   * @param {string} key
   */
  resetKey(key) {
    this.hits.delete(key);
  }

  /**
   * Remove expired entries from the store.
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.hits) {
      if (now >= entry.resetTime) {
        this.hits.delete(key);
      }
    }
  }

  /**
   * Shut down the store and clear the cleanup interval.
   */
  shutdown() {
    clearInterval(this._cleanupInterval);
    this.hits.clear();
  }
}

/**
 * Create a rate-limiting middleware function.
 *
 * @param {Object} [options]
 * @param {number}   [options.windowMs=900000]   - window duration in ms (default 15 min)
 * @param {number}   [options.max=100]           - max requests per window per key
 * @param {string|Object} [options.message]      - response body when limited
 * @param {number}   [options.statusCode=429]    - HTTP status when limited
 * @param {Function} [options.keyGenerator]      - (req) => string  (default: req.ip)
 * @param {Function} [options.skip]              - (req) => boolean (default: false)
 * @param {boolean}  [options.headers=true]      - send standard rate-limit headers
 * @param {Object}   [options.store]             - custom store (must implement increment/resetKey/shutdown)
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = { error: "Too many requests, please try again later." },
    statusCode = 429,
    keyGenerator = (req) => req.ip || req.connection.remoteAddress || "unknown",
    skip = () => false,
    headers = true,
    store: customStore,
  } = options;

  const store = customStore || new MemoryStore(windowMs);

  /**
   * Express middleware function.
   */
  function rateLimitMiddleware(req, res, next) {
    // allow skipping for certain requests
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const { totalHits, resetTime } = store.increment(key);
    const remaining = Math.max(0, max - totalHits);

    // attach rate-limit info to request for downstream use
    req.rateLimit = { limit: max, remaining, resetTime };

    // set standard headers
    if (headers) {
      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader("RateLimit-Remaining", String(remaining));
      res.setHeader(
        "RateLimit-Reset",
        String(Math.ceil(resetTime / 1000))
      );
    }

    // exceeded limit
    if (totalHits > max) {
      if (headers) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        res.setHeader("Retry-After", String(Math.max(retryAfter, 0)));
      }

      const body =
        typeof message === "string" ? { error: message } : message;
      return res.status(statusCode).json(body);
    }

    next();
  }

  // attach store reference so setConfig can call shutdown on removal
  rateLimitMiddleware._store = store;

  return rateLimitMiddleware;
}

module.exports = { createRateLimiter, MemoryStore };
