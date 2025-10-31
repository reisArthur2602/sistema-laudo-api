import "dotenv/config";

import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import multipart, { fastifyMultipart } from "@fastify/multipart";

import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { errorHandler } from "./routes/error-handler.js";

// Auth
import { createSession } from "./routes/auth/create-session.js";
import { getSession } from "./routes/auth/get-session.js";

// Invites
import { createInvite } from "./routes/invite/create-invite.js";
import { acceptInvite } from "./routes/invite/accept-invite.js";
import { rejectInvite } from "./routes/invite/reject-invite.js";

// Organizations
import { createOrganization } from "./routes/organization/create-organization.js";
import { listOrganizations } from "./routes/organization/list-organizations.js";
import { deleteOrganization } from "./routes/organization/delete-organization.js";
import { renameOrganization } from "./routes/organization/rename-organization.js";

// Members
import { listMembers } from "./routes/members/list-members.js";
import { getMyMembership } from "./routes/members/get-my-membership.js";
import { deleteMember } from "./routes/members/delete-member.js";

// Equipments
import { deleteEquipment } from "./routes/equipament/delete-equipament.js";
import { createEquipment } from "./routes/equipament/create-equipament.js";
import { listEquipments } from "./routes/equipament/list-equipments.js";
import { renameEquipment } from "./routes/equipament/rename-equipament.js";

// Studies
import { uploadStudyPdf } from "./routes/studies/upload-study-pdf.js";
import { listStudyAttachments } from "./routes/studies/list-study-attachments.js";
import { deleteStudyAttachment } from "./routes/studies/delete-study-attachment.js";

// Webhooks
import { notificationNewStudies } from "./routes/webhook/notification-new-studies.js";
import { listStudies } from "./routes/studies/list-studies.js";
import { listPatients } from "./routes/patient/list-patients.js";
import { listInvites } from "./routes/invite/list-invites.js";
import { getOrganization } from "./routes/organization/get-organization.js";
import { listOrganizationPatientStudies } from "./routes/studies/list-organization-patient-studies.js";
import { createPatientSession } from "./routes/auth/create-patient-session.js";
import { getPatientLastStudy } from "./routes/patient/get-patient-last-study.js";
import { listPatientStudies } from "./routes/patient/list-patient-studies.js";
import { getPatientSession } from "./routes/auth/get-patient-session.js";

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, "");

const server = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

server.setSerializerCompiler(serializerCompiler);
server.setValidatorCompiler(validatorCompiler);
server.setErrorHandler(errorHandler);

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "fallback-secret",
});

server.register(fastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

server.register(fastifyMultipart);

server.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Central de Imagens Médicas — API",
      version: "1.0.0",
      description:
        "API para **centralização e gerenciamento de imagens médicas** integradas ao **Orthanc**. " +
        "Inclui autenticação JWT, convites/organizações, membros, equipamentos e anexos de estudos.",
    },
    servers: [
      ...(PUBLIC_URL ? [{ url: PUBLIC_URL, description: "Produção" }] : []),
      { url: "http://localhost:3333", description: "Desenvolvimento" },
    ],
    externalDocs: {
      description: "Documentação do Orthanc",
      url: "https://book.orthanc-server.com/",
    },
    tags: [
      { name: "Auth", description: "Autenticação e sessão (JWT)" },
      { name: "Invite", description: "Convites de acesso e fluxo de aceite" },
      { name: "Organization", description: "Organizações e gestão" },
      { name: "Member", description: "Membros e associação" },
      { name: "Equipment", description: "Equipamentos de imagem" },
      { name: "Study", description: "Estudos, uploads e anexos" },
      { name: "Webhook", description: "Integrações (ex.: Orthanc)" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },

    security: [{ bearerAuth: [] }],
  },
  transform: jsonSchemaTransform,
});

server.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    displayRequestDuration: true,
    syntaxHighlight: { activate: true },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  theme: {
    title: "Central de Imagens — API Docs",
  },
});

// Auth
server.register(createSession);
server.register(getSession);
server.register(getPatientSession);
server.register(createPatientSession);

// Invites
server.register(createInvite);
server.register(acceptInvite);
server.register(rejectInvite);
server.register(listInvites);

// Organizations
server.register(createOrganization);
server.register(listOrganizations);
server.register(deleteOrganization);
server.register(renameOrganization);
server.register(getOrganization);

// Members
server.register(listMembers);
server.register(getMyMembership);
server.register(deleteMember);

// Equipments
server.register(createEquipment);
server.register(listEquipments);
server.register(renameEquipment);
server.register(deleteEquipment);

// Studies
server.register(listStudies);
server.register(uploadStudyPdf);
server.register(listStudyAttachments);
server.register(deleteStudyAttachment);
server.register(listOrganizationPatientStudies);

// Patiente
server.register(listPatients);
server.register(getPatientLastStudy);
server.register(listPatientStudies);

// Webhooks
server.register(notificationNewStudies);

// ── Boot ──────────────────────────────────────────────────────────────────────
server.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  server.log.info(`✅ Servidor rodando em http://${HOST}:${PORT}`);
  server.log.info(`📘 Swagger UI: /docs`);
});
