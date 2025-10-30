import "dotenv/config";

import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import multipart from "@fastify/multipart";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { errorHandler } from "./routes/error-handler.js";
import { createSession } from "./routes/auth/create-session.js";
import { getSession } from "./routes/auth/get-session.js";
import { createInvite } from "./routes/invite/create-invite.js";
import { notificationNewStudies } from "./routes/webhook/notification-new-studies.js";
import { acceptInvite } from "./routes/invite/accept-invite.js";
import { rejectInvite } from "./routes/invite/reject-invite.js";
import { listInvite } from "./routes/invite/list-invites.js";
import { createOrganization } from "./routes/organization/create-organization.js";
import { listOrganizations } from "./routes/organization/list-organizations.js";
import { deleteOrganization } from "./routes/organization/delete-organization.js";
import { listMembers } from "./routes/members/list-members.js";
import { getMyMembership } from "./routes/members/get-my-membership.js";
import { deleteMember } from "./routes/members/delete-member.js";
import { renameOrganization } from "./routes/organization/rename-organization.js";
import { deleteEquipment } from "./routes/equipament/delete-equipament.js";
import { createEquipment } from "./routes/equipament/create-equipament.js";
import { listEquipments } from "./routes/equipament/list-equipments.js";
import { renameEquipment } from "./routes/equipament/rename-equipament.js";
import { uploadStudyPdf } from "./routes/studies/upload-study-pdf.js";
import { listStudyAttachments } from "./routes/studies/list-study-attachments.js";
import { deleteStudyAttachment } from "./routes/studies/delete-study-attachment.js";

const PORT = Number(process.env.PORT) || 3333;

const server = fastify().withTypeProvider<ZodTypeProvider>();

server.setSerializerCompiler(serializerCompiler);
server.setValidatorCompiler(validatorCompiler);
server.setErrorHandler(errorHandler);

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "fallback-secret",
});

server.register(fastifyCors, {
  origin: "*",
});

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Central de Imagens Médicas - API",
      version: "1.0.0",
      description:
        "API responsável pela **centralização e gerenciamento de imagens médicas** provenientes do servidor **Orthanc**",
    },

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

server.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

server.register(createSession);
server.register(getSession);

server.register(createInvite);
server.register(acceptInvite);
server.register(rejectInvite);
server.register(listInvite);

server.register(createOrganization);
server.register(listOrganizations);
server.register(deleteOrganization);
server.register(renameOrganization);

server.register(listMembers);
server.register(getMyMembership);
server.register(deleteMember);

server.register(deleteEquipment);
server.register(createEquipment);
server.register(listEquipments);
server.register(renameEquipment);

server.register(uploadStudyPdf);
server.register(listStudyAttachments);
server.register(deleteStudyAttachment);

server.register(notificationNewStudies);

server.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
});

server.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`✅ Servidor rodando em ${PORT}`);
  console.log(`📘 Documentação Swagger: /docs`);
});
