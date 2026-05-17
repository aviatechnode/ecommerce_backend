import { ZodSchema, ZodError } from "zod";

/**
 * Generic validator for service layer
 * - throws clean error format
 */
export async function validateOrThrow<T>(
  schema: ZodSchema<T>,
  input: unknown
): Promise<T> {
  try {
    return schema.parse(input);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new Error(
        JSON.stringify({
          message: "Validation failed",
          errors: err.flatten(),
        })
      );
    }
    throw err;
  }
}

/**
 * Safe validator (no throw)
 */
export function validateSafe<T>(schema: ZodSchema<T>, input: unknown) {
  const result = schema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
      data: null,
    };
  }

  return {
    success: true,
    errors: null,
    data: result.data,
  };
}