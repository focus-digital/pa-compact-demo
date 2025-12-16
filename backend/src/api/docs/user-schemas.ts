export const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string', enum: ['ADMIN', 'USER'] },
  },
  required: ['id', 'email', 'role'],
  additionalProperties: false,
} as const;