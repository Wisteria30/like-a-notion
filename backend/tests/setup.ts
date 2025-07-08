import { prisma } from '../src/config/database';

// Clean up database and reset for each test file
export async function resetDatabase() {
  // Hard delete all data for clean testing
  await prisma.block.deleteMany();
  await prisma.page.deleteMany();
  await prisma.user.deleteMany();

  // デフォルトユーザー作成
  await prisma.user.create({
    data: {
      id: 'default-user-id',
      email: 'default@example.com',
      name: 'Default User',
    },
  });
}

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});