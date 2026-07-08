import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      fullName: "Admin SEKNEG",
      passwordHash: "$2b$10$11c1y1nRCpmJG3JOvo/RE.MpLuvf0DMFRwRJBdiKvcxfIRPBkF.pe",
      position: "Administrator",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: admin.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: admin.id,
      role: "admin",
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
