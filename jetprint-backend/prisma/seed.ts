import { PrismaClient, UserRole, OrderStage } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting the seeding process...');

  // --- Create Default Stages ---
  const stagesToCreate = Object.values(OrderStage);
  for (const stageName of stagesToCreate) {
    await prisma.stage.upsert({
      where: { name: stageName },
      update: {},
      create: { name: stageName },
    });
    console.log(`- Created/verified stage: ${stageName}`);
  }

  // --- Create Branches ---
  const branch1 = await prisma.branch.upsert({
    where: { name: 'Downtown' },
    update: {},
    create: { name: 'Downtown' },
  });
  console.log(`🏢 Created/verified branch: ${branch1.name}`);

  // --- Create Admin User ---
  const adminUser = await prisma.user.upsert({
    where: { phone: '1234567890' },
    update: { role: UserRole.ADMIN },
    create: {
      phone: '1234567890',
      role: UserRole.ADMIN,
    },
  });
  console.log(`👤 Created/verified admin user: ${adminUser.phone}`);

  // --- Assign Admin to ALL stages ---
  const allStages = await prisma.stage.findMany();
  await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      stages: {
        // disconnect all previous stages and connect to all new ones
        set: allStages.map((stage) => ({ id: stage.id })),
      },
    },
  });
  console.log(`✅ Assigned admin user to all ${allStages.length} stages.`);

  console.log('✅ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ An error occurred during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });