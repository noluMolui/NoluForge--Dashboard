const express = require('express')
const { prisma } = require('../lib/prisma')

const router = express.Router()

router.get('/', async (_req, res) => {
  const projects = await prisma.project.findMany()

  const totalProjects = projects.length
  const activeBuilds = projects.filter((p) => p.status === 'Concept / In Progress').length
  const pendingReview = projects.filter((p) => p.status === 'Ready for Review').length
  const completedAndPaid = projects.filter((p) => p.status === 'Paid').length
  const potentialRevenue = projects.reduce((sum, p) => sum + p.quoteAmount, 0)
  const collectedRevenue = projects.reduce((sum, p) => sum + p.amountPaid, 0)
  const avgProgress =
    totalProjects === 0
      ? 0
      : Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)

  res.json({
    totalProjects,
    activeBuilds,
    pendingReview,
    completedAndPaid,
    potentialRevenue,
    collectedRevenue,
    pendingRevenue: Math.max(potentialRevenue - collectedRevenue, 0),
    avgProgress,
  })
})

module.exports = router
