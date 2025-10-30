// src/http/routes/equipments/update-equipment.ts
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { Role } from "@prisma/client";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const renameEquipment = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .patch(
      "/org/:slug/equipments/:equipmentId/:name",
      {
        schema: {
          tags: ["Equipment"],
          security: [{ bearerAuth: [] }],
          summary: "Atualizar equipamento (admin)",
          params: z.object({
            slug: z.string(),
            equipmentId: z.string(),
            name: z.string().min(2),
          }),

          response: {
            200: z.null(),
          },
        },
      },
      async (request, reply) => {
        const { slug, equipmentId, name } = request.params;

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

        await prisma.equipment.update({
          where: { id: equipmentId },
          data: { name },
          select: {
            id: true,
            name: true,
            organizationId: true,
            createdAt: true,
          },
        });

        return reply.status(200);
      }
    );
};
