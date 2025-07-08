import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default user
  const defaultUser = await prisma.user.upsert({
    where: { email: 'default@example.com' },
    update: {},
    create: {
      id: 'default-user-id',
      email: 'default@example.com',
      name: 'Default User',
    },
  });

  console.log('Created default user:', defaultUser);

  // Create a sample page
  const samplePage = await prisma.page.create({
    data: {
      title: 'Welcome to Like a Notion',
      icon: '👋',
      createdById: defaultUser.id,
    },
  });

  // Create sample blocks with JSON properties
  await prisma.block.createMany({
    data: [
      {
        pageId: samplePage.id,
        type: 'heading_1',
        properties: { text: 'Getting Started' },
        sortIndex: 0,
        createdById: defaultUser.id,
        lastEditedById: defaultUser.id,
      },
      {
        pageId: samplePage.id,
        type: 'paragraph',
        properties: { text: 'This is your first page. Start typing to add content!' },
        sortIndex: 1,
        createdById: defaultUser.id,
        lastEditedById: defaultUser.id,
      },
      {
        pageId: samplePage.id,
        type: 'todo',
        properties: { text: 'Create your first page', checked: false },
        sortIndex: 2,
        createdById: defaultUser.id,
        lastEditedById: defaultUser.id,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });