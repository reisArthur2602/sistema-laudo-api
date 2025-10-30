import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { UnauthorizedError } from "../_errors/unauthorized-error.js";
import { authPlugin } from "../../plugins/auth.js";

export const getSession = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/auth/profile",
      {
        schema: {
          tags: ["Auth"],
          summary: "Buscar sessão do usuário logado",
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.string().cuid(),
                name: z.string(),
                email: z.string().email(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, email: true },
        });

        if (!user) {
          throw new UnauthorizedError("Acesso negado");
        }

        reply.header("Cache-Control", "no-store");
        return reply.send({ user });
      }
    );
};
