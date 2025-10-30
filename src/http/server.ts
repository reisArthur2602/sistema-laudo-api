// server.ts (ou server.js, se preferir ESM)
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

// ── Routes / plugins locais ────────────────────────────────────────────────────
import { errorHandler } from "./routes/error-handler.js";

// Auth
import { createSession } from "./routes/auth/create-session.js";
import { getSession } from "./routes/auth/get-session.js";

// Invites
import { createInvite } from "./routes/invite/create-invite.js";
import { acceptInvite } from "./routes/invite/accept-invite.js";
import { rejectInvite } from "./routes/invite/reject-invite.js";
import { listInvite } from "./routes/invite/list-invites.js";

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

// ── Configuração básica ────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || "0.0.0.0";
const PUBLIC_URL = (process.env.PUBLIC_URL || "").replace(/\/+$/, ""); // opcional

const server = fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

server.setSerializerCompiler(serializerCompiler);
server.setValidatorCompiler(validatorCompiler);
server.setErrorHandler(errorHandler);

// ── Segurança / CORS ──────────────────────────────────────────────────────────
server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "fallback-secret",
});

server.register(fastifyCors, {
  origin: true, // use "*" se realmente precisar liberar tudo
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// ── Multipart (upload) ────────────────────────────────────────────────────────
server.register(multipart, {
  attachFieldsToBody: true,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
    files: 1,
  },
});

// ── Swagger / OpenAPI ─────────────────────────────────────────────────────────
// Dica: mantenha as tags declaradas aqui e reutilize-as nas rotas (schema.tags)
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

// Invites
server.register(createInvite);
server.register(acceptInvite);
server.register(rejectInvite);
server.register(listInvite);

// Organizations
server.register(createOrganization);
server.register(listOrganizations);
server.register(deleteOrganization);
server.register(renameOrganization);

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
server.register(uploadStudyPdf);
server.register(listStudyAttachments);
server.register(deleteStudyAttachment);

// Webhooks
server.register(notificationNewStudies);

// ── Boot ──────────────────────────────────────────────────────────────────────
server.listen({ port: PORT, host: HOST }).then(() => {
  server.log.info(`✅ Servidor rodando em http://${HOST}:${PORT}`);
  server.log.info(`📘 Swagger UI: /docs`);
});
