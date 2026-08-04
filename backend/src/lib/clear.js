require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const result = await prisma.project.deleteMany()
  console.log(`Cleared ${result.count} project(s) and all related events, payments, and outreach logs.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
