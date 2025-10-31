import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const getOrganization = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug",
      {
        schema: {
          tags: ["Organization"],
          summary: "Buscar uma organização pelo slug",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              organization: z.object({
                id: z.string().cuid(),
                name: z.string(),
                slug: z.string(),
                createdAt: z.date(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const organization = await prisma.organization.findUnique({
          where: { slug },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        });

        if (!organization) {
          throw new BadRequestError("Organização não encontrada.");
        }

        return reply.status(200).send({ organization });
      }
    );
};
