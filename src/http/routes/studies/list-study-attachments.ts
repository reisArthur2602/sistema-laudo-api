
import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const listStudyAttachments = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .get("/org/:slug/studies/:studyId/attachments", {
      schema: {
        tags: ["Study"],
        security: [{ bearerAuth: [] }],
        summary: "Listar anexos do Study",
        params: z.object({ slug: z.string(), studyId: z.string() }),
        response: {
          200: z.array(z.object({
            id: z.string(),
            filename: z.string(),
            mimeType: z.string(),
            size: z.number(),
            url: z.string(),
            createdAt: z.date(),
          })),
        },
      },
    }, async (request, reply) => {
      const { slug, studyId } = request.params;
      const { organizationId } = await request.getOrgMembershipBySlug(slug);

      const study = await prisma.study.findUnique({
        where: { id: studyId },
        select: { id: true, patient: { select: { organizationId: true } } },
      });
      if (!study || study.patient.organizationId !== organizationId) {
        throw new BadRequestError("Study não pertence à organização.");
      }

      const items = await prisma.studyAttachment.findMany({
        where: { studyId },
        select: { id: true, filename: true, mimeType: true, size: true, url: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(items);
    });
};
