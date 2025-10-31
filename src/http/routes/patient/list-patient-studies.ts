import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { patientAuthPlugin } from "../../plugins/patient.js";

export const listPatientStudies = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(patientAuthPlugin)
    .get(
      "/patient/studies",
      {
        schema: {
          tags: ["Patient"],
          summary: "Listar todos os exames do paciente autenticado",
          security: [{ bearerAuth: [] }],
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
        const patientId = await request.getCurrentPatientId();

        const studies = await prisma.study.findMany({
          where: { patientId },
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
