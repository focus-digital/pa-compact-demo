import type { UserRole } from "./enums";

export type User = {
  id: string;
  email: string;
  role: UserRole;
}