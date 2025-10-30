import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const createEquipment = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org/:slug/equipments",
      {
        schema: {
          tags: ["Equipment"],
          security: [{ bearerAuth: [] }],
          summary: "Criar equipamento (admin)",
          params: z.object({ slug: z.string() }),
          body: z.object({ name: z.string().min(2) }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { name } = request.body;

        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        await prisma.equipment.create({
          data: { name, organizationId },
          select: {
            id: true,
            name: true,
            organizationId: true,
            createdAt: true,
          },
        });

        return reply.status(201);
      }
    );
};
