import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { faker } from "@faker-js/faker";
const prisma = new PrismaClient();

const seed = async () => {
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await hash("123456", 5);

  const admin = await prisma.user.create({
    data: {
      email: "suporte@grupo-master.com",
      password: passwordHash,
      name: "Suporte",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: faker.internet.email({ provider: "gmail.com" }),
      password: passwordHash,
      name: faker.person.firstName(),
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: faker.internet.email({ provider: "gmail.com" }),
      password: passwordHash,
      name: faker.person.firstName(),
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: faker.internet.email({ provider: "gmail.com" }),
      password: passwordHash,
      name: faker.person.firstName(),
    },
  });

  await prisma.organization.create({
    data: {
      name: "centro diagnosticos galeao",
      members: {
        createMany: {
          data: [
            { userId: admin.id, role: "SUPER_ADMIN", active: true },
            { userId: member1.id, role: "MEMBER", active: true },
            { userId: member2.id, role: "MEMBER", active: true },
            { userId: member3.id, role: "MEMBER", active: true },
          ],
        },
      },

      patients: {
        createMany: {
          data: [
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
            { name: faker.person.fullName() },
          ],
        },
      },
    },
  });
};

seed();
