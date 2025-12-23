import { z } from 'zod';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * UUID Schema - validates UUID format
 */
export const UuidSchema = z
  .string({ message: 'UUID must be a string' })
  .refine((val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val), {
    message: 'Invalid UUID format',
  });

/**
 * ISO DateTime Schema - validates ISO 8601 date strings
 */
export const IsoDateTimeSchema = z
  .string({ message: 'DateTime must be a string' })
  .refine(
    (val) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) || !Number.isNaN(Date.parse(val)),
    {
      message: 'Invalid ISO datetime format',
    }
  );

/**
 * Email Schema - validates email format
 */
export const EmailSchema = z
  .string({ message: 'Email must be a string' })
  .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: 'Invalid email format' });

/**
 * Non-empty String Schema
 */
export const NonEmptyStringSchema = z.string().min(1);

// ============================================
// API RESPONSE SCHEMAS
// ============================================

/**
 * Base API Response Schema
 */
export const BaseResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
  traceId: z.string().optional(),
});

/**
 * Success Response Schema
 */
export function SuccessResponseSchema<T extends z.ZodType>(
  dataSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  message: z.ZodOptional<z.ZodString>;
  timestamp: z.ZodOptional<z.ZodString>;
  traceId: z.ZodOptional<z.ZodString>;
  data: T;
}> {
  return BaseResponseSchema.extend({
    success: z.literal(true),
    data: dataSchema,
  });
}

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = BaseResponseSchema.extend({
  success: z.literal(false),
  errors: z.array(z.string()),
  errorCode: z.string().optional(),
  statusCode: z.number().optional(),
});

/**
 * Paged Response Schema
 */
export function PagedResponseSchema<T extends z.ZodType>(
  itemSchema: T
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  message: z.ZodOptional<z.ZodString>;
  timestamp: z.ZodOptional<z.ZodString>;
  traceId: z.ZodOptional<z.ZodString>;
  data: z.ZodArray<T>;
  pageNumber: z.ZodNumber;
  pageSize: z.ZodNumber;
  totalPages: z.ZodNumber;
  totalRecords: z.ZodNumber;
  hasNextPage: z.ZodBoolean;
  hasPreviousPage: z.ZodBoolean;
}> {
  return BaseResponseSchema.extend({
    success: z.literal(true),
    data: z.array(itemSchema),
    pageNumber: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
    totalRecords: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  });
}

/**
 * API Response Schema (Union of Success and Error)
 */
export function ApiResponseSchema<T extends z.ZodType>(
  dataSchema: T
): z.ZodUnion<[ReturnType<typeof SuccessResponseSchema<T>>, typeof ErrorResponseSchema]> {
  return z.union([SuccessResponseSchema(dataSchema), ErrorResponseSchema]);
}

// ============================================
// VALIDATION HELPERS
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

/**
 * Safely parse data with a Zod schema
 */
export function safeValidate<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate and throw on failure (use in non-critical paths)
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validate API response with logging
 */
export function validateApiResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context: string
): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  console.warn(`[Validation] ${context}: Invalid data`, {
    errors: result.error.issues.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    })),
    data,
  });

  return null;
}
