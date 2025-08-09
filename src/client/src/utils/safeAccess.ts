// src/utils/safe.ts
import { ApiResponse } from "../types/common/ApiResponse";

export const isDefined = <T>(v: T | null | undefined): v is NonNullable<T> =>
  v !== null && v !== undefined;

export const withDefault = <T>(v: T | null | undefined, d: NonNullable<T>): NonNullable<T> =>
  (v ?? d) as NonNullable<T>;

export function assertDefined<T>(v: T | null | undefined, msg = "Value is null/undefined"):
  asserts v is NonNullable<T> {
  if (v === null || v === undefined) throw new Error(msg);
}

export const isApiResponse = <T = unknown>(x: unknown): x is ApiResponse<T> =>
  !!x && typeof x === "object" && "data" in (x as any) && "success" in (x as any);

/**
 * Kompatibilitäts-Helper: akzeptiert ApiResponse<T> ODER nacktes T
 * und liefert immer T zurück. Hilft beim Übergang/Refactor.
 */
export function unwrap<T>(value: ApiResponse<T> | T): T {
  if (isApiResponse<T>(value)) return (value as ApiResponse<T>).data as T;
  return value as T;
}

/** kleine Helfer die man wirklich oft braucht */
export const isString = (v: unknown): v is string => typeof v === "string";
export const isNonEmptyString = (v: unknown): v is string => isString(v) && v.trim().length > 0;
