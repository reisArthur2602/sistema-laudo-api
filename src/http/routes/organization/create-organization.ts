import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

import slugify from "slugify";

export const createOrganization = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org",
      {
        schema: {
          tags: ["Organization"],
          security: [{ bearerAuth: [] }],
          summary: "Criar organização",
          body: z.object({
            name: z.string().min(2, "Nome muito curto"),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();
        const { name } = request.body;

        const slug = slugify.default(name, {
          lower: true,
          strict: false,
          locale: "vi",
          trim: true,
        });

        await prisma.organization.create({
          data: {
            name,
            slug,
            members: {
              create: {
                userId,
                role: Role.SUPER_ADMIN,
              },
            },
          },
          select: { id: true, name: true, slug: true, createdAt: true },
        });

        return reply.status(201).send(null);
      }
    );
};
