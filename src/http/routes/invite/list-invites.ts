// src/http/routes/invites/create-invite.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const listInvite = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/invites",
      {
        schema: {
          tags: ["Invite"],
          security: [{ bearerAuth: [] }],
          summary: "Listar convites da organização (admin)",
          params: z.object({
            slug: z.string(),
          }),

          response: {
            200: z.array(
              z.object({
                id: z.string(),
                email: z.string().email(),
                role: z.nativeEnum(Role),
                expireAt: z.date(),
              })
            ),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        await request.requireOrgRole(slug, Role.SUPER_ADMIN);

        const invites = await prisma.invite.findMany({
          where: { expireAt: { gt: new Date() } },
          select: { id: true, email: true, role: true, expireAt: true },
          orderBy: { expireAt: "asc" },
        });

        return reply.send(invites);
      }
    );
};
