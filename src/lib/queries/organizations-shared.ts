// Safe to import from Client Components (no server-only, no database access).
export const ORGANIZATION_TYPES = {
  ecole: "École",
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
  autre: "Autre",
} as const;

export type OrganizationType = keyof typeof ORGANIZATION_TYPES;
