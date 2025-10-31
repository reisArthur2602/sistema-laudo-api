import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { Role } from "@prisma/client";
import { deleteFromFtp } from "../../../lib/ftp.js";

export const deleteStudyAttachment = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .delete(
      "/org/:slug/studies/:studyId/attachments/:attachmentId",
      {
        schema: {
          tags: ["Study"],
          security: [{ bearerAuth: [] }],
          summary: "Excluir anexo do Study (admin)",
          params: z.object({
            slug: z.string(),
            studyId: z.string(),
            attachmentId: z.string(),
          }),
          response: { 204: z.null() },
        },
      },
      async (request, reply) => {
        const { slug, studyId, attachmentId } = request.params;
        const { organizationId } = await request.requireOrgRole(
          slug,
          Role.SUPER_ADMIN
        );

        const attachment = await prisma.studyAttachment.findUnique({
          where: { id: attachmentId },
          select: {
            id: true,
            studyId: true,
            path: true,
            study: {
              select: { patient: { select: { organizationId: true } } },
            },
          },
        });

        if (
          !attachment ||
          attachment.studyId !== studyId ||
          attachment.study.patient.organizationId !== organizationId
        ) {
          throw new BadRequestError("Anexo não encontrado na organização.");
        }

        await deleteFromFtp(attachment.path);
        await prisma.studyAttachment.delete({ where: { id: attachmentId } });

        return reply.status(204).send(null);
      }
    );
};
