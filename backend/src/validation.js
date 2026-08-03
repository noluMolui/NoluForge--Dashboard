const { z } = require('zod')

const createProjectSchema = z.object({
  businessName: z.string().min(2),
  contactInfo: z.string().min(2),
  projectType: z.string().min(2),
  previewLink: z.string().url(),
  status: z.enum(['Concept / In Progress', 'Ready for Review', 'Awaiting Payment', 'Paid']).optional(),
  quoteAmount: z.number().int().nonnegative(),
  amountPaid: z.number().int().nonnegative().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  depositPercent: z.number().int().min(0).max(100).optional(),
  lastOutreach: z.string().datetime().optional().nullable(),
})

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(['Concept / In Progress', 'Ready for Review', 'Awaiting Payment', 'Paid']).optional(),
})

const eventSchema = z.object({
  eventType: z.string().min(2),
  message: z.string().min(2),
  metadata: z.record(z.any()).optional(),
  createdBy: z.number().int().optional(),
})

const paymentSchema = z.object({
  kind: z.enum(['DEPOSIT', 'MILESTONE', 'FINAL']),
  amount: z.number().int().positive(),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional(),
})

const outreachSchema = z.object({
  note: z.string().optional(),
  contactedAt: z.string().datetime().optional(),
})

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  eventSchema,
  paymentSchema,
  outreachSchema,
}
