import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with permanent records...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Persistent Employees
  const emp1 = await (prisma as any).employee.upsert({
    where: { id: 'se-fs-001' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'se-fs-001',
      name: 'Rahul Sharma',
      phone: '+91 9876543210',
      password: hashedPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  const emp2 = await (prisma as any).employee.upsert({
    where: { id: 'se-fs-002' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'se-fs-002',
      name: 'Priya Patel',
      phone: '+91 9123456780',
      password: hashedPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
    },
  });

  // 2. Persistent Customer Sites (Fixed IDs)
  const site1 = await (prisma as any).customerSite.upsert({
    where: { id: 'site-prestige-001' },
    update: {},
    create: {
      id: 'site-prestige-001',
      name: 'Prestige Tech Cloud, Phase 2',
      address: 'Outer Ring Rd, Nagavara, Bengaluru',
      geoTag: 'Hebbal, Bengaluru',
    },
  });

  const site2 = await (prisma as any).customerSite.upsert({
    where: { id: 'site-brigade-002' },
    update: {},
    create: {
      id: 'site-brigade-002',
      name: 'Brigade Gateway Commercial',
      address: 'Dr Rajkumar Rd, Rajajinagar, Bengaluru',
      geoTag: 'Malleshwaram, Bengaluru',
    },
  });

  // 3. Persistent Field Visits (Fixed IDs)
  await (prisma as any).fieldVisit.upsert({
    where: { id: 'visit-entry-001' },
    update: {},
    create: {
      id: 'visit-entry-001',
      employeeId: emp1.id,
      customerSiteId: site1.id,
      notes: 'Client requested immediate quotation for electrical cabling and cement bags.',
      remarks: 'STATUS:PENDING | Materials: 5x Cement Bags, 20m PVC Conduits, 2x Switch Panels',
    },
  });

  await (prisma as any).fieldVisit.upsert({
    where: { id: 'visit-entry-002' },
    update: {},
    create: {
      id: 'visit-entry-002',
      employeeId: emp2.id,
      customerSiteId: site2.id,
      notes: 'Followed up on lighting requirements. Sample inspection approved by site engineer.',
      remarks: 'STATUS:APPROVED | Materials: 10x LED Panel Lights, 50m Heavy Duty Cable',
    },
  });

  console.log('✅ Persistent records verified.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });