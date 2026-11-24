import { z } from 'zod';
import type { FieldSchema, FormSchema } from './types';

/** Zod object schema produced by {@link parseSchema}, keyed by field id. */
export type ParsedFormSchema = z.ZodObject<Record<string, z.ZodTypeAny>>;

/**
 * Returns true when a raw form value counts as "empty" for required checks.
 * Empty/whitespace-only strings, null, undefined and NaN are empty; 0 and false are not.
 */
export function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return Number.isNaN(value);
  return false;
}

/** The message shown when a required field is empty. */
export function requiredMessage(field: FieldSchema): string {
  return field.requiredMessage ?? `${field.label} is required`;
}

/** Builds the zod schema for a single field, with coercion and required handling. */
function buildFieldSchema(field: FieldSchema): z.ZodTypeAny {
  switch (field.type) {
    case 'text': {
      const text = z.string({ error: `${field.label} must be text` });
      return field.required ? text.min(1, requiredMessage(field)) : text.optional();
    }
    case 'number': {
      let num = z.coerce.number({ error: `${field.label} must be a number` });
      if (field.min !== undefined) {
        num = num.min(field.min, `${field.label} must be at least ${field.min}`);
      }
      if (field.max !== undefined) {
        num = num.max(field.max, `${field.label} must be at most ${field.max}`);
      }
      // Empty input becomes undefined so optional numbers can stay unset
      // and required numbers fail with a clear message.
      return z.preprocess(
        (value) => (isEmptyValue(value) ? undefined : value),
        field.required ? num : num.optional(),
      );
    }
    case 'select':
    case 'radio': {
      const values = (field.options ?? []).map((option) => option.value);
      if (values.length === 0) {
        throw new Error(`Field "${field.id}" (${field.type}) must define at least one option`);
      }
      const enumSchema = z.enum(values as [string, ...string[]], {
        error: (issue) =>
          issue.code === 'invalid_value'
            ? `${field.label} must be one of: ${values.join(', ')}`
            : requiredMessage(field),
      });
      return field.required ? enumSchema : enumSchema.optional();
    }
    case 'checkbox': {
      return field.required
        ? z.literal(true, { error: requiredMessage(field) })
        : z.boolean().optional();
    }
  }
}

/**
 * Compiles a declarative {@link FormSchema} into a zod object schema keyed by field id.
 * Throws on duplicate field ids or select/radio fields without options.
 */
export function parseSchema(schema: FormSchema): ParsedFormSchema {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of schema.fields) {
    if (Object.prototype.hasOwnProperty.call(shape, field.id)) {
      throw new Error(`Duplicate field id "${field.id}" in schema`);
    }
    shape[field.id] = buildFieldSchema(field);
  }
  return z.object(shape);
}

/**
 * Evaluates a field's `showIf` condition against the current values.
 * Fields without a condition are always visible.
 */
export function isFieldVisible(field: FieldSchema, values: Record<string, unknown>): boolean {
  const condition = field.showIf;
  if (!condition) return true;
  const value = values[condition.field];
  if (condition.equals !== undefined && value !== condition.equals) return false;
  if (condition.notEquals !== undefined && value === condition.notEquals) return false;
  if (condition.in !== undefined && !condition.in.some((item) => item === value)) return false;
  return true;
}

/** Returns the subset of fields visible for the given values, preserving order. */
export function getVisibleFields(
  schema: FormSchema,
  values: Record<string, unknown>,
): FieldSchema[] {
  return schema.fields.filter((field) => isFieldVisible(field, values));
}
