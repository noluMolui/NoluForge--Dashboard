require('dotenv').config()

const { app } = require('./app')
const { prisma } = require('./db')

const PORT = Number(process.env.PORT || 4000)

async function start() {
  app.listen(PORT, () => {
    console.log(`Noluforge backend listening on port ${PORT}`)
  })
}

start()

async function shutdown() {
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
