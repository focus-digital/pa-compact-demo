import { memberStateSchema } from './member-state-schemas.js';
import { practitionerSchema } from './practitioner-schemas.js';

export const qualifyingLicenseDesignationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    practitionerId: { type: 'string', format: 'uuid' },
    licenseId: { type: 'string', format: 'uuid' },
    effectiveFrom: { type: 'string', format: 'date-time' },
    effectiveTo: { type: 'string', format: 'date-time', nullable: true },
    status: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'practitionerId', 'licenseId', 'effectiveFrom', 'status', 'createdAt'],
  additionalProperties: false,
} as const;

export const licenseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    practitionerId: { type: 'string', format: 'uuid' },
    issuingStateId: { type: 'string', format: 'uuid' },
    licenseNumber: { type: 'string' },
    issueDate: { type: 'string', format: 'date-time' },
    expirationDate: { type: 'string', format: 'date-time' },
    selfReportedStatus: { type: 'string' },
    verificationStatus: { type: 'string' },
    evidenceUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    issuingState: {
      anyOf: [memberStateSchema, { type: 'null' }],
    },
    practitioner: {
      anyOf: [practitionerSchema, { type: 'null' }],
    },
    qualifyingDesignations: {
      type: 'array',
      items: qualifyingLicenseDesignationSchema,
    },
  },
  required: [
    'id',
    'practitionerId',
    'issuingStateId',
    'licenseNumber',
    'issueDate',
    'expirationDate',
    'selfReportedStatus',
    'verificationStatus',
    'createdAt',
    'updatedAt',
  ],
  additionalProperties: false,
} as const;

export const licenseCreateRequestSchema = {
  type: 'object',
  properties: {
    issuingStateId: { type: 'string', format: 'uuid' },
    licenseNumber: { type: 'string' },
    selfReportedStatus: { type: 'string' },
    issueDate: { type: 'string', format: 'date-time' },
    expirationDate: { type: 'string', format: 'date-time' },
    evidenceUrl: { type: 'string', nullable: true },
  },
  required: [
    'issuingStateId',
    'licenseNumber',
    'selfReportedStatus',
    'issueDate',
    'expirationDate',
  ],
  additionalProperties: false,
} as const;

export const licenseVerifyRequestSchema = {
  type: 'object',
  properties: {
    licenseId: { type: 'string', format: 'uuid' },
    verificationStatus: { type: 'string', nullable: true },
    note: { type: 'string', nullable: true },
  },
  required: ['licenseId'],
  additionalProperties: false,
} as const;

export const licenseDesignateRequestSchema = {
  type: 'object',
  properties: {
    licenseId: { type: 'string', format: 'uuid' },
    effectiveFrom: { type: 'string', format: 'date-time', nullable: true },
    effectiveTo: { type: 'string', format: 'date-time', nullable: true },
  },
  required: ['licenseId'],
  additionalProperties: false,
} as const;
