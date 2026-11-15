// Kaelum's built-in schema builder: a small, dependency-free validator that
// implements Standard Schema, for apps that do not want a validation library.
//
//   const User = k.object({
//     name: k.string().min(2),
//     age: k.number().int().min(0).optional(),
//   });
//
// Schemas are immutable: every method returns a new schema.

import type { StandardSchemaV1 } from "./standard.js";

type Path = ReadonlyArray<PropertyKey>;

interface Issue {
  message: string;
  path: Path;
}

/** Returned by `parse` when the value is unusable; the reason is already in `issues`. */
const INVALID = Symbol("invalid");
type Invalid = typeof INVALID;

/** A check added by a builder method: returns a message when the value fails. */
type Check<T> = (value: T) => string | undefined;

/** The validated type of a `k` schema: `Infer<typeof User>`. */
export type Infer<S> = S extends KSchema<infer Output> ? Output : never;

/** Base of every `k` schema. */
export abstract class KSchema<Output> implements StandardSchemaV1<unknown, Output> {
  /** Checks run after the type check, in the order they were added. */
  protected checks: Check<Output>[] = [];

  // A getter on the prototype, not an instance field: builder methods copy the
  // instance, and a copied field would keep validating with the original schema.
  get "~standard"(): StandardSchemaV1.Props<unknown, Output> {
    return {
      version: 1,
      vendor: "kaelum",
      validate: (value) => {
        const issues: Issue[] = [];
        const output = this.parse(value, [], issues);
        return output === INVALID || issues.length > 0 ? { issues } : { value: output };
      },
    };
  }

  /** Check the type and convert the raw value. Push to `issues` and return INVALID on failure. */
  protected abstract parseType(value: unknown, path: Path, issues: Issue[]): Output | Invalid;

  /** @internal Validate `value`, recording problems in `issues`. */
  parse(value: unknown, path: Path, issues: Issue[]): Output | Invalid {
    if (value === undefined) {
      issues.push({ message: "Required", path });
      return INVALID;
    }

    const output = this.parseType(value, path, issues);
    if (output === INVALID) return INVALID;

    for (const check of this.checks) {
      const message = check(output);
      if (message !== undefined) issues.push({ message, path });
    }
    return output;
  }

  /** Shallow copy, so builder methods never change the schema they are called on. */
  protected clone(): this {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this) as this;
  }

  /** Copy of this schema with one more check. */
  protected withCheck(check: Check<Output>): this {
    const copy = this.clone();
    copy.checks = [...this.checks, check];
    return copy;
  }

  /**
   * Add a custom rule. Return `true` to accept; return `false` or a message to reject.
   *
   * @example
   * k.string().refine((value) => value !== "admin" || "That name is reserved")
   */
  refine(rule: (value: Output) => boolean | string, message = "Invalid value"): this {
    return this.withCheck((value) => {
      const result = rule(value);
      if (result === true) return undefined;
      return typeof result === "string" ? result : message;
    });
  }

  /** Accept a missing value (`undefined`). */
  optional(): KSchema<Output | undefined> {
    return new KOptional(this);
  }

  /** Accept `null`. */
  nullable(): KSchema<Output | null> {
    return new KNullable(this);
  }

  /** Use `value` when the field is missing. */
  default(value: Output): KSchema<Output> {
    return new KDefault(this, value);
  }
}

// The three wrappers below decide before the inner schema runs, so they
// override `parse` itself; `parseType` is never reached.

class KOptional<Output> extends KSchema<Output | undefined> {
  constructor(private readonly inner: KSchema<Output>) {
    super();
  }

  protected parseType(): Invalid {
    return INVALID;
  }

  override parse(value: unknown, path: Path, issues: Issue[]): Output | undefined | Invalid {
    return value === undefined ? undefined : this.inner.parse(value, path, issues);
  }
}

class KNullable<Output> extends KSchema<Output | null> {
  constructor(private readonly inner: KSchema<Output>) {
    super();
  }

  protected parseType(): Invalid {
    return INVALID;
  }

  override parse(value: unknown, path: Path, issues: Issue[]): Output | null | Invalid {
    return value === null ? null : this.inner.parse(value, path, issues);
  }
}

class KDefault<Output> extends KSchema<Output> {
  constructor(
    private readonly inner: KSchema<Output>,
    private readonly fallback: Output
  ) {
    super();
  }

  protected parseType(): Invalid {
    return INVALID;
  }

