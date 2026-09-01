import type { UserRole } from "@prisma/client";

export function hasAnyRole(role: UserRole | string | undefined, allowedRoles: UserRole[]): boolean {
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role as UserRole);
}

export function isStudent(role: UserRole | string | undefined): boolean {
  return hasAnyRole(role, ["STUDENT"]);
}

export function isLecturer(role: UserRole | string | undefined): boolean {
  return hasAnyRole(role, ["LECTURER"]);
}

export function isAdmin(role: UserRole | string | undefined): boolean {
  return hasAnyRole(role, ["ADMIN"]);
}
