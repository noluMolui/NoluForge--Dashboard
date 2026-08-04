const express = require('express')
const { z } = require('zod')
const { prisma } = require('../lib/prisma')

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { paidAt: 'desc' },
  })
  res.json(payments)
})

router.post('/', async (req, res) => {
  const { kind, amount, newAmountPaid, reference } = z
    .object({
      kind: z.enum(['deposit', 'milestone', 'final']),
      amount: z.number().min(0),
      newAmountPaid: z.number().min(0),
      reference: z.string().optional(),
    })
    .parse(req.body)

  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1)

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: { projectId: req.params.projectId, kind, amount, reference },
    }),
    prisma.project.update({
      where: { id: req.params.projectId },
      data: { amountPaid: newAmountPaid },
    }),
    prisma.projectEvent.create({
      data: {
        projectId: req.params.projectId,
        type: 'payment',
        text: `${kindLabel} payment of R${amount} recorded. Total: R${newAmountPaid}.`,
      },
    }),
  ])

  res.status(201).json({ payment })
})

module.exports = router
