const { z } = require('zod');

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED'];

// Treat empty strings ("") as "not provided"
const emptyToUndefined = (schema) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    schema.optional()
  );

const createInquirySchema = z
  .object({
    customerName: z.string().trim().min(1, 'Customer name is required').max(100),
    contactEmail: emptyToUndefined(
      z.string().trim().toLowerCase().email('Enter a valid email address')
    ),
    contactPhone: emptyToUndefined(
      z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number')
    ),
    subject: z.string().trim().min(1, 'Subject is required').max(150),
    description: z.string().trim().min(1, 'Description is required').max(2000),
  })
  .refine((d) => d.contactEmail || d.contactPhone, {
    message: 'Provide an email or a phone number',
    path: ['contactEmail'],
  });

const updateStatusSchema = z.object({
  status: z.enum(STATUSES, { message: 'Status must be NEW, IN_PROGRESS or RESOLVED' }),
  version: z.number().int().positive(),
});

const listQuerySchema = z.object({
  status: emptyToUndefined(z.enum(STATUSES, { message: 'Invalid status filter' })),
  search: emptyToUndefined(z.string().trim().max(100)),
});

module.exports = { createInquirySchema, updateStatusSchema, listQuerySchema, STATUSES };