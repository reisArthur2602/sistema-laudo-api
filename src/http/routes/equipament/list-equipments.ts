
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";

export const listEquipments = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/equipments",
      {
        schema: {
          tags: ["Equipment"],
          security: [{ bearerAuth: [] }],
          summary: "Listar equipamentos da organização",
          params: z.object({ slug: z.string() }),
          response: {
            200: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                organizationId: z.string(),
                createdAt: z.date(),
              })
            ),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { organizationId } = await request.getOrgMembershipBySlug(slug);

        const items = await prisma.equipment.findMany({
          where: { organizationId },
          select: {
            id: true,
            name: true,
            organizationId: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send(items);
      }
    );
};
