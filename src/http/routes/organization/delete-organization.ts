
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const deleteOrganization = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .delete(
      "/org/:slug",
      {
        schema: {
          tags: ["Organization"],
          security: [{ bearerAuth: [] }],
          summary: "Excluir organização (admin)",
          params: z.object({
            slug: z.string(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        await prisma.organization.delete({
          where: { id: organizationId },
        });

        return reply.status(204).send(null);
      }
    );
};
