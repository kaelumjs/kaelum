// core/validate.js
// Kaelum - Lightweight Body Validator
//
// Zero-dependency middleware factory that validates body, query, and params
// against a schema. Returns 400 with structured errors on failure.
//
// Usage (via subpath export):
//   const { validate } = require('kaelum/validate');
//
//   app.addRoute('/users', {
//     post: [
//       validate({
//         body: {
//           name:  { type: 'string', required: true, min: 2, max: 50 },
//           email: { type: 'string', required: true, pattern: 'email' },
//           age:   { type: 'number', min: 0, max: 120 },
//         },
//         query: {
//           page: { type: 'number', min: 1 },
//         },
//       }),
//       createUser,
//     ],
//   });

"use strict";

// ---------------------------------------------------------------------------
// Pattern presets
// ---------------------------------------------------------------------------
const PATTERN_PRESETS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  alphanumeric: /^[a-z0-9]+$/i,
};

// ---------------------------------------------------------------------------
// Coercion helpers (for query / params — always strings)
// ---------------------------------------------------------------------------
function coerceValue(value, type) {
  if (type === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  if (type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Single-field validator
// Returns an array of error messages (empty = valid)
// ---------------------------------------------------------------------------
function validateField(fieldPath, value, rule, source) {
  const errors = [];
  const isCoercible = source === "query" || source === "params";

  // Coerce if coming from query/params
  if (isCoercible && rule.type && value !== undefined) {
    value = coerceValue(value, rule.type);
  }

  // required
  if (rule.required && (value === undefined || value === null || value === "")) {
    errors.push({ field: fieldPath, message: "Required field missing" });
    // No point running further checks on a missing value
    return errors;
  }

  // If not present and not required — skip remaining rules
  if (value === undefined || value === null) {
    return errors;
  }

  // type check
  if (rule.type) {
    let typeOk = false;
    switch (rule.type) {
      case "string":
        typeOk = typeof value === "string";
        break;
      case "number":
        typeOk = typeof value === "number" && !Number.isNaN(value);
        break;
      case "boolean":
        typeOk = typeof value === "boolean";
        break;
      case "array":
        typeOk = Array.isArray(value);
        break;
      case "object":
        typeOk = typeof value === "object" && !Array.isArray(value);
        break;
      default:
        typeOk = true; // unknown type — skip
    }
    if (!typeOk) {
      errors.push({
        field: fieldPath,
        message: `Must be of type: ${rule.type}`,
      });
      // Type mismatch — min/max/pattern checks would be nonsensical
      return errors;
    }
  }

  // min
  if (rule.min !== undefined) {
    if (typeof value === "number" && value < rule.min) {
      errors.push({
        field: fieldPath,
        message: `Must be at least ${rule.min}`,
      });
    } else if (typeof value === "string" && value.length < rule.min) {
      errors.push({
        field: fieldPath,
        message: `Must be at least ${rule.min} characters`,
      });
    } else if (Array.isArray(value) && value.length < rule.min) {
      errors.push({
        field: fieldPath,
        message: `Must have at least ${rule.min} items`,
      });
    }
  }

  // max
  if (rule.max !== undefined) {
    if (typeof value === "number" && value > rule.max) {
      errors.push({
        field: fieldPath,
        message: `Must be at most ${rule.max}`,
      });
    } else if (typeof value === "string" && value.length > rule.max) {
      errors.push({
        field: fieldPath,
        message: `Must be at most ${rule.max} characters`,
      });
    } else if (Array.isArray(value) && value.length > rule.max) {
      errors.push({
        field: fieldPath,
        message: `Must have at most ${rule.max} items`,
      });
    }
  }

  // pattern
  if (rule.pattern !== undefined && typeof value === "string") {
    let regex;
    if (typeof rule.pattern === "string") {
      regex = PATTERN_PRESETS[rule.pattern];
      if (!regex) {
        // Treat as a raw regex string
        regex = new RegExp(rule.pattern);
      }
    } else if (rule.pattern instanceof RegExp) {
      regex = rule.pattern;
    }
    if (regex && !regex.test(value)) {
      const patternLabel =
        typeof rule.pattern === "string" ? rule.pattern : rule.pattern.toString();
      errors.push({
        field: fieldPath,
        message: `Must match pattern: ${patternLabel}`,
      });
    }
  }

  // custom validator
  if (typeof rule.custom === "function") {
    const result = rule.custom(value);
    if (result !== true) {
      errors.push({
        field: fieldPath,
        message: typeof result === "string" ? result : "Custom validation failed",
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Schema validator — runs across all fields in one target (body/query/params)
// ---------------------------------------------------------------------------
function validateTarget(targetName, data, schema) {
  const errors = [];
  if (!schema || typeof schema !== "object") return errors;

  for (const [fieldName, rule] of Object.entries(schema)) {
    const value = data ? data[fieldName] : undefined;
    const fieldErrors = validateField(
      `${targetName}.${fieldName}`,
      value,
      rule,
      targetName
    );
    errors.push(...fieldErrors);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// validate() — middleware factory
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ValidateFieldRule
 * @property {'string'|'number'|'boolean'|'array'|'object'} [type]
 * @property {boolean} [required]
 * @property {number} [min]
 * @property {number} [max]
 * @property {string|RegExp} [pattern]  preset ('email','url','uuid','alphanumeric') or RegExp
 * @property {(value: any) => true|string} [custom]
 */

/**
 * @typedef {Object} ValidateSchema
 * @property {Record<string, ValidateFieldRule>} [body]
 * @property {Record<string, ValidateFieldRule>} [query]
 * @property {Record<string, ValidateFieldRule>} [params]
 */

/**
 * Returns an Express middleware that validates the request against the schema.
 * On failure responds 400 with { error, fields }.
 * On success calls next().
 *
 * @param {ValidateSchema} schema
 * @returns {import('express').RequestHandler}
 */
function validate(schema = {}) {
  if (!schema || typeof schema !== "object") {
    throw new Error("validate: schema must be a plain object");
  }

  return function validateMiddleware(req, res, next) {
    const errors = [
      ...validateTarget("body", req.body, schema.body),
      ...validateTarget("query", req.query, schema.query),
      ...validateTarget("params", req.params, schema.params),
    ];

    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        fields: errors,
      });
    }

    next();
  };
}

module.exports = { validate, PATTERN_PRESETS };
