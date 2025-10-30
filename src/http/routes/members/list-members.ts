// src/http/routes/members/list-members.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const listMembers = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/members",
      {
        schema: {
          tags: ["Member"],
          security: [{ bearerAuth: [] }],
          summary: "Listar membros da organização",
          params: z.object({ slug: z.string() }),
          response: {
            200: z.array(
              z.object({
                id: z.string(),
                role: z.nativeEnum(Role),
                user: z.object({
                  id: z.string(),
                  name: z.string(),
                  email: z.string().email(),
                }),
                createdAt: z.date(),
              })
            ),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        const members = await prisma.member.findMany({
          where: { organizationId },
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: [{ createdAt: "asc" }],
        });

        return reply.send(members);
      }
    );
};
