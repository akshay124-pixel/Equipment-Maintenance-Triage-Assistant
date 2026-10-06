import { PrismaClient, UserRole, ThresholdOperator, ThresholdSeverity, EquipmentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create users
  console.log('Creating users...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await hashPassword('Admin123!'),
      role: UserRole.ADMIN,
    },
  });

  const technicianUser = await prisma.user.upsert({
    where: { email: 'tech@example.com' },
    update: {},
    create: {
      email: 'tech@example.com',
      name: 'John Technician',
      password: await hashPassword('Tech123!'),
      role: UserRole.TECHNICIAN,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: await hashPassword('User123!'),
      role: UserRole.USER,
    },
  });

  console.log('Created users:', { admin: adminUser.email, technician: technicianUser.email, user: regularUser.email });

  // Create equipment
  console.log('Creating equipment...');
  const compressor = await prisma.equipment.upsert({
    where: { identifier: 'COMP-102' },
    update: {},
    create: {
      identifier: 'COMP-102',
      name: 'Industrial Air Compressor',
      type: 'Industrial Compressor',
      description: 'High-capacity air compressor for manufacturing operations',
      location: 'Plant A - Building 3',
      status: EquipmentStatus.OPERATIONAL,
    },
  });

  const pump = await prisma.equipment.upsert({
    where: { identifier: 'PUMP-045' },
    update: {},
    create: {
      identifier: 'PUMP-045',
      name: 'Hydraulic Pump System',
      type: 'Hydraulic Pump',
      description: 'Primary hydraulic pump for assembly line',
      location: 'Plant A - Building 2',
      status: EquipmentStatus.OPERATIONAL,
    },
  });

  console.log('Created equipment:', { compressor: compressor.identifier, pump: pump.identifier });

  // Create sensor definitions and thresholds for compressor
  console.log('Creating sensor definitions...');
  const temperatureSensor = await prisma.sensorDefinition.create({
    data: {
      equipmentId: compressor.id,
      name: 'Temperature',
      unit: '°C',
      description: 'Compressor operating temperature',
      thresholds: {
        create: [
          {
            operator: ThresholdOperator.GREATER_THAN,
            value: 90,
            severity: ThresholdSeverity.HIGH,
            description: 'Temperature exceeds safe operating limit',
          },
          {
            operator: ThresholdOperator.GREATER_THAN,
            value: 80,
            severity: ThresholdSeverity.MEDIUM,
            description: 'Temperature approaching operational limit',
          },
        ],
      },
    },
  });

  const pressureSensor = await prisma.sensorDefinition.create({
    data: {
      equipmentId: compressor.id,
      name: 'Pressure',
      unit: 'bar',
      description: 'System pressure',
      thresholds: {
        create: [
          {
            operator: ThresholdOperator.LESS_THAN,
            value: 5,
            severity: ThresholdSeverity.HIGH,
            description: 'Pressure below operational minimum',
          },
          {
            operator: ThresholdOperator.GREATER_THAN,
            value: 12,
            severity: ThresholdSeverity.CRITICAL,
            description: 'Pressure exceeds safety limit',
          },
        ],
      },
    },
  });

  const vibrationSensor = await prisma.sensorDefinition.create({
    data: {
      equipmentId: compressor.id,
      name: 'Vibration',
      unit: 'mm/s',
      description: 'Vibration level',
      thresholds: {
        create: [
          {
            operator: ThresholdOperator.GREATER_THAN,
            value: 7,
            severity: ThresholdSeverity.HIGH,
            description: 'Abnormal vibration detected',
          },
        ],
      },
    },
  });

  console.log('Created sensor definitions with thresholds');

  // Create equipment events
  console.log('Creating equipment events...');
  const event1 = await prisma.equipmentEvent.create({
    data: {
      equipmentId: compressor.id,
      eventType: 'STARTUP',
      description: 'Equipment restarted after scheduled maintenance',
      eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  const event2 = await prisma.equipmentEvent.create({
    data: {
      equipmentId: compressor.id,
      eventType: 'ALERT',
      description: 'Unusual noise reported by operator',
      eventDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  console.log('Created equipment events');

  // Create sample knowledge document entry (without actual embedding)
  console.log('Creating knowledge document...');
  const doc = await prisma.knowledgeDocument.create({
    data: {
      title: 'Industrial Compressor Maintenance Manual',
      equipmentType: 'Industrial Compressor',
      filename: 'compressor-manual.pdf',
      fileSize: 524288, // 512KB
      mimeType: 'application/pdf',
      processingStatus: 'completed',
      processedAt: new Date(),
    },
  });

  // Create sample chunks (without embeddings for seed data)
  await prisma.knowledgeChunk.create({
    data: {
      documentId: doc.id,
      content: 'Section 4.2: Bearing Inspection. Regular inspection of compressor bearings is essential for preventing premature failure. Signs of bearing wear include elevated vibration levels (above 7 mm/s) and unusual noise during operation. If abnormal vibration is detected, immediately inspect mounting bolts for proper torque and check bearing housing for signs of wear or damage.',
      chunkIndex: 0,
      section: 'Section 4.2',
      page: 42,
    },
  });

  await prisma.knowledgeChunk.create({
    data: {
      documentId: doc.id,
      content: 'Section 5.1: Temperature Monitoring. Operating temperature should be maintained between 60-85°C under normal load. Temperatures exceeding 90°C indicate potential cooling system issues or excessive load. Check coolant levels, verify fan operation, and inspect heat exchanger for blockages.',
      chunkIndex: 1,
      section: 'Section 5.1',
      page: 51,
    },
  });

  await prisma.knowledgeChunk.create({
    data: {
      documentId: doc.id,
      content: 'Section 5.3: Shaft Alignment. Proper shaft alignment is critical for minimizing vibration and extending bearing life. Misalignment symptoms include vibration, elevated temperature, and premature bearing failure. Use dial indicators to verify alignment within 0.05mm tolerance.',
      chunkIndex: 2,
      section: 'Section 5.3',
      page: 53,
    },
  });

  console.log('Created knowledge document with sample chunks');

  // Create sample maintenance report with sensor readings
  console.log('Creating sample maintenance report...');
  const report = await prisma.maintenanceReport.create({
    data: {
      equipmentId: compressor.id,
      reportedById: regularUser.id,
      issueDescription: 'Compressor producing unusual noise and vibration. Operating temperature appears elevated. Pressure output is lower than normal.',
      operatingEvents: [
        'Equipment restarted 7 days ago after scheduled maintenance',
        'Unusual noise first noticed 2 days ago',
        'Vibration has increased gradually over past 48 hours',
      ],
      equipmentEventIds: [event1.id, event2.id],
      sensorReadings: {
        create: [
          {
            sensorDefinitionId: temperatureSensor.id,
            value: 92,
            status: 'EXCEEDED',
            severity: 'HIGH',
            notes: 'Temperature exceeds safe operating limit',
          },
          {
            sensorDefinitionId: pressureSensor.id,
            value: 4.2,
            status: 'EXCEEDED',
            severity: 'HIGH',
            notes: 'Pressure below operational minimum',
          },
          {
            sensorDefinitionId: vibrationSensor.id,
            value: 8.5,
            status: 'EXCEEDED',
            severity: 'HIGH',
            notes: 'Abnormal vibration detected',
          },
        ],
      },
    },
  });

  console.log('Created sample maintenance report with sensor readings');

  console.log('✅ Database seed completed successfully!');
  console.log('\nTest credentials:');
  console.log('Admin: admin@example.com / admin123456');
  console.log('Technician: technician@example.com / tech123456');
  console.log('User: user@example.com / user123456');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
