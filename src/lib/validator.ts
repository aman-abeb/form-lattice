import { isEmptyValue, parseSchema, requiredMessage } from './parser';
import type { FormSchema } from './types';

/** Outcome of validating a values object against a {@link FormSchema}. */
export interface ValidationResult {
  /** True when there are no field errors. */
  success: boolean;
  /** Per-field error messages keyed by field id ("_form" for form-level errors). */
  errors: Record<string, string>;
  /** Parsed/coerced values on success, the raw input otherwise. */
  values: Record<string, unknown>;
}

/**
 * Validates raw form values against a schema. Required fields with empty values
 * always report the field's required message; all other rules come from the
 * zod schema built by {@link parseSchema}.
 */
export function validateValues(
  schema: FormSchema,
  rawValues: Record<string, unknown>,
): ValidationResult {
  const parsed = parseSchema(schema).safeParse(rawValues);
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
      if (!errors[key]) {
        errors[key] = issue.message;
      }
    }
  }
  for (const field of schema.fields) {
    if (field.type !== 'checkbox' && field.required && isEmptyValue(rawValues[field.id])) {
      errors[field.id] = requiredMessage(field);
    }
  }
  const success = Object.keys(errors).length === 0;
  return {
    success,
    errors,
    values: success && parsed.success ? (parsed.data as Record<string, unknown>) : rawValues,
  };
}

/**
 * Validates a single field in the context of the whole values object.
 * Returns the error message, or null when the field is valid or unknown.
 */
export function validateField(
  schema: FormSchema,
  fieldId: string,
  values: Record<string, unknown>,
): string | null {
  const field = schema.fields.find((candidate) => candidate.id === fieldId);
  if (!field) return null;
  const result = validateValues({ ...schema, fields: [field] }, { [fieldId]: values[fieldId] });
  return result.errors[fieldId] ?? null;
}
