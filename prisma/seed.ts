import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "sekneg" },
    update: {},
    create: {
      name: "Sekretariat Negara RI",
      slug: "sekneg",
      domain: "sekneg.go.id",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@sekneg.go.id" },
    update: {},
    create: {
      email: "admin@sekneg.go.id",
      name: "Admin SEKNEG",
      passwordHash: "$2a$10$dev-hash-placeholder", // ganti setelah register
      role: "super_admin",
      position: "Administrator",
      organizationId: org.id,
    },
  });

  console.log(`Seed done: org=${org.slug}, admin=${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
