export type LogLevel = "debug" | "info" | "warn" | "error";

/** One log record, as handed to the log sink. */
export interface LogEntry {
  level: LogLevel;
  message: string;
  time: Date;
  /** Set for records written through `c.log`. */
  requestId?: string;
  /** Extra fields passed by the caller. */
  data?: Record<string, unknown>;
}

/** Where log records go. Replace it to send logs to pino, a file, a service... */
export type LogSink = (entry: LogEntry) => void;

/** The logger behind `app.log` and `c.log`. */
export interface Logger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

const LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

/** Build a logger that writes to `sink`, stamping every record with `requestId` when given. */
export function createLogger(sink: LogSink, requestId?: string): Logger {
  const logger = {} as Logger;

  for (const level of LEVELS) {
    logger[level] = (message, data) => {
      const entry: LogEntry = { level, message, time: new Date() };
      if (requestId !== undefined) entry.requestId = requestId;
      if (data !== undefined) entry.data = data;
      sink(entry);
    };
  }

  return logger;
}

/**
 * The default sink: one JSON object per line in production, so log collectors
 * can parse it; plain console output everywhere else.
 */
export function defaultLogSink(env: string | undefined = process.env.NODE_ENV): LogSink {
  return env === "production" ? jsonSink : consoleSink;
}

function consoleSink({ level, message, data }: LogEntry): void {
  if (data === undefined) console[level](message);
  else console[level](message, data);
}

function jsonSink({ level, message, time, requestId, data }: LogEntry): void {
  const record = { level, time: time.toISOString(), requestId, message, ...data };
  const line = JSON.stringify(record, (_key, value: unknown) =>
    value instanceof Error ? { name: value.name, message: value.message, stack: value.stack } : value
  );
  (level === "error" || level === "warn" ? process.stderr : process.stdout).write(line + "\n");
}
