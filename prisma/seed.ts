import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const cities = [
  'Beograd',
  'Novi Sad',
  'Niš',
  'Kragujevac',
  'Subotica',
  'Zrenjanin',
  'Pančevo',
  'Čačak',
  'Novi Pazar',
  'Kruševac',
  'Smederevo',
  'Valjevo',
  'Šabac',
  'Vranje',
  'Leskovac',
  'Sombor',
  'Zaječar',
  'Požarevac',
  'Kikinda',
  'Pirot',
  'Jagodina',
  'Prijepolje',
  'Užice',
  'Loznica',
  'Prokuplje',
]

async function main() {
  console.log(`Seeding ${cities.length} cities...`)

  for (const name of cities) {
    await prisma.city.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
