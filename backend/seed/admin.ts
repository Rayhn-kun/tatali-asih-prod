import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@tatali.local';
  const password = process.env.ADMIN_PASSWORD || 'Tatali123!';
  const name = process.env.ADMIN_NAME || 'Admin';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role: 'ADMIN', passwordHash },
    create: { name, email, role: 'ADMIN', passwordHash },
  });

  console.log('Admin seeded:', { email, id: user.id });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });