// src/http/routes/invites/create-invite.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const createInvite = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org/:slug/create-invite",
      {
        schema: {
          tags: ["Invite"],
          security: [{ bearerAuth: [] }],
          summary: "Criar um convite",
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            email: z
              .string("O email é obrigatório")
              .email("Formato de email inválido"),
            role: z.nativeEnum(Role),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { email, role } = request.body;
        const { slug } = request.params;

        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });

        if (!user) {
          throw new BadRequestError(
            "Não existe usuário cadastrado com este e-mail."
          );
        }

        const alreadyMember = await prisma.member.findFirst({
          where: { organizationId, user: { email } },
          select: { id: true },
        });

        if (alreadyMember) {
          throw new BadRequestError("Este e-mail já pertence à organização.");
        }

        const expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await prisma.invite.create({
          data: {
            email,
            role,
            expireAt,
            organizationId,
          },
        });

        return reply.status(201).send(null);
      }
    );
};
