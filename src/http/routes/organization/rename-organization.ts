// src/http/routes/organizations/rename-organization.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const renameOrganization = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .patch(
      "/org/:slug/:name",
      {
        schema: {
          tags: ["Organization"],
          security: [{ bearerAuth: [] }],
          summary: "Renomear organização (somente nome)",
          params: z.object({
            slug: z.string(),
            name: z.string().min(2, "Nome muito curto"),
          }),

          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, name } = request.params;

        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        await prisma.organization.update({
          where: { id: organizationId },
          data: { name },
          select: { id: true, name: true, slug: true, createdAt: true },
        });

        return reply.status(204).send(null);
      }
    );
};
