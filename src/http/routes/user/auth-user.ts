import { type FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

export const createUserSession = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/auth",
    {
      schema: {
        tags: ["auth"],
        summary: "Autenticar usuário",
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
            accessToken: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      console.log({ email, password });

      const accessToken = await reply.jwtSign(
        { id: 1 },
        { sign: { expiresIn: "7d" } }
      );
      return reply.status(200).send({ accessToken });
    }
  );
};
