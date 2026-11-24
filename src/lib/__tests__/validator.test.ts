import { describe, expect, it } from 'vitest';
import { validateField, validateValues } from '../validator';
import type { FormSchema } from '../types';

const schema: FormSchema = {
  title: 'Signup',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'age', label: 'Age', type: 'number', min: 0, max: 130 },
    {
      id: 'plan',
      label: 'Plan',
      type: 'select',
      required: true,
      options: [
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Pro' },
      ],
    },
    { id: 'terms', label: 'Accept terms', type: 'checkbox', required: true },
  ],
};

describe('validateValues', () => {
  it('returns success with parsed values for valid input', () => {
    const result = validateValues(schema, { name: 'Ada', age: '42', plan: 'pro', terms: true });
    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.values).toMatchObject({ name: 'Ada', age: 42, plan: 'pro', terms: true });
  });

  it('reports a required message for missing fields', () => {
    const result = validateValues(schema, { plan: 'free', terms: true });
    expect(result.success).toBe(false);
    expect(result.errors.name).toBe('Name is required');
  });

  it('treats blank strings as missing required values', () => {
    const result = validateValues(schema, { name: '   ', plan: 'free', terms: true });
    expect(result.success).toBe(false);
    expect(result.errors.name).toBe('Name is required');
  });

  it('uses a custom requiredMessage when provided', () => {
    const custom: FormSchema = {
      fields: [
        { id: 'email', label: 'Email', type: 'text', required: true, requiredMessage: 'Email is mandatory' },
      ],
    };
    const result = validateValues(custom, {});
    expect(result.success).toBe(false);
    expect(result.errors.email).toBe('Email is mandatory');
  });

  it('reports invalid enum selections', () => {
    const result = validateValues(schema, { name: 'Ada', plan: 'enterprise', terms: true });
    expect(result.success).toBe(false);
    expect(result.errors.plan).toBe('Plan must be one of: free, pro');
  });

  it('requires a required checkbox to be checked', () => {
    const result = validateValues(schema, { name: 'Ada', plan: 'free', terms: false });
    expect(result.success).toBe(false);
    expect(result.errors.terms).toBe('Accept terms is required');
  });

  it('rejects out-of-range numbers with the min/max message', () => {
    const result = validateValues(schema, { name: 'Ada', age: '999', plan: 'free', terms: true });
    expect(result.success).toBe(false);
    expect(result.errors.age).toBe('Age must be at most 130');
  });

  it('returns the raw values when validation fails', () => {
    const raw = { name: '', plan: 'free', terms: true };
    const result = validateValues(schema, raw);
    expect(result.success).toBe(false);
    expect(result.values).toEqual(raw);
  });
});

describe('validateField', () => {
  it('returns the error message for an invalid field', () => {
    expect(validateField(schema, 'age', { age: 'abc' })).toBe('Age must be a number');
  });

  it('returns null for a valid field', () => {
    expect(validateField(schema, 'age', { age: '30' })).toBeNull();
  });

  it('returns null for an unknown field id', () => {
    expect(validateField(schema, 'nope', {})).toBeNull();
  });
});
