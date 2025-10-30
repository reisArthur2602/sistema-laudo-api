// src/http/routes/invites/create-invite.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { authPlugin } from "../../plugins/auth.js";

export const rejectInvite = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org/:slug/invites/reject",
      {
        schema: {
          tags: ["Invite"],
          security: [{ bearerAuth: [] }],
          summary: "Rejeitar convite (usuário convidado)",
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

        const userId = await request.getCurrentUserId();

        const me = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (!me?.email) {
          throw new BadRequestError("Usuário sem e-mail cadastrado.");
        }

        const org = await prisma.organization.findUnique({
          where: { slug },
          select: { id: true },
        });

        if (!org) {
          throw new BadRequestError("Convite inválido ou não encontrado.");
        }

        const invite = await prisma.invite.findUnique({
          where: {
            email_organizationId: { email: me.email, organizationId: org.id },
          },
          select: { id: true, expireAt: true },
        });

        if (!invite) {
          throw new BadRequestError(
            "Nenhum convite encontrado para este usuário."
          );
        }

 
        await prisma.invite.delete({
          where: { id: invite.id },
        });

        return reply.status(204).send(null);
      }
    );
};
