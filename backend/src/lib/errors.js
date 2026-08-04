function errorHandler(err, _req, res, _next) {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: err.errors })
  }

  // Prisma record-not-found
  if (err?.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' })
  }

  // Prisma unique constraint
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists' })
  }

  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}

module.exports = { errorHandler }
