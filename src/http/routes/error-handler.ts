import { type FastifyInstance } from "fastify";

import { BadRequestError } from "./_errors/bad-request-error.js";
import { UnauthorizedError } from "./_errors/unauthorized-error.js";

type FastifyErrorHandler = FastifyInstance["errorHandler"];

export const errorHandler: FastifyErrorHandler = (error, _, reply) => {
  if ((error as any).code === "FST_ERR_VALIDATION") {
    const validation = (error as any).validation ?? [];
    return reply.status(400).send({
      message: "Validation error",
      errors: validation.map((v: any) => ({
        field: v.instancePath?.replace("/", "") || "(root)",
        message: v.message,
      })),
    });
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    });
  }

  console.error(error);

  return reply.status(500).send({ message: "Internal server error" });
};
