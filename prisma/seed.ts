import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  const adminPassword = await bcrypt.hash('Admin@12345', saltRounds);
  const userPassword = await bcrypt.hash('User@12345', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@socialfeed.dev' },
    update: {},
    create: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@socialfeed.dev',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: 'kawsar@socialfeed.dev' },
    update: {},
    create: {
      firstName: 'Kawsar',
      lastName: 'Ahmed',
      email: 'kawsar@socialfeed.dev',
      password: userPassword,
      bio: 'Full Stack Engineer | Vue.js & React',
      role: Role.USER,
    },
  });

  console.log({ admin: admin.email, demoUser: demoUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
