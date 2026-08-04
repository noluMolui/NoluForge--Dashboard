const express = require('express')
const { z } = require('zod')
const { prisma } = require('../lib/prisma')
const eventsRouter = require('./events')
const paymentsRouter = require('./payments')
const outreachRouter = require('./outreach')

const router = express.Router()

router.use('/:projectId/events', eventsRouter)
router.use('/:projectId/payments', paymentsRouter)
router.use('/:projectId/outreach', outreachRouter)

const CreateSchema = z.object({
  businessName: z.string().min(1),
  contactInfo: z.string().min(1),
  projectType: z.string().min(1),
  previewLink: z.string().url(),
  quoteAmount: z.number().min(0),
  amountPaid: z.number().min(0).optional().default(0),
  progress: z.number().min(0).max(100).optional().default(0),
  depositPercent: z.number().min(0).max(100).optional().default(30),
})

const UpdateSchema = z.object({
  status: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  amountPaid: z.number().min(0).optional(),
  lastOutreach: z.string().optional(),
  previewLink: z.string().url().optional(),
  quoteAmount: z.number().min(0).optional(),
  depositPercent: z.number().min(0).max(100).optional(),
})

router.get('/', async (req, res) => {
  const projects = await prisma.project.findMany({
    include: {
      events: { orderBy: { createdAt: 'desc' }, take: 30 },
      payments: { orderBy: { paidAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(projects)
})

router.get('/:id', async (req, res) => {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      events: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { paidAt: 'desc' } },
      outreachLogs: { orderBy: { touchedAt: 'desc' } },
    },
  })
  res.json(project)
})

router.post('/', async (req, res) => {
  const data = CreateSchema.parse(req.body)
  const today = new Date().toISOString().slice(0, 10)

  const project = await prisma.project.create({
    data: {
      ...data,
      status: 'Concept / In Progress',
      lastOutreach: today,
      events: {
        create: [
          { type: 'created', text: `Project created with quote R${data.quoteAmount}.` },
          ...(data.amountPaid > 0
            ? [{ type: 'payment', text: `Upfront payment captured: R${data.amountPaid}.` }]
            : []),
        ],
      },
    },
    include: {
      events: { orderBy: { createdAt: 'desc' }, take: 30 },
      payments: true,
    },
  })

  res.status(201).json(project)
})

router.patch('/:id', async (req, res) => {
  const data = UpdateSchema.parse(req.body)

  const project = await prisma.project.update({
    where: { id: req.params.id },
    data,
    include: {
      events: { orderBy: { createdAt: 'desc' }, take: 30 },
      payments: true,
    },
  })

  res.json(project)
})

router.delete('/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

module.exports = router
