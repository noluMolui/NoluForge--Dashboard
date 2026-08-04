require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const { errorHandler } = require('./lib/errors')
const projectsRouter = require('./routes/projects')
const metricsRouter = require('./routes/metrics')
const authRouter = require('./routes/auth')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'noluforge-api' }))

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/metrics', metricsRouter)

app.use(errorHandler)

process.on('uncaughtException', (err) => console.error('Uncaught exception:', err))
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason))

const server = http.createServer(app)
server.listen(PORT, () => {
  console.log(`\n  Noluforge API  →  http://localhost:${PORT}\n`)
})

server.on('error', (err) => {
  console.error('Server error:', err)
  process.exit(1)
})
