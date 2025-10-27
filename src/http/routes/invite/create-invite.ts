import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { authPlugin } from "../../plugins/auth.js";
import { transporter } from "../../../lib/nodemailer.js";

export const createInvite = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/create-invite",
      {
        schema: {
          tags: ["Invite"],
          security: [{ bearerAuth: [] }],
          summary: "Criar um convite",
          body: z.object({
            email: z
              .string("O email é obrigatório")
              .email("Formato de email inválido"),
            organizationId: z
              .string("O id da organização é obrigatório")
              .cuid(),
          }),
          response: {
            201: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { email, organizationId } = request.body;

        const memberWithSameEmail = await prisma.member.findFirst({
          where: { organizationId, user: { email } },
        });

        if (memberWithSameEmail)
          throw new BadRequestError("Este email já esta em uso");

        const token = await reply.jwtSign(
          { email },
          { sign: { expiresIn: "7d" } }
        );

        const inviteUrl = `http://localhost:3000/acesso/convite?token=${token}`;

        await transporter.sendMail({
          from: `Suporte Grupo Master - <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Convite para criar sua conta",
          html: `Você foi convidado para uma organização ${inviteUrl}`,
        });

        return reply.status(201);
      }
    );
};
