const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.fieldVisit.create({
      data: {
        employeeId: 'se-fs-001',
        customerSiteId: '83414380-457d-450a-84a1-6ed76b3cf99f',
        notes: 'Test Notes',
        remarks: 'Test Remarks',
        location: {
          create: { lat: 12, lng: 77, accuracy: 10 }
        },
        attachments: {
          create: {
            fileUrl: '/uploads/test.jpg',
            type: 'image'
          }
        },
        materials: undefined,
        followUps: {
          create: {
            notes: '',
            dueDate: new Date('2026-09-08')
          }
        }
      }
    });
    console.log("Success", res);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
