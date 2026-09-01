const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed Customer Sites
  const sites = await Promise.all([
    prisma.customerSite.create({
      data: { name: 'ABC Electronics', address: '123 MG Road, Bangalore, Karnataka 560001' },
    }),
    prisma.customerSite.create({
      data: { name: 'XYZ Corp', address: '456 Park Street, Hyderabad, Telangana 500034' },
    }),
    prisma.customerSite.create({
      data: { name: 'MNO Traders', address: '789 Anna Salai, Chennai, Tamil Nadu 600002' },
    }),
    prisma.customerSite.create({
      data: { name: 'PQR Distributors', address: '321 Jubilee Hills, Hyderabad, Telangana 500033' },
    }),
    prisma.customerSite.create({
      data: { name: 'LMN Industries', address: '654 Banjara Hills, Hyderabad, Telangana 500034' },
    }),
    prisma.customerSite.create({
      data: { name: 'RST Solutions', address: '987 Whitefield, Bangalore, Karnataka 560066' },
    }),
  ]);

  console.log(`Created ${sites.length} customer sites`);

  // Seed Materials
  const materials = await Promise.all([
    prisma.material.create({ data: { name: 'Cement', unit: 'bags' } }),
    prisma.material.create({ data: { name: 'Steel Rods', unit: 'kg' } }),
    prisma.material.create({ data: { name: 'Bricks', unit: 'units' } }),
    prisma.material.create({ data: { name: 'Sand', unit: 'cubic ft' } }),
    prisma.material.create({ data: { name: 'Paint', unit: 'litres' } }),
    prisma.material.create({ data: { name: 'Tiles', unit: 'sq ft' } }),
    prisma.material.create({ data: { name: 'Plywood', unit: 'sheets' } }),
    prisma.material.create({ data: { name: 'Electrical Wire', unit: 'metres' } }),
    prisma.material.create({ data: { name: 'PVC Pipes', unit: 'units' } }),
    prisma.material.create({ data: { name: 'Glass Panels', unit: 'sq ft' } }),
  ]);

  console.log(`Created ${materials.length} materials`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
