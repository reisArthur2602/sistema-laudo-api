// src/http/routes/invites/create-invite.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const acceptInvite = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org/:slug/invites/accept",
      {
        schema: {
          tags: ["Invite"],
          security: [{ bearerAuth: [] }],
          summary: "Aceitar convite (usuário convidado)",
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
          select: { id: true, email: true },
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
            expireAt: { gt: new Date() },
          },
          select: {
            id: true,
            role: true,
            organizationId: true,
            email: true,
            expireAt: true,
          },
        });

        if (!invite) {
          throw new BadRequestError(
            "Nenhum convite válido encontrado para este usuário."
          );
        }

        const existingMember = await prisma.member.findFirst({
          where: { organizationId: org.id, userId },
          select: { id: true },
        });

        if (existingMember) {
          throw new BadRequestError("Você já é membro desta organização.");
        }

        await prisma.$transaction(async (tx) => {
          await tx.member.create({
            data: {
              userId,
              organizationId: org.id,
              role: invite.role,
            },
          });

          await tx.invite.delete({
            where: { id: invite.id },
          });
        });

        return reply.status(204).send(null);
      }
    );
};
