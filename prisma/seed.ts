import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const EQUIPMENTS = [
  "GE Healthcare",
  "SAMSUNG MEDISON CO., LTD.",
  "GE MEDICAL SYSTEMS",
  "Philips Healthcare",
  "KODAK",
];

async function seed() {
  const passwordHash = await hash("123456", 5);

  const user = await prisma.user.create({
    data: {
      email: "suporte@grupo-master.com",
      password: passwordHash,
      name: "Suporte",
    },
  });

  await prisma.organization.create({
    data: {
      name: "Centro Diagnóstico Galeão",
      slug: "centro-diagnostico-galeao",
      members: {
        create: {
          userId: user.id,
          role: "SUPER_ADMIN",
        },
      },
      equipments: {
        createMany: {
          data: EQUIPMENTS.map((eq) => ({ name: eq })),
        },
      },
    },
    include: {
      equipments: true,
      members: true,
    },
  });

  console.log("✅ Organização e equipamentos criados com sucesso!");
}

seed();
