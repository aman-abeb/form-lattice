import { useState } from 'react';
import { validateValues } from './lib';
import type { FormSchema, ValidationResult } from './lib';

const demoSchema: FormSchema = {
  title: 'FormLattice',
  description:
    'Schema-driven forms with zod validation. Edit the values JSON below and press Validate to run the core validator.',
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
    { id: 'newsletter', label: 'Subscribe to the newsletter', type: 'checkbox' },
  ],
};

const initialValues = JSON.stringify(
  { name: '', age: '42', plan: 'free', newsletter: true },
  null,
  2,
);

export default function App() {
  const [raw, setRaw] = useState(initialValues);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleValidate = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setResult({ success: false, errors: { _form: 'Input is not valid JSON.' }, values: {} });
      return;
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      setResult({
        success: false,
        errors: { _form: 'Values must be a JSON object keyed by field id.' },
        values: {},
      });
      return;
    }
    setResult(validateValues(demoSchema, parsed as Record<string, unknown>));
  };

  return (
    <main className="app">
      <h1>{demoSchema.title}</h1>
      <p>{demoSchema.description}</p>
      <label className="field">
        <span>Values (JSON)</span>
        <textarea
          rows={8}
          value={raw}
          spellCheck={false}
          onChange={(event) => setRaw(event.target.value)}
        />
      </label>
      <button type="button" onClick={handleValidate}>
        Validate
      </button>
      {result && (
        <pre className="output" data-testid="validation-output">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
