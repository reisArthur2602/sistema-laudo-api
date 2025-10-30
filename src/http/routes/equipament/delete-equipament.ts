// src/http/routes/equipments/delete-equipment.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const deleteEquipment = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .delete(
      "/org/:slug/equipments/:equipmentId",
      {
        schema: {
          tags: ["Equipment"],
          security: [{ bearerAuth: [] }],
          summary: "Excluir equipamento (admin)",
          params: z.object({ slug: z.string(), equipmentId: z.string() }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, equipmentId } = request.params;
        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        const exists = await prisma.equipment.findUnique({
          where: { id: equipmentId },
          select: { id: true, organizationId: true },
        });

        if (!exists || exists.organizationId !== organizationId) {
          throw new BadRequestError(
            "Equipamento não encontrado nesta organização."
          );
        }

        await prisma.equipment.delete({ where: { id: equipmentId } });

        return reply.status(204).send(null);
      }
    );
};
