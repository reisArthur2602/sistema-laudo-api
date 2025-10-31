import type { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { authPlugin } from "../../plugins/auth.js";
import { BadRequestError } from "../_errors/bad-request-error.js";
import { uploadBufferToFtp } from "../../../lib/ftp.js";
import path from "node:path";

export const uploadStudyPdf = (app: FastifyInstance) => {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authPlugin)
    .post(
      "/org/:slug/studies/:studyId/attachments/pdf",
      {
        schema: {
          tags: ["Study"],
          security: [{ bearerAuth: [] }],
          summary: "Anexar PDF a um Study (salvando no FTP)",
          params: z.object({
            slug: z.string(),
            studyId: z.string(),
          }),
          response: {
            201: z.object({
              id: z.string(),
              filename: z.string(),
              mimeType: z.string(),
              size: z.number(),
              url: z.string(),
              createdAt: z.date(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { slug, studyId } = request.params;
        const { organizationId } = await request.getOrgMembershipBySlug(slug);

        const study = await prisma.study.findUnique({
          where: { id: studyId },
          select: {
            id: true,
            patient: { select: { organizationId: true } },
          },
        });

        if (!study || study.patient.organizationId !== organizationId) {
          throw new BadRequestError("Study não pertence à organização.");
        }

        const data = await request.file();
        if (!data) {
          throw new BadRequestError(
            "Envie um arquivo (multipart/form-data, campo 'file')."
          );
        }

        const mime = data.mimetype?.toLowerCase() || "";
        if (mime !== "application/pdf") {
          throw new BadRequestError("Apenas PDFs são permitidos.");
        }

        const fileBuffer = await data.toBuffer();
        if (!fileBuffer?.length) {
          throw new BadRequestError("Arquivo inválido.");
        }

        const original = data.filename || "document.pdf";
        const safeName = original.replace(/[^\w.\-]+/g, "_");
        const finalName = `${Date.now()}_${safeName}`;

        const remotePath = path.posix.join("studies", studyId, finalName);

        const uploadedUrl = await uploadBufferToFtp({
          remotePath,
          buffer: fileBuffer,
        });

        const created = await prisma.studyAttachment.create({
          data: {
            studyId,
            filename: original,
            mimeType: mime,
            size: fileBuffer.length,
            path: remotePath,
            url: uploadedUrl,
          },
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            url: true,
            createdAt: true,
          },
        });

        return reply.status(201).send(created);
      }
    );
};
