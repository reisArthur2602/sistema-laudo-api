// src/http/routes/members/remove-member.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const deleteMember = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .delete(
      "/org/:slug/members/:memberId",
      {
        schema: {
          tags: ["Member"],
          security: [{ bearerAuth: [] }],
          summary: "Remover membro (admin)",
          params: z.object({ slug: z.string(), memberId: z.string() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, memberId } = request.params;
        const currentUserId = await request.getCurrentUserId();
        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        const member = await prisma.member.findUnique({
          where: { id: memberId },
          select: { id: true, role: true, userId: true, organizationId: true },
        });

        if (!member || member.organizationId !== organizationId) {
          throw new BadRequestError("Membro não encontrado na organização.");
        }

        if (member.role === Role.SUPER_ADMIN) {
          const superAdmins = await prisma.member.count({
            where: { organizationId, role: Role.SUPER_ADMIN },
          });
          if (superAdmins <= 1) {
            throw new BadRequestError(
              "Não é permitido remover o último SUPER_ADMIN."
            );
          }
        }

        if (member.userId === currentUserId) {
          throw new BadRequestError("Não é permitido remover a si mesmo.");
        }

        await prisma.member.delete({ where: { id: memberId } });
        return reply.status(204).send(null);
      }
    );
};
