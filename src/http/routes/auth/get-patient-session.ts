import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { UnauthorizedError } from "../_errors/unauthorized-error.js";
import { authPlugin } from "../../plugins/auth.js";

export const getPatientSession = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get(
      "/auth/profile/patient",
      {
        schema: {
          tags: ["Auth"],
          summary: "Buscar sessão do pacient logado",
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              patient: z.object({
                id: z.string().cuid(),
                name: z.string(),
                cpf: z.string(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const patientId = await request.getCurrentPatientId();

        const patient = await prisma.patient.findUnique({
          where: { id: patientId },
          select: { id: true, name: true, cpf: true },
        });

        if (!patient) {
          throw new UnauthorizedError("Acesso negado");
        }

        reply.header("Cache-Control", "no-store");
        return reply.send({ patient });
      }
    );
};
