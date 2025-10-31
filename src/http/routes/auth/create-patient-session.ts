import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";

import { BadRequestError } from "../_errors/bad-request-error.js";

export const createPatientSession = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/auth/patient",
    {
      schema: {
        tags: ["Auth"],
        summary: "Autenticar paciente pelo CPF",
        body: z.object({
          cpf: z.string().min(11, "CPF inválido"),
        }),
        response: {
          200: z.object({
            token: z.string(),
            patient: z.object({
              id: z.string(),
              name: z.string(),
              cpf: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { cpf } = request.body;
      const normalizedCpf = cpf.replace(/\D/g, "");

      const patient = await prisma.patient.findUnique({
        where: { cpf: normalizedCpf },
        select: { id: true, name: true, cpf: true },
      });

      if (!patient) {
        throw new BadRequestError("Paciente não encontrado.");
      }

      const token = await reply.jwtSign(
        {
          patientId: patient.id,
        },

        { expiresIn: "7d" }
      );

      return reply.send({ token, patient });
    }
  );
};
