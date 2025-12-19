const practitionerUserSummarySchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
  required: ['id', 'email', 'firstName', 'lastName'],
  additionalProperties: false,
} as const;

export const practitionerSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    user: {
      anyOf: [practitionerUserSummarySchema, { type: 'null' }],
    },
  },
  required: ['id', 'userId', 'createdAt', 'updatedAt'],
  additionalProperties: false,
} as const;
