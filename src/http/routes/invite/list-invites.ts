import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const listInvites = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/invites",
      {
        schema: {
          tags: ["Invite"],
          summary: "Listar convites recebidos pelo usuário logado",
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              invites: z.array(
                z.object({
                  id: z.string().cuid(),
                  email: z.string().email(),
                  role: z.enum(["SUPER_ADMIN", "MEMBER"]),
                  organization: z.object({
                    id: z.string().cuid(),
                    name: z.string(),
                    slug: z.string(),
                  }),
                  expireAt: z.date(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId();

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        if (!user) throw new BadRequestError("Usuário não encontrado.");

        const invites = await prisma.invite.findMany({
          where: { email: user.email },
          include: {
            organization: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { expireAt: "desc" },
        });

        return reply.status(200).send({ invites });
      }
    );
};
