const express = require('express')
const { z } = require('zod')
const { prisma } = require('../lib/prisma')

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res) => {
  const logs = await prisma.outreachLog.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { touchedAt: 'desc' },
  })
  res.json(logs)
})

router.post('/', async (req, res) => {
  const { note, method } = z
    .object({
      note: z.string().optional(),
      method: z.string().default('phone'),
    })
    .parse(req.body)

  const today = new Date().toISOString().slice(0, 10)

  const [log] = await prisma.$transaction([
    prisma.outreachLog.create({
      data: { projectId: req.params.projectId, note, method },
    }),
    prisma.project.update({
      where: { id: req.params.projectId },
      data: { lastOutreach: today },
    }),
    prisma.projectEvent.create({
      data: {
        projectId: req.params.projectId,
        type: 'outreach',
        text: `Client follow-up via ${method}${note ? ` — ${note}` : ''}.`,
      },
    }),
  ])

  res.status(201).json({ log })
})

module.exports = router
