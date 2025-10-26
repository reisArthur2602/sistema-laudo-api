import "dotenv/config";

import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import { errorHandler } from "./routes/error-handler.js";
import { createUserSession } from "./routes/user/auth-user.js";

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
      description: `
API responsável pela **centralização e gerenciamento de imagens médicas** provenientes do servidor **Orthanc**.

### Principais funcionalidades
- Autenticação e controle de acesso de usuários
- Integração com servidor Orthanc (PACS)
- Consulta e organização de estudos DICOM
- Suporte a múltiplas clínicas/unidades
      `,
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
});

server.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  staticCSP: true,
  uiConfig: {
    docExpansion: "full",
    deepLinking: true,
    defaultModelsExpandDepth: 2,
    persistAuthorization: true,
  },
});

server.register(createUserSession);

const PORT = Number(process.env.PORT) || 3333;
const HOST = process.env.HOST || "localhost";

server.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`✅ Servidor rodando em: http://${HOST}:${PORT}`);
  console.log(`📘 Documentação Swagger: http://${HOST}:${PORT}/docs`);
});
