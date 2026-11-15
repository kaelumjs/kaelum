/** Shape of every error response Kaelum sends. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const DEFAULT_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  405: "METHOD_NOT_ALLOWED",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
  500: "INTERNAL_ERROR",
  503: "SERVICE_UNAVAILABLE",
};

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

export function defaultErrorCode(status: number): string {
  return DEFAULT_CODES[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "ERROR");
}

export function defaultErrorMessage(status: number): string {
  return DEFAULT_MESSAGES[status] ?? (status >= 500 ? "Internal Server Error" : "Error");
}

/** Build the JSON body for an error response. */
export function errorBody(status: number, message?: string, code?: string, details?: unknown): ErrorBody {
  const body: ErrorBody = {
    error: {
      code: code ?? defaultErrorCode(status),
      message: message ?? defaultErrorMessage(status),
    },
  };
  if (details !== undefined) body.error.details = details;
  return body;
}

export interface HttpErrorOptions {
  /** Machine-readable code. Defaults to one derived from the status. */
  code?: string;
  /** Extra data sent to the client under `error.details`. */
  details?: unknown;
  /** The underlying error, kept for logs and never sent to the client. */
  cause?: unknown;
}

/**
 * Throw from a handler or middleware to answer with a specific HTTP status.
 *
 * @example
 * throw new HttpError(404, "User not found");
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, message?: string, options: HttpErrorOptions = {}) {
    super(message ?? defaultErrorMessage(status), { cause: options.cause });
    this.name = "HttpError";
    this.status = status;
    this.code = options.code ?? defaultErrorCode(status);
    this.details = options.details;
  }

  toJSON(): ErrorBody {
    return errorBody(this.status, this.message, this.code, this.details);
  }
}
