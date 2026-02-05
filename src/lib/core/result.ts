/**
 * Result type for error handling without exceptions
 * Based on functional programming pattern for explicit error handling
 */

export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  readonly success = true;
  readonly failure = false;

  constructor(public readonly value: T) {}

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is never {
    return false;
  }
}

export class Failure<E> {
  readonly success = false;
  readonly failure = true;

  constructor(public readonly error: E) {}

  isSuccess(): this is never {
    return false;
  }

  isFailure(): this is Failure<E> {
    return true;
  }
}

/**
 * Helper functions to create Result types
 */
export const ok = <T>(value: T): Success<T> => new Success(value);
export const fail = <E>(error: E): Failure<E> => new Failure(error);

/**
 * Unwrap a Result or throw if it's a failure
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (result.isSuccess()) {
    return result.value;
  }
  throw result.error;
};

/**
 * Map a Result's success value to a new value
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (result.isSuccess()) {
    return ok(fn(result.value));
  }
  return result as unknown as Failure<E>;
};

/**
 * Async version of map
 */
export const mapAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>
): Promise<Result<U, E>> => {
  if (result.isSuccess()) {
    return ok(await fn(result.value));
  }
  return result as unknown as Failure<E>;
};