  override parse(value: unknown, path: Path, issues: Issue[]): Output | Invalid {
    return value === undefined ? this.fallback : this.inner.parse(value, path, issues);
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class KString extends KSchema<string> {
  private trimInput = false;

  protected parseType(value: unknown, path: Path, issues: Issue[]): string | Invalid {
    if (typeof value !== "string") {
      issues.push({ message: "Expected a string", path });
      return INVALID;
    }
    return this.trimInput ? value.trim() : value;
  }

  /** Remove surrounding whitespace before the other rules run. */
  trim(): this {
    const copy = this.clone();
    copy.trimInput = true;
    return copy;
  }

  min(length: number): this {
    return this.withCheck((value) =>
      value.length < length ? `Must be at least ${length} ${plural(length, "character")}` : undefined
    );
  }

  max(length: number): this {
    return this.withCheck((value) =>
      value.length > length ? `Must be at most ${length} ${plural(length, "character")}` : undefined
    );
  }

  pattern(regex: RegExp, message = "Invalid format"): this {
    return this.withCheck((value) => (regex.test(value) ? undefined : message));
  }

  email(): this {
    return this.pattern(EMAIL, "Must be a valid email");
  }

  uuid(): this {
    return this.pattern(UUID, "Must be a valid UUID");
  }

  url(): this {
    return this.withCheck((value) => (URL.canParse(value) ? undefined : "Must be a valid URL"));
  }
}

export class KNumber extends KSchema<number> {
  constructor(private readonly coerce = false) {
    super();
  }

  protected parseType(value: unknown, path: Path, issues: Issue[]): number | Invalid {
    let number = value;
    // Query strings and path params are always strings; coercion is opt-in for that case.
    if (this.coerce && typeof value === "string" && value.trim() !== "") number = Number(value);

    if (typeof number !== "number" || !Number.isFinite(number)) {
      issues.push({ message: "Expected a number", path });
      return INVALID;
    }
    return number;
  }

  min(minimum: number): this {
    return this.withCheck((value) => (value < minimum ? `Must be at least ${minimum}` : undefined));
  }

  max(maximum: number): this {
    return this.withCheck((value) => (value > maximum ? `Must be at most ${maximum}` : undefined));
  }

  int(): this {
    return this.withCheck((value) => (Number.isInteger(value) ? undefined : "Must be an integer"));
  }
}

export class KBoolean extends KSchema<boolean> {
  constructor(private readonly coerce = false) {
    super();
  }

  protected parseType(value: unknown, path: Path, issues: Issue[]): boolean | Invalid {
    if (typeof value === "boolean") return value;
    if (this.coerce && (value === "true" || value === "1")) return true;
    if (this.coerce && (value === "false" || value === "0")) return false;

    issues.push({ message: "Expected a boolean", path });
    return INVALID;
  }
}

export class KEnum<const Value extends string | number> extends KSchema<Value> {
  constructor(private readonly values: readonly Value[]) {
    super();
  }

  protected parseType(value: unknown, path: Path, issues: Issue[]): Value | Invalid {
    if (this.values.includes(value as Value)) return value as Value;

    issues.push({ message: `Must be one of: ${this.values.join(", ")}`, path });
    return INVALID;
  }
}

export class KUnknown extends KSchema<unknown> {
  protected parseType(value: unknown): unknown {
    return value;
  }
}

export class KArray<Item> extends KSchema<Item[]> {
  constructor(private readonly item: KSchema<Item>) {
    super();
  }

  protected parseType(value: unknown, path: Path, issues: Issue[]): Item[] | Invalid {
    if (!Array.isArray(value)) {
      issues.push({ message: "Expected an array", path });
      return INVALID;
    }

    const output: Item[] = [];
    let valid = true;
    value.forEach((entry, index) => {
      const parsed = this.item.parse(entry, [...path, index], issues);
      if (parsed === INVALID) valid = false;
      else output.push(parsed);
    });
    return valid ? output : INVALID;
  }

  min(length: number): this {
    return this.withCheck((value) =>
      value.length < length ? `Must have at least ${length} ${plural(length, "item")}` : undefined
    );
  }

  max(length: number): this {
    return this.withCheck((value) =>
      value.length > length ? `Must have at most ${length} ${plural(length, "item")}` : undefined
    );
  }
}

// `any` rather than `unknown`: schemas are not covariant in their output.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Shape = Record<string, KSchema<any>>;
type Simplify<T> = { [K in keyof T]: T[K] } & {};
type OptionalKeys<S extends Shape> = {
  [K in keyof S]: undefined extends Infer<S[K]> ? K : never;
}[keyof S];

/** Output of `k.object`: fields that accept `undefined` become optional keys. */
export type ObjectOutput<S extends Shape> = Simplify<
  { [K in Exclude<keyof S, OptionalKeys<S>>]: Infer<S[K]> } & { [K in OptionalKeys<S>]?: Infer<S[K]> }
>;

export class KObject<S extends Shape> extends KSchema<ObjectOutput<S>> {
  constructor(private readonly shape: S) {
    super();
  }

  protected parseType(value: unknown, path: Path, issues: Issue[]): ObjectOutput<S> | Invalid {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      issues.push({ message: "Expected an object", path });
      return INVALID;
    }

    // Only declared keys are copied, so unknown input never reaches the handler.
    const output: Record<string, unknown> = {};
    let valid = true;
    for (const [key, schema] of Object.entries(this.shape)) {
      const parsed = schema.parse((value as Record<string, unknown>)[key], [...path, key], issues);
      if (parsed === INVALID) valid = false;
      else if (parsed !== undefined) output[key] = parsed;
    }
    return valid ? (output as ObjectOutput<S>) : INVALID;
  }
}

function plural(count: number, noun: string): string {
  return count === 1 ? noun : `${noun}s`;
}

/**
 * Kaelum's built-in schema builder. The schemas implement Standard Schema, so
 * they work anywhere a Zod or Valibot schema does.
 */
export const k = {
  string: () => new KString(),
  number: () => new KNumber(),
  boolean: () => new KBoolean(),
  /** One of a fixed list of strings or numbers. */
  enum: <const Value extends string | number>(values: readonly Value[]) => new KEnum(values),
  array: <Item>(item: KSchema<Item>) => new KArray(item),
  /** An object with the given fields. Keys that are not declared are dropped. */
  object: <S extends Shape>(shape: S) => new KObject(shape),
  /** Accepts anything except a missing value. */
  unknown: () => new KUnknown(),
  /** For query strings and path params, which always arrive as strings. */
  coerce: {
    /** Accepts a number or a numeric string. */
    number: () => new KNumber(true),
    /** Accepts a boolean or the strings "true", "false", "1", "0". */
    boolean: () => new KBoolean(true),
  },
};
