// src/http/routes/organizations/list-organizations.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const listOrganizations = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org",
      {
        schema: {
          tags: ["Organization"],
          security: [{ bearerAuth: [] }],
          summary: "Listar organizações do usuário",
          response: {
            200: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                slug: z.string(),
                createdAt: z.date(),
              })
            ),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const organizations = await prisma.organization.findMany({
          where: { members: { some: { userId } } },
          orderBy: { name: "asc" },
        });

        return reply.send(organizations);
      }
    );
};
