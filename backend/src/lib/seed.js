require('dotenv').config()
const { prisma } = require('./prisma')

const SEED_PROJECTS = [
  {
    businessName: 'Maboneng Wellness Spa',
    contactInfo: 'Lebo Khumalo | +27 82 555 0132',
    projectType: 'Luxury Brochure Site',
    previewLink: 'https://preview.noluforge.co.za/maboneng-spa',
    status: 'Ready for Review',
    quoteAmount: 9500,
    amountPaid: 3500,
    progress: 72,
    depositPercent: 30,
    lastOutreach: '2026-08-01',
  },
  {
    businessName: 'Soweto Auto Clinic',
    contactInfo: 'Sipho Dlamini | +27 71 110 1144',
    projectType: 'Service Booking Website',
    previewLink: 'https://preview.noluforge.co.za/soweto-auto',
    status: 'Concept / In Progress',
    quoteAmount: 8400,
    amountPaid: 0,
    progress: 32,
    depositPercent: 30,
    lastOutreach: '2026-07-31',
  },
  {
    businessName: 'Rosebank Artisan Bakery',
    contactInfo: 'Nadia Jacobs | +27 79 233 8821',
    projectType: 'Catalog and Order Enquiry',
    previewLink: 'https://preview.noluforge.co.za/rosebank-bakery',
    status: 'Awaiting Payment',
    quoteAmount: 7800,
    amountPaid: 2340,
    progress: 92,
    depositPercent: 30,
    lastOutreach: '2026-07-29',
  },
  {
    businessName: 'Linden Property Group',
    contactInfo: 'Palesa Moyo | +27 83 994 2033',
    projectType: 'Portfolio and Lead Capture',
    previewLink: 'https://preview.noluforge.co.za/linden-property',
    status: 'Paid',
    quoteAmount: 13200,
    amountPaid: 13200,
    progress: 100,
    depositPercent: 30,
    lastOutreach: '2026-07-25',
  },
]

async function main() {
  const existing = await prisma.project.count()
  if (existing > 0) {
    console.log(`Database already has ${existing} project(s) — skipping seed.`)
    return
  }

  for (const data of SEED_PROJECTS) {
    await prisma.project.create({
      data: {
        ...data,
        events: {
          create: {
            type: 'created',
            text: `Project seeded: ${data.businessName}.`,
          },
        },
      },
    })
    console.log(`  Seeded: ${data.businessName}`)
  }

  console.log('\n  Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
