# React + TypeScript + Vite

This file is meant for AI/LLM coding assistance tools and agents.


## Stack, libraries, and tooling

Important: For UI components use the @trussworks/react-uswds library and the associated local MCP server.

Use the following libraries and tools for each category of frontend concept:

- UI Components: @trussworks/react-uswds
- Global store: tanstack/query
- Global state: zustand
- Forms: React Hook Form
- Validation: Zod

## Development patterns

- Pages: use hooks and global state
- Components: pass all data needed for render as much as possible, do not retrieve global state. Can maintain local state around interactivity.
