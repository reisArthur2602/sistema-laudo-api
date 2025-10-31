import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";

export const listStudies = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/studies",
      {
        schema: {
          tags: ["Study"],
          summary: "Listar estudos (exames) da organização com filtros",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),

          response: {
            200: z.object({
              studies: z.array(
                z.object({
                  id: z.string(),
                  createdAt: z.date(),
                  patient: z.object({
                    id: z.string(),
                    name: z.string(),
                    cpf: z.string(),
                  }),
                  instances: z
                    .array(
                      z.object({
                        id: z.string(),
                        previewUrl: z.string().url(),
                        dicomUrl: z.string().url(),
                      })
                    )
                    .optional(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;

        const { organizationId } = await request.getOrgMembershipBySlug(slug);

        const studies = await prisma.study.findMany({
          where: {
            patient: { organizationId },
          },
          select: {
            id: true,
            createdAt: true,
            patient: {
              select: { id: true, name: true, cpf: true },
            },

            instances: {
              select: { id: true, previewUrl: true, dicomUrl: true },
              orderBy: { id: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ studies });
      }
    );
};
