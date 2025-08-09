/**
 * Utility functions for safe property access and null/undefined handling
 */

/**
 * Safely get a nested property from an object
 * @param obj The object to access
 * @param path The property path (e.g., 'user.profile.name')
 * @param defaultValue The default value if property is null/undefined
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    result = result?.[key];
    if (result === undefined || result === null) {
      return defaultValue;
    }
  }
  
  return result ?? defaultValue;
}

/**
 * Check if a value is null or undefined
 */
export function isNullOrUndefined(value: any): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Ensure a value is an array
 * @param value The value to check
 * @param defaultValue Default array if value is not an array
 */
export function ensureArray<T>(
  value: T[] | null | undefined,
  defaultValue: T[] = []
): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return defaultValue;
}

/**
 * Ensure a value is a string
 * @param value The value to check
 * @param defaultValue Default string if value is not a string
 */
export function ensureString(
  value: any,
  defaultValue: string = ''
): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value?.toString) {
    return value.toString();
  }
  return defaultValue;
}

/**
 * Ensure a value is a number
 * @param value The value to check
 * @param defaultValue Default number if value is not a number
 */
export function ensureNumber(
  value: any,
  defaultValue: number = 0
): number {
  const num = Number(value);
  if (!isNaN(num)) {
    return num;
  }
  return defaultValue;
}

/**
 * Ensure a value is a boolean
 * @param value The value to check
 * @param defaultValue Default boolean if value is not a boolean
 */
export function ensureBoolean(
  value: any,
  defaultValue: boolean = false
): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return defaultValue;
}

/**
 * Return a value with a default if null/undefined
 * @param value The value to check
 * @param defaultValue The default value
 */
export function withDefault<T>(
  value: T | null | undefined,
  defaultValue: T
): T {
  return value ?? defaultValue;
}

/**
 * Safely access array element by index
 * @param array The array to access
 * @param index The index to access
 * @param defaultValue Default value if index is out of bounds
 */
export function safeArrayAccess<T>(
  array: T[] | null | undefined,
  index: number,
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return defaultValue;
  }
  return array[index];
}

/**
 * Safely call a function with error handling
 * @param fn The function to call
 * @param defaultValue Default value if function throws
 */
export function safeTry<T>(
  fn: () => T,
  defaultValue: T
): T {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

/**
 * Safely parse JSON with fallback
 * @param json The JSON string to parse
 * @param defaultValue Default value if parsing fails
 */
export function safeJsonParse<T>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * Create a safe wrapper for an object with default values
 */
export function createSafeObject<T extends Record<string, any>>(
  obj: Partial<T> | null | undefined,
  defaults: T
): T {
  if (!obj) {
    return { ...defaults };
  }
  
  return {
    ...defaults,
    ...obj
  };
}

/**
 * Type guard to check if object has a property
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safely map over an array with null/undefined handling
 */
export function safeMap<T, R>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => R,
  defaultValue: R[] = []
): R[] {
  if (!Array.isArray(array)) {
    return defaultValue;
  }
  
  try {
    return array.map(mapper);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely filter an array with null/undefined handling
 */
export function safeFilter<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  defaultValue: T[] = []
): T[] {
  if (!Array.isArray(array)) {
    return defaultValue;
  }
  
  try {
    return array.filter(predicate);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely find an item in an array
 */
export function safeFind<T>(
  array: T[] | null | undefined,
  predicate: (item: T, index: number) => boolean,
  defaultValue?: T
): T | undefined {
  if (!Array.isArray(array)) {
    return defaultValue;
  }
  
  try {
    return array.find(predicate) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}