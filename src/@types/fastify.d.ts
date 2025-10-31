// src/types/fastify.d.ts
import "fastify";
import { Role } from "@prisma/client";

declare module "fastify" {
  interface FastifyRequest {
    getCurrentUserId(): Promise<string>;
    getCurrentPatientId: () => Promise<string>;
    getOrgMembershipBySlug(
      slug: string
    ): Promise<{ organizationId: string; role: Role }>;

    requireOrgRole(
      slug: string,
      allowed: Role[] | Role
    ): Promise<{ organizationId: string; role: Role }>;
  }
}
