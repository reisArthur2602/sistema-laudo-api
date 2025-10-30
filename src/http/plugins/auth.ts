// src/http/plugins/auth.ts (ou caminho equivalente)
import type { FastifyInstance } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { prisma } from "../../lib/prisma.js"; 
import { UnauthorizedError } from "../routes/_errors/unauthorized-error.js";
import { Role } from "@prisma/client";

export const authPlugin = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook("preHandler", async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>();
        return sub;
      } catch {
        throw new UnauthorizedError("Token inválido ou expirado");
      }
    };

    request.getOrgMembershipBySlug = async (slug: string) => {
      const userId = await request.getCurrentUserId();


      const org = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!org) {

        throw new UnauthorizedError("Você não pertence a esta organização.");
      }

      const member = await prisma.member.findFirst({
        where: { userId, organizationId: org.id },
        select: { role: true, organizationId: true },
      });

      if (!member) {
        throw new UnauthorizedError("Você não pertence a esta organização.");
      }

      return { organizationId: member.organizationId, role: member.role };
    };

    request.requireOrgRole = async (slug: string, allowed: Role[] | Role) => {
      const roles = Array.isArray(allowed) ? allowed : [allowed];
      const membership = await request.getOrgMembershipBySlug(slug);

      if (!roles.includes(membership.role)) {
        throw new UnauthorizedError("Permissão insuficiente para esta ação.");
      }

      return membership;
    };
  });
});
