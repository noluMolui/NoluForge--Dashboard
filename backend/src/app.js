const express = require('express')
const cors = require('cors')
const { prisma } = require('./db')
const { toDbStatus } = require('./statusMap')
const {
  createProjectSchema,
  updateProjectSchema,
  eventSchema,
  paymentSchema,
  outreachSchema,
} = require('./validation')
const { serializeProject, serializeEvent } = require('./serializers')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'noluforge-backend' })
})

app.get('/api/projects', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    res.json({ data: projects.map(serializeProject) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/projects', async (req, res, next) => {
  try {
    const parsed = createProjectSchema.parse(req.body)

    const created = await prisma.project.create({
      data: {
        businessName: parsed.businessName,
        contactInfo: parsed.contactInfo,
        projectType: parsed.projectType,
        previewLink: parsed.previewLink,
        status: toDbStatus(parsed.status || 'Concept / In Progress'),
        quoteAmount: parsed.quoteAmount,
        amountPaid: parsed.amountPaid ?? 0,
        progress: parsed.progress ?? 0,
        depositPercent: parsed.depositPercent ?? 30,
        lastOutreach: parsed.lastOutreach ? new Date(parsed.lastOutreach) : null,
      },
    })

    await prisma.projectEvent.create({
      data: {
        projectId: created.id,
        eventType: 'created',
        message: `Project created with quote amount ${created.quoteAmount}.`,
      },
    })

    const project = await prisma.project.findUnique({
      where: { id: created.id },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    res.status(201).json({ data: serializeProject(project) })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/projects/:id', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id)
    const parsed = updateProjectSchema.parse(req.body)

    const data = {}
    if (parsed.businessName !== undefined) data.businessName = parsed.businessName
    if (parsed.contactInfo !== undefined) data.contactInfo = parsed.contactInfo
    if (parsed.projectType !== undefined) data.projectType = parsed.projectType
    if (parsed.previewLink !== undefined) data.previewLink = parsed.previewLink
    if (parsed.status !== undefined) data.status = toDbStatus(parsed.status)
    if (parsed.quoteAmount !== undefined) data.quoteAmount = parsed.quoteAmount
    if (parsed.amountPaid !== undefined) data.amountPaid = parsed.amountPaid
    if (parsed.progress !== undefined) data.progress = parsed.progress
    if (parsed.depositPercent !== undefined) data.depositPercent = parsed.depositPercent
    if (parsed.lastOutreach !== undefined) {
      data.lastOutreach = parsed.lastOutreach ? new Date(parsed.lastOutreach) : null
    }

    await prisma.project.update({
      where: { id: projectId },
      data,
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    res.json({ data: serializeProject(project) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/projects/:id/events', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id)

    const events = await prisma.projectEvent.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json({ data: events.map(serializeEvent) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/projects/:id/events', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id)
    const parsed = eventSchema.parse(req.body)

    const event = await prisma.projectEvent.create({
      data: {
        projectId,
        eventType: parsed.eventType,
        message: parsed.message,
        metadata: parsed.metadata,
        createdBy: parsed.createdBy,
      },
    })

    res.status(201).json({ data: serializeEvent(event) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/projects/:id/payments', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id)
    const parsed = paymentSchema.parse(req.body)

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          projectId,
          kind: parsed.kind,
          amount: parsed.amount,
          reference: parsed.reference,
          paidAt: parsed.paidAt ? new Date(parsed.paidAt) : new Date(),
        },
      })

      const project = await tx.project.findUnique({ where: { id: projectId } })
      const nextAmountPaid = (project?.amountPaid || 0) + parsed.amount
      const fullyPaid = nextAmountPaid >= (project?.quoteAmount || 0)

      await tx.project.update({
        where: { id: projectId },
        data: {
          amountPaid: nextAmountPaid,
          status: fullyPaid ? 'PAID' : project.status,
          progress: fullyPaid ? 100 : project.progress,
        },
      })

      await tx.projectEvent.create({
        data: {
          projectId,
          eventType: 'payment',
          message: `${parsed.kind} payment of ${parsed.amount} recorded.`,
          metadata: {
            kind: parsed.kind,
            amount: parsed.amount,
            reference: parsed.reference || null,
          },
        },
      })
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    res.status(201).json({ data: serializeProject(project) })
  } catch (error) {
    next(error)
  }
})

app.post('/api/projects/:id/outreach', async (req, res, next) => {
  try {
    const projectId = Number(req.params.id)
    const parsed = outreachSchema.parse(req.body)
    const contactedAt = parsed.contactedAt ? new Date(parsed.contactedAt) : new Date()

    await prisma.$transaction(async (tx) => {
      await tx.outreachLog.create({
        data: {
          projectId,
          note: parsed.note,
          contactedAt,
        },
      })

      await tx.project.update({
        where: { id: projectId },
        data: { lastOutreach: contactedAt },
      })

      await tx.projectEvent.create({
        data: {
          projectId,
          eventType: 'outreach',
          message: parsed.note || 'Client follow-up logged.',
          metadata: {
            contactedAt: contactedAt.toISOString(),
          },
        },
      })
    })

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        payments: { orderBy: { paidAt: 'desc' } },
      },
    })

    res.status(201).json({ data: serializeProject(project) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/dashboard/metrics', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany()

    const totalProjects = projects.length
    const activeBuilds = projects.filter(
      (project) => project.status === 'CONCEPT_IN_PROGRESS',
    ).length
    const pendingReview = projects.filter(
      (project) => project.status === 'READY_FOR_REVIEW',
    ).length
    const completedAndPaid = projects.filter(
      (project) => project.status === 'PAID',
    ).length

    const potentialRevenue = projects.reduce(
      (sum, project) => sum + project.quoteAmount,
      0,
    )
    const collectedRevenue = projects.reduce(
      (sum, project) => sum + project.amountPaid,
      0,
    )

    res.json({
      data: {
        totalProjects,
        activeBuilds,
        pendingReview,
        completedAndPaid,
        potentialRevenue,
        collectedRevenue,
        pendingRevenue: Math.max(potentialRevenue - collectedRevenue, 0),
      },
    })
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  if (error?.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', details: error.issues })
    return
  }

  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

module.exports = {
  app,
}
