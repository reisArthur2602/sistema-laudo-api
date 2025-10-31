import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";

import { UnauthorizedError } from "../routes/_errors/unauthorized-error.js";

export const patientAuthPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook("preHandler", async (request) => {
    request.getCurrentPatientId = async () => {
      try {
        const { sub } = await request.jwtVerify<{
          sub: string;
        }>();

        return sub;
      } catch {
        throw new UnauthorizedError("Token de paciente inválido ou expirado.");
      }
    };
  });
});
