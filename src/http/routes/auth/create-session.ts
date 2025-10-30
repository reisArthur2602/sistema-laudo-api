import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const createSession = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/auth",
    {
      schema: {
        tags: ["Auth"],
        security: [],
        summary: "Criar sessão do usuário",
        body: z.object({
          email: z
            .string("O email é obrigatório")
            .trim()
            .min(1, "O email é obrigatório")
            .email("Formato de email inválido"),
          password: z
            .string("A senha é obrigatória")
            .min(6, "A senha deve conter pelo menos 6 caracteres"),
        }),
        response: {
          200: z.object({
            user: z.object({
              id: z.string().cuid(),
              name: z.string(),
              email: z.string().email(),
            }),
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, password: true },
      });

      if (!user) {
        throw new BadRequestError("Credenciais inválidas");
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestError("Credenciais inválidas");
      }

      const token = await reply.jwtSign({
        sub: user.id,
        email: user.email,
      });

      reply.header("Cache-Control", "no-store");

      return reply.send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    }
  );
};
