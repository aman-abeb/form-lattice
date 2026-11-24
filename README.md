# FormLattice

<!-- builder:badges:start -->
[![CI](https://github.com/aman-abeb/form-lattice/actions/workflows/ci.yml/badge.svg)](https://github.com/aman-abeb/form-lattice/actions/workflows/ci.yml) ![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/react-61DAFB?logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/vite-646CFF?logo=vite&logoColor=white) ![License: MIT](https://img.shields.io/badge/license-MIT-green)
<!-- builder:badges:end -->


Schema-driven React form library: describe a form as plain JSON and get a zod-validated renderer with conditional fields, custom widgets, and accessible error announcements — plus a live playground.

## Features

- JSON-schema-driven fields: text, number, select, checkbox, radio
- zod-powered validation with per-field error messages and number coercion
- Conditional visibility via `showIf` expressions (`equals` / `notEquals` / `in`)
- Custom widget registry (a star-rating widget ships built in)
- `aria-live="assertive"` error announcements on submit, with focus moved to the first invalid field
- Live playground: edit the schema JSON textarea and the form re-renders instantly

## Quickstart

```bash
npm install
npm run dev     # playground at http://localhost:5173
npm test        # vitest, runs once and exits
npm run build   # type-check (tsc --noEmit) + vite build
npm run start   # serve the production build (vite preview)
npm run lint    # eslint 9 flat config
```

## Example

A schema is plain JSON:

```json
{
  "title": "Signup",
  "fields": [
    { "id": "name", "label": "Name", "type": "text", "required": true },
    { "id": "age", "label": "Age", "type": "number", "min": 0, "max": 130 },
    {
      "id": "plan",
      "label": "Plan",
      "type": "select",
      "required": true,
      "options": [
        { "value": "free", "label": "Free" },
        { "value": "pro", "label": "Pro" }
      ]
    },
    {
      "id": "contact",
      "label": "Preferred contact",
      "type": "radio",
      "options": [
        { "value": "email", "label": "Email" },
        { "value": "phone", "label": "Phone" }
      ],
      "showIf": { "field": "plan", "equals": "pro" }
    }
  ]
}
```

Validating values against it with the core library:

```ts
import { validateValues } from './src/lib';

const result = validateValues(schema, { name: '', plan: 'free', terms: true });
// {
//   success: false,
//   errors: { name: 'Name is required' },
//   values: { name: '', plan: 'free', terms: true }
// }
```

## How it works

- `src/lib/types.ts` — `FormSchema` / `FieldSchema` types; plain JSON-serializable, so schemas can live in a textarea, a CMS, or a config file.
- `src/lib/parser.ts` — `parseSchema()` compiles a `FormSchema` into a zod object schema (number coercion, enum checks, min/max, required handling); `isFieldVisible()` / `getVisibleFields()` evaluate `showIf` conditions.
- `src/lib/validator.ts` — `validateValues()` returns `{ success, errors, values }` with a per-field error map; `validateField()` validates a single field (used for on-blur validation by the renderer).
- `src/App.tsx` — minimal demo shell that runs the validator live; the full form renderer and playground land on top of these modules.

## Running tests

```bash
npm test
```

Runs `vitest run` once (no watch mode): unit tests for the schema parser (`src/lib/__tests__/parser.test.ts`) and validator (`src/lib/__tests__/validator.test.ts`), covering valid input, missing required fields, type coercion, invalid enum values, and `showIf` visibility. Component tests for the renderer join the same suite as the UI lands.
