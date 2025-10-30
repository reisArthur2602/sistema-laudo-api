import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../../../lib/prisma.js";
import { BadRequestError } from "../_errors/bad-request-error.js";

export const notificationNewStudies = (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/notification-new-studies",
    {
      schema: {
        tags: ["Webhook"],
        summary: "Receber notificação de novo estudo do Orthanc",
        body: z.object({
          id: z.string(),
          patientName: z.string(),
          patientId: z.string(),
          studyDate: z.string(),
          studyID: z.string(),
          manufacturer: z.string(),
          instances: z.array(
            z.object({
              id: z.string(),
              previewURL: z.string().url(),
              dicomURL: z.string().url(),
            })
          ),
        }),
        response: {
          200: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { manufacturer, patientName, instances } = request.body;

      const cpf = "21320549756";

      const equipment = await prisma.equipment.findFirst({
        where: { name: manufacturer },
        include: { organization: true },
      });

      if (!equipment) {
        throw new BadRequestError(
          "Fabricante não encontrado nas tabelas de equipamentos."
        );
      }

      await prisma.patient.upsert({
        where: { cpf },
        create: {
          name: patientName,
          cpf,
          organizationId: equipment.organizationId,
          studies: {
            create: {
              instances: {
                create: instances.map((i) => ({
                  previewUrl: i.previewURL,
                  dicomUrl: i.dicomURL,
                })),
              },
            },
          },
        },
        update: {
          studies: {
            create: {
              instances: {
                create: instances.map((i) => ({
                  previewUrl: i.previewURL,
                  dicomUrl: i.dicomURL,
                })),
              },
            },
          },
        },
        include: {
          studies: {
            include: { instances: true },
          },
        },
      });

      return reply.status(200).send(null);
    }
  );
};
