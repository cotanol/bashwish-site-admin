import prisma from '@/libs/prisma'
import * as bcrypt from 'bcrypt'

async function main() {
  console.log('🌱 Starting seed...')

  try {
    // Ensure connection
    await prisma.$connect()
    console.log('✅ Connected to database')

    // Clean existing data
    console.log('🧹 Cleaning existing data...')

    // Borrar en orden correcto (por dependencias de foreign keys)

    // 1. Tablas pivote (dependen de otras tablas)
    console.log('  - Deleting packageTheme...')
    await prisma.packageTheme.deleteMany()
    console.log('  - Deleting servicePackageTheme...')
    await prisma.servicePackageTheme.deleteMany()

    // 2. Analytics y Marketing (Independientes)
    console.log('  - Deleting clicks...')
    await prisma.click.deleteMany()
    console.log('  - Deleting newsletterSubscriptions...') // <--- AGREGADO AQUÍ
    await prisma.newsletterSubscription.deleteMany()

    // 3. Reviews (dependen de Venue y Service)
    console.log('  - Deleting venue reviews...')
    await prisma.review.deleteMany()
    console.log('  - Deleting service reviews...')
    await prisma.serviceReview.deleteMany()

    // 4. Packages (dependen de Venue y Service)
    console.log('  - Deleting venuePackages...')
    await prisma.venuePackage.deleteMany()
    console.log('  - Deleting servicePackages...')
    await prisma.servicePackage.deleteMany()

    // 5. Images (dependen de Venue y Service)
    console.log('  - Deleting venueImages...')
    await prisma.venueImage.deleteMany()
    console.log('  - Deleting serviceImages...')
    await prisma.serviceImage.deleteMany()

    // 6. Venues y Services (tablas principales)
    console.log('  - Deleting venues...')
    await prisma.venue.deleteMany()
    console.log('  - Deleting services...')
    await prisma.service.deleteMany()

    // 7. Vendor y sus aplicaciones (dependen de User)
    console.log('  - Deleting vendorApplications...')
    await prisma.vendorApplication.deleteMany()
    console.log('  - Deleting vendors...')
    await prisma.vendor.deleteMany()

    // 8. Tablas de autenticación (dependen de User)
    console.log('  - Deleting sessions...')
    await prisma.session.deleteMany()
    console.log('  - Deleting accounts...')
    await prisma.account.deleteMany()
    console.log('  - Deleting verificationTokens...')
    await prisma.verificationToken.deleteMany()

    // 9. Users (casi al final)
    console.log('  - Deleting users...')
    await prisma.user.deleteMany()

    // 10. Themes (independiente, al final)
    console.log('  - Deleting themes...')
    await prisma.theme.deleteMany()

    // Create Admin User
    console.log('👤 Creating admin user...')
    const passwordAdmin = 'admin123'
    const hashedPassword = await bcrypt.hash(passwordAdmin, 10)

    await prisma.user.upsert({
      where: { email: 'admin@bashwish.com' },
      update: {
        role: 'admin',
        name: 'Admin User',
        password: hashedPassword // Aseguramos que se actualice si cambiamos la pass en el seed
      },
      create: {
        name: 'Admin User',
        email: 'admin@bashwish.com',
        emailVerified: new Date(),
        role: 'admin',
        password: hashedPassword
      }
    })

    console.log('✅ Seed completed successfully!')
    console.log('\n👤 Admin Login:')
    console.log('Email: admin@bashwish.com')
    console.log('Password: admin123')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
