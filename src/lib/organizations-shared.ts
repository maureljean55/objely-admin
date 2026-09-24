// Safe to import from Client Components: types and constants only, no database access.

export const ORGANIZATION_TYPES = {
  ecole: "École",
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
} as const;

export type OrganizationType = keyof typeof ORGANIZATION_TYPES;

/** Everything asked when registering an establishment. */
export type OrganizationInput = {
  name: string;
  type: OrganizationType;
  city: string;
  address: string;
  phone: string;
  contactEmail: string;
  /** Days an unclaimed object is kept before it can be donated. */
  retentionDays: number;
  /** Help-desk number shown on the establishment's bornes. */
  helpDesk: string;
  /** The establishment's administrator: their e-mail is the sign-in identifier. */
  adminName: string;
  adminEmail: string;
};

/** What can be edited afterwards (the administrator account is not edited here). */
export type OrganizationEdit = Omit<OrganizationInput, "adminName" | "adminEmail">;

export type OrganizationSummary = {
  id: string;
  name: string;
  type: OrganizationType;
  city: string | null;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  retentionDays: number;
  helpDesk: string | null;
  createdAt: string;
  /** Set while the establishment is suspended. */
  suspendedAt: string | null;
  admin: { name: string; email: string; lastSeenAt: string | null } | null;
};

/** Shown once, right after creation or a password reset. It is never stored in clear. */
export type Credentials = { organizationName: string; email: string; password: string; loginUrl: string };

export type FieldName = keyof OrganizationInput;
export type ActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; field?: FieldName };

export const DEFAULT_RETENTION_DAYS = 60;
