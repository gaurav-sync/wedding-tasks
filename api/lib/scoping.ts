import { TRPCError } from "@trpc/server";
import { USER_GAURAV } from "./users";
import type { Filter } from "mongodb";

/** Tasks visible to this user (assigned to them). */
export function taskListFilter(username: string): Filter<unknown> {
  if (username === USER_GAURAV) {
    return {
      $or: [{ assignedTo: USER_GAURAV }, { assignedTo: { $exists: false } }],
    };
  }
  return { assignedTo: username };
}

/** Guests / shopping rows visible to this login. */
export function listFilterForOwner(username: string): Filter<unknown> {
  if (username === USER_GAURAV) {
    return { $or: [{ ownerId: USER_GAURAV }, { ownerId: { $exists: false } }] };
  }
  return { ownerId: username };
}

export function docBelongsToOwner(
  doc: { ownerId?: string } | null | undefined,
  username: string,
): boolean {
  if (!doc) return false;
  const owner = doc.ownerId ?? USER_GAURAV;
  if (username === USER_GAURAV) {
    return owner === USER_GAURAV || doc.ownerId === undefined;
  }
  return owner === username;
}

export function assertOwnerDoc(doc: unknown, username: string): void {
  const d = doc as { ownerId?: string } | null;
  if (!d) throw new TRPCError({ code: "NOT_FOUND", message: "Not found" });
  if (!docBelongsToOwner(d, username)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not allowed" });
  }
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
