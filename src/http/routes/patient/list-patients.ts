import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";

export const listPatients = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/patients",
      {
        schema: {
          tags: ["Patient"],
          summary: "Listar/buscar pacientes da organização",
          security: [{ bearerAuth: [] }],
          params: z.object({ slug: z.string() }),

          response: {
            200: z.object({
              patients: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  cpf: z.string(),
                  createdAt: z.date(),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug } = request.params;
        const { organizationId } = await request.getOrgMembershipBySlug(slug);
        
        const patients = await prisma.patient.findMany({
          where: { organization: { slug } },
        });

        return reply.send({ patients });
      }
    );
};
