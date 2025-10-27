import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { UnauthorizedError } from "../_errors/unauthorized-error.js";
import { authPlugin } from "../../plugins/auth.js";
import { transporter } from "../../../lib/nodemailer.js";
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
        const userId = await request.getCurrentUserId();

        const member = await prisma.member.findFirst({
          where: {
            userId,
            organization: { id: slug },
          },
          select: { role: true, organizationId: true },
        });

        if (!member) {
          throw new UnauthorizedError("Você não pertence a esta organização.");
        }

        if (member.role !== "SUPER_ADMIN") {
          throw new UnauthorizedError(
            "Apenas administradores podem criar convites."
          );
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: { organizationId: member.organizationId, user: { email } },
        });

        if (memberWithSameEmail) {
          throw new BadRequestError("Este email já está em uso.");
        }

        const token = await reply.jwtSign(
          { email },
          { sign: { expiresIn: "7d" } }
        );

        await prisma.invite.create({
          data: {
            email,
            organizationId: member.organizationId,
            token,
            role,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        const inviteUrl = `http://localhost:3000/acesso/convite?token=${token}`;

        await transporter.sendMail({
          from: `Suporte Grupo Master <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Convite para criar sua conta",
          html: `Você foi convidado para participar de uma organização. Clique para aceitar: <a href="${inviteUrl}">${inviteUrl}</a>`,
        }); 

        return reply.status(201).send(null);
      }
    );
};
