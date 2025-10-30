// src/http/routes/members/get-my-membership.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";

export const getMyMembership = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/members/me",
      {
        schema: {
          tags: ["Member"],
          security: [{ bearerAuth: [] }],
          summary: "Obter minha role na organização",
          params: z.object({ slug: z.string() }),
          response: {
            200: z.object({
              role: z.nativeEnum(Role),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { role } = await request.getOrgMembershipBySlug(slug);
        return reply.send({ role });
      }
    );
};
