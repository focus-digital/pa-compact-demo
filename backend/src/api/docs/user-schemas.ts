import { practitionerSchema } from './practitioner-schemas.js';

export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    role: { type: 'string', enum: ['PA', 'STATE_ADMIN', 'COMMISSION_ADMIN'] },
    memberStateId: { type: ['string', 'null'], format: 'uuid' },
    practitioner: { anyOf: [practitionerSchema, { type: 'null' }] },
  },
  required: ['id', 'email', 'firstName', 'lastName', 'role'],
  additionalProperties: false,
} as const;
