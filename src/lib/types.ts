/** Field widget types the form engine knows how to render. */
export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'radio';

/** A single selectable option for `select` and `radio` fields. */
export interface SelectOption {
  /** Value stored in the form values object. */
  value: string;
  /** Human-readable label shown in the UI. */
  label: string;
}

/**
 * Conditional visibility rule evaluated against the current form values.
 * All provided clauses must pass for the field to be visible.
 */
export interface ShowIfCondition {
  /** Id of the field whose value drives visibility. */
  field: string;
  /** Visible only when the referenced value strictly equals this. */
  equals?: unknown;
  /** Visible only when the referenced value does not equal this. */
  notEquals?: unknown;
  /** Visible only when the referenced value is one of these. */
  in?: readonly unknown[];
}

/** Declarative, JSON-serializable definition of a single form field. */
export interface FieldSchema {
  /** Unique field id; also the key in the values object. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Widget type to render. */
  type: FieldType;
  /** Whether the field must have a non-empty value. */
  required?: boolean;
  /** Placeholder text for text inputs. */
  placeholder?: string;
  /** Helper text rendered under the field. */
  helpText?: string;
  /** Options for `select` and `radio` fields. */
  options?: SelectOption[];
  /** Id of a custom widget from the widget registry (e.g. "star-rating"). */
  widget?: string;
  /** Conditional visibility rule. */
  showIf?: ShowIfCondition;
  /** Initial value used when the form mounts. */
  default?: unknown;
  /** Custom message shown when a required field is empty. */
  requiredMessage?: string;
  /** Minimum value for `number` fields. */
  min?: number;
  /** Maximum value for `number` fields. */
  max?: number;
}

/** Declarative, JSON-serializable description of a whole form. */
export interface FormSchema {
  /** Form title. */
  title?: string;
  /** Form description rendered above the fields. */
  description?: string;
  /** Ordered list of field definitions. */
  fields: FieldSchema[];
}
