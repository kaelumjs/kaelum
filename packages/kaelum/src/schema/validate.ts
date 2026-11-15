import { HttpError } from "../http-error.js";
import type { StandardSchemaV1 } from "./standard.js";

/** The parts of a request an endpoint can validate. */
export type ValidationSource = "params" | "query" | "body";

/** Schemas declared on an endpoint, keyed by the part of the request they validate. */
export type EndpointSchemas = Partial<Record<ValidationSource, StandardSchemaV1>>;

/** Validated values, present only for the sources that have a schema. */
export type ValidatedInput = Partial<Record<ValidationSource, unknown>>;

/** One validation problem, as sent to the client under `error.details.issues`. */
export interface ValidationIssue {
  /** Which part of the request failed. */
  source: ValidationSource;
  /** Dotted path to the field, e.g. `address.zip` or `items.0.name`. Empty for the value itself. */
  path: string;
  message: string;
}

// Checked in this order so the issues come out the same way every time.
const SOURCES: readonly ValidationSource[] = ["params", "query", "body"];

/**
 * Validate every source that has a schema and return the validated values.
 * All sources are checked before failing, so the client sees every problem at once.
 *
 * @throws HttpError 400 with code `VALIDATION_ERROR` when any schema rejects
 */
export async function validateInput(
  schemas: EndpointSchemas,
  input: Record<ValidationSource, unknown>
): Promise<ValidatedInput> {
  const validated: ValidatedInput = {};
  const issues: ValidationIssue[] = [];

  for (const source of SOURCES) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = await schema["~standard"].validate(input[source]);
    if (result.issues) {
      for (const issue of result.issues) {
        issues.push({ source, path: formatPath(issue.path), message: issue.message });
      }
    } else {
      validated[source] = result.value;
    }
  }

  if (issues.length > 0) {
    throw new HttpError(400, "Validation failed", { code: "VALIDATION_ERROR", details: { issues } });
  }

  return validated;
}

function formatPath(path: StandardSchemaV1.Issue["path"]): string {
  if (!path) return "";
  return path
    .map((segment) => String(typeof segment === "object" ? segment.key : segment))
    .join(".");
}
