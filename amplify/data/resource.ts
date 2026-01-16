import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Workspace: a
    .model({
      name: a.string().required(),
      phone: a.string(),
      email: a.string(),
      address: a.string(),
      planId: a.string(),
      status: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),

  Patient: a
    .model({
      workspaceId: a.string().required(),
      name: a.string().required(),
      phone: a.string(),
      dob: a.date(),
      age: a.integer(),
      gender: a.string(),
      city: a.string(),
      uhid: a.string(),
      notes: a.string(),
    })
    .secondaryIndexes((index) => [
      index('workspaceId').sortKeys(['phone']),
      index('workspaceId').sortKeys(['name']),
    ])
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update']),
    ]),

  Appointment: a
    .model({
      workspaceId: a.string().required(),
      patientId: a.id().required(),
      doctorId: a.string().required(),
      startAt: a.datetime().required(),
      status: a.string().required(), // e.g., SCHEDULED, COMPLETED, NO_SHOW
      reason: a.string(),
      notes: a.string(),
    })
    .secondaryIndexes((index) => [
      index('workspaceId').sortKeys(['startAt', 'status']),
    ])
    .authorization((allow) => [allow.authenticated()]),

  Visit: a
    .model({
      workspaceId: a.string().required(),
      patientId: a.id().required(),
      doctorId: a.string().required(),
      appointmentId: a.id(),
      visitAt: a.datetime().required(),
      status: a.string().required(),
      clinicalData: a.json(), // Vision, IOP, etc.
    })
    .authorization((allow) => [allow.authenticated()]),

  Prescription: a
    .model({
      workspaceId: a.string().required(),
      visitId: a.id().required(),
      patientId: a.id().required(),
      doctorId: a.string().required(),
      rxJson: a.json().required(),
      pdfUrl: a.string(),
    })
    .authorization((allow) => [allow.authenticated()]),

  generatePDF: a
    .query()
    .arguments({
      type: a.string().required(), // PRESCRIPTION or INVOICE
      id: a.id().required(),
    })
    .returns(a.string())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function('pdf-generator')),

  ClinicSetting: a
    .model({
      workspaceId: a.string().required(),
      key: a.string().required(),
      value: a.string(),
    })
    .secondaryIndexes((index) => [index('workspaceId')])
    .authorization((allow) => [allow.authenticated()]),

  UsageMeter: a
    .model({
      workspaceId: a.string().required(),
      monthYear: a.string().required(), // e.g., 2024-03
      patientCount: a.integer().default(0),
      visitCount: a.integer().default(0),
      invoiceCount: a.integer().default(0),
    })
    .secondaryIndexes((index) => [index('workspaceId').sortKeys(['monthYear'])])
    .authorization((allow) => [allow.authenticated()]),

  AuditLog: a
    .model({
      workspaceId: a.string().required(),
      userId: a.string().required(),
      action: a.string().required(), // e.g., CREATE_PATIENT, UPDATE_VISIT
      entity: a.string().required(),
      entityId: a.id().required(),
      details: a.string(),
    })
    .secondaryIndexes((index) => [index('workspaceId').sortKeys(['userId'])])
    .authorization((allow) => [allow.authenticated()]),

  Invoice: a
    .model({
      workspaceId: a.string().required(),
      patientId: a.id().required(),
      visitId: a.id(),
      invoiceNo: a.string().required(),
      currency: a.string().required(),
      subtotal: a.float().required(),
      tax: a.float(),
      total: a.float().required(),
      status: a.string().required(),
      items: a.json(), // Simplified items list
    })
    .authorization((allow) => [allow.authenticated()]),

  FileRecord: a
    .model({
      workspaceId: a.string().required(),
      patientId: a.id().required(),
      visitId: a.id(),
      type: a.string(), // e.g., IMAGE, PDF
      name: a.string().required(),
      s3Path: a.string().required(),
      meta: a.json(),
    })
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
