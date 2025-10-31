// src/http/routes/studies/get-patient-studies.ts

import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const listOrganizationPatientStudies  = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/org/:slug/patients/:patientId/studies",
      {
        schema: {
          tags: ["Patient"],
          summary: "Listar estudos (exames) de um paciente",
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
            patientId: z.string(),
          }),
          response: {
            200: z.object({
              studies: z.array(
                z.object({
                  id: z.string(),
                  createdAt: z.date(),
                  instances: z.array(
                    z.object({
                      id: z.string(),
                      previewUrl: z.string().url(),
                      dicomUrl: z.string().url(),
                    })
                  ),
                })
              ),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, patientId } = request.params;
        const { organizationId } = await request.getOrgMembershipBySlug(slug);

        // Verifica se o paciente pertence à organização
        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { organizationId: true },
        });

        if (!patient || patient.organizationId !== organizationId) {
          throw new BadRequestError("Paciente não pertence à organização.");
        }

        const studies = await prisma.study.findMany({
          where: { patientId },
          select: {
            id: true,
            createdAt: true,
            instances: {
              select: { id: true, previewUrl: true, dicomUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ studies });
      }
    );
};
