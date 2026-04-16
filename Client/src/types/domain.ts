/** Domain types aligned with Aura REST API responses. */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Environment {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  environments?: Environment[];
  features?: unknown[];
}

export interface FeatureRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  defaultEnabled: boolean;
  states: Record<string, boolean>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  projectId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  meta: {
    page: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthStatus {
  status: string;
}
