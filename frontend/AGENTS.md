# React + TypeScript + Vite

For UI components use the @trussworks/react-uswds library.

## Stack, libraries, and tooling

Use the following libraries and tools for each category of frontend concept:

- UI Components: @trussworks/react-uswds
- Global store: tanstack/query
- Global state: zustand
- Forms: React Hook Form
- Validation: Zod

## Development patterns

- Pages: use hooks and global state
- Components: pass all data needed for render as much as possible, do not retrieve global state. Can maintain local state around interactivity.
