export const memberStateSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string' },
    name: { type: 'string' },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'code', 'name', 'isActive', 'createdAt', 'updatedAt'],
  additionalProperties: false,
} as const;
