import { describe, expect, it } from 'vitest';
import {
  getVisibleFields,
  isEmptyValue,
  isFieldVisible,
  parseSchema,
  requiredMessage,
} from '../parser';
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
    { id: 'newsletter', label: 'Newsletter', type: 'checkbox' },
    {
      id: 'contact',
      label: 'Preferred contact',
      type: 'radio',
      options: [
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' },
      ],
      showIf: { field: 'plan', equals: 'pro' },
    },
  ],
};

describe('parseSchema', () => {
  it('accepts valid values and coerces numeric strings', () => {
    const result = parseSchema(schema).safeParse({
      name: 'Ada',
      age: '42',
      plan: 'pro',
      newsletter: true,
      contact: 'email',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(42);
      expect(result.data.name).toBe('Ada');
    }
  });

  it('rejects a missing required text field', () => {
    const result = parseSchema(schema).safeParse({ plan: 'free' });
    expect(result.success).toBe(false);
  });

  it('treats an empty string as unset for optional numbers', () => {
    const result = parseSchema(schema).safeParse({ name: 'Ada', age: '', plan: 'free' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBeUndefined();
    }
  });

  it('rejects non-numeric number input', () => {
    const result = parseSchema(schema).safeParse({ name: 'Ada', age: 'abc', plan: 'free' });
    expect(result.success).toBe(false);
  });

  it('enforces min/max on numbers', () => {
    const tooBig = parseSchema(schema).safeParse({ name: 'Ada', age: 200, plan: 'free' });
    expect(tooBig.success).toBe(false);
    const negative = parseSchema(schema).safeParse({ name: 'Ada', age: -1, plan: 'free' });
    expect(negative.success).toBe(false);
  });

  it('rejects enum values outside the option list', () => {
    const result = parseSchema(schema).safeParse({ name: 'Ada', plan: 'enterprise' });
    expect(result.success).toBe(false);
  });

  it('throws when a select field has no options', () => {
    expect(() =>
      parseSchema({ fields: [{ id: 'x', label: 'X', type: 'select', required: true }] }),
    ).toThrow(/at least one option/);
  });

  it('throws on duplicate field ids', () => {
    expect(() =>
      parseSchema({
        fields: [
          { id: 'a', label: 'A', type: 'text' },
          { id: 'a', label: 'A again', type: 'text' },
        ],
      }),
    ).toThrow(/Duplicate field id/);
  });
});

describe('isFieldVisible / getVisibleFields', () => {
  const contact = schema.fields[4];

  it('is visible by default when no showIf is set', () => {
    expect(isFieldVisible(schema.fields[0], {})).toBe(true);
  });

  it('honours the equals clause', () => {
    expect(isFieldVisible(contact, { plan: 'pro' })).toBe(true);
    expect(isFieldVisible(contact, { plan: 'free' })).toBe(false);
  });

  it('honours the notEquals clause', () => {
    const field = {
      id: 'x',
      label: 'X',
      type: 'text' as const,
      showIf: { field: 'plan', notEquals: 'free' },
    };
    expect(isFieldVisible(field, { plan: 'free' })).toBe(false);
    expect(isFieldVisible(field, { plan: 'pro' })).toBe(true);
  });

  it('honours the in clause', () => {
    const field = {
      id: 'x',
      label: 'X',
      type: 'text' as const,
      showIf: { field: 'plan', in: ['pro', 'team'] },
    };
    expect(isFieldVisible(field, { plan: 'pro' })).toBe(true);
    expect(isFieldVisible(field, { plan: 'free' })).toBe(false);
  });

  it('filters fields via getVisibleFields', () => {
    expect(getVisibleFields(schema, { plan: 'free' }).map((f) => f.id)).toEqual([
      'name',
      'age',
      'plan',
      'newsletter',
    ]);
    expect(getVisibleFields(schema, { plan: 'pro' }).map((f) => f.id)).toContain('contact');
  });
});

describe('helpers', () => {
  it('isEmptyValue treats only genuinely empty values as empty', () => {
    expect(isEmptyValue('')).toBe(true);
    expect(isEmptyValue('   ')).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(NaN)).toBe(true);
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
    expect(isEmptyValue('x')).toBe(false);
  });

  it('requiredMessage falls back to the label and honours overrides', () => {
    expect(requiredMessage({ id: 'n', label: 'Name', type: 'text', required: true })).toBe(
      'Name is required',
    );
    expect(
      requiredMessage({ id: 'n', label: 'Name', type: 'text', requiredMessage: 'Pick a name' }),
    ).toBe('Pick a name');
  });
});
