import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import bcrypt from "bcryptjs";

export const createUserSession = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/create-session",
    {
      schema: {
        tags: ["Session"],
        summary: "Criar sessão do usuário",
        body: z.object({
          email: z
            .string("O email é obrigatório")
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

      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (!userWithSameEmail) {
        throw new BadRequestError("Credenciais inválidas");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        userWithSameEmail.password
      );

      if (!isPasswordValid) {
        throw new BadRequestError("Credenciais inválidas");
      }

      const token = await reply.jwtSign(
        { sub: userWithSameEmail.id },
        { sign: { expiresIn: "7d" } }
      );

      return reply.send({
        user: {
          id: userWithSameEmail.id,
          name: userWithSameEmail.name,
          email: userWithSameEmail.email,
        },
        token,
      });
    }
  );
};
