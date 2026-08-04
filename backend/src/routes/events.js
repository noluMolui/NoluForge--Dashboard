const express = require('express')
const { z } = require('zod')
const { prisma } = require('../lib/prisma')

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res) => {
  const events = await prisma.projectEvent.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  })
  res.json(events)
})

router.post('/', async (req, res) => {
  const { type, text, metadata } = z
    .object({
      type: z.string().min(1),
      text: z.string().min(1),
      metadata: z.string().optional(),
    })
    .parse(req.body)

  const event = await prisma.projectEvent.create({
    data: { projectId: req.params.projectId, type, text, metadata },
  })

  res.status(201).json(event)
})

module.exports = router
