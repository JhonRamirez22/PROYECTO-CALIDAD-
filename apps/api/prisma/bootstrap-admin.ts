import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "RiTech Administrator";
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD for this one-time task.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("INITIAL_ADMIN_EMAIL must be a valid email address.");
  }
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new Error("INITIAL_ADMIN_PASSWORD must be 12+ characters with upper/lowercase letters and a number.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.roles.includes(UserRole.ADMIN) && existing.active) {
      console.log(`An active administrator already exists for ${email}; no changes made.`);
      return;
    }
    throw new Error("That email already belongs to a non-admin or inactive account; no changes made.");
  }

  await prisma.user.create({
    data: {
      email,
      name,
      password: await bcrypt.hash(password, 12),
      roles: [UserRole.ADMIN],
      active: true,
    },
  });
  console.log(`Initial administrator created for ${email}. Do not reuse this one-time task configuration.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
