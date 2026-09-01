const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { FieldVisitsService } = require('./dist/field-visits/field-visits.service');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(FieldVisitsService);
  try {
    const res = await service.createVisit('se-fs-001', {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
      customerSiteName: 'Test Site 2',
      notes: 'Test Notes',
      remarks: 'Test Remarks',
      lat: 12.9716,
      lng: 77.5946,
      accuracy: 10,
      imageUrl: '/uploads/test.jpg',
      materials: [],
      followUp: { notes: 'Task', dueDate: '2026-09-08' }
    });
    console.log("Success", res.id);
  } catch (e) {
    console.error("Service Error:", e);
  } finally {
    await app.close();
  }
}
bootstrap();
