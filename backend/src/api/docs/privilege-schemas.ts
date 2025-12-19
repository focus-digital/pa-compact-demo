import { memberStateSchema } from './member-state-schemas.js';
import { licenseSchema } from './license-schemas.js';
import { practitionerSchema } from './practitioner-schemas.js';

const paymentTransactionSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    applicationId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    amount: { type: 'number' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'applicationId', 'status', 'amount', 'createdAt', 'updatedAt'],
  additionalProperties: false,
} as const;

export const privilegeApplicationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    practitionerId: { type: 'string', format: 'uuid' },
    remoteStateId: { type: 'string', format: 'uuid' },
    qualifyingLicenseId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    applicantNote: { type: 'string', nullable: true },
    reviewerNote: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    practitioner: {
      anyOf: [practitionerSchema, { type: 'null' }],
    },
    remoteState: {
      anyOf: [memberStateSchema, { type: 'null' }],
    },
    qualifyingLicense: {
      anyOf: [licenseSchema, { type: 'null' }],
    },
    payment: {
      anyOf: [paymentTransactionSchema, { type: 'null' }],
    },
  },
  required: [
    'id',
    'practitionerId',
    'remoteStateId',
    'qualifyingLicenseId',
    'status',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
} as const;

export const privilegeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    practitionerId: { type: 'string', format: 'uuid' },
    remoteStateId: { type: 'string', format: 'uuid' },
    applicationId: { type: 'string', format: 'uuid' },
    qualifyingLicenseId: { type: 'string', format: 'uuid' },
    status: { type: 'string' },
    issuedAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    remoteState: {
      anyOf: [memberStateSchema, { type: 'null' }],
    },
    qualifyingLicense: {
      anyOf: [licenseSchema, { type: 'null' }],
    },
    application: {
      anyOf: [privilegeApplicationSchema, { type: 'null' }],
    },
  },
  required: [
    'id',
    'practitionerId',
    'remoteStateId',
    'applicationId',
    'qualifyingLicenseId',
    'status',
    'issuedAt',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
} as const;

export const privilegeSearchResultSchema = {
  type: 'object',
  properties: {
    practitioner: practitionerSchema,
    qualifyingLicense: licenseSchema,
    privileges: {
      type: 'array',
      items: privilegeSchema,
    },
  },
  required: ['practitioner', 'qualifyingLicense', 'privileges'],
  additionalProperties: false,
} as const;

export const privilegeApplyRequestSchema = {
  type: 'object',
  properties: {
    practitionerId: { type: 'string', format: 'uuid' },
    remoteStateId: { type: 'string', format: 'uuid' },
    qualifyingLicenseId: { type: 'string', format: 'uuid' },
    attestationType: { type: 'string' },
    attestationAccepted: { type: 'boolean' },
    attestationText: { type: 'string', nullable: true },
    applicantNote: { type: 'string', nullable: true },
  },
  required: [
    'practitionerId',
    'remoteStateId',
    'qualifyingLicenseId',
    'attestationType',
    'attestationAccepted',
  ],
  additionalProperties: false,
} as const;

export const privilegePayRequestSchema = {
  type: 'object',
  properties: {
    applicationId: { type: 'string', format: 'uuid' },
    amount: { type: 'number' },
  },
  required: ['applicationId', 'amount'],
  additionalProperties: false,
} as const;

export const privilegeVerifyRequestSchema = {
  type: 'object',
  properties: {
    applicationId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['APPROVED', 'DENIED'] },
    expiresAt: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['applicationId', 'status'],
  additionalProperties: false,
} as const;

export const privilegeVerifyResponseSchema = {
  type: 'object',
  properties: {
    application: privilegeApplicationSchema,
    privilege: {
      anyOf: [privilegeSchema, { type: 'null' }],
    },
  },
  required: ['application'],
  additionalProperties: false,
} as const;
