import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";
import {
  assertOwnerDoc,
  escapeRegex,
  listFilterForOwner,
} from "../lib/scoping";

const GUEST_STATUSES = [
  "Not Contacted",
  "Texted",
  "Called",
  "Declined",
] as const;

type GuestStatus = (typeof GUEST_STATUSES)[number];

function normalizeGuestStatus(raw: unknown): GuestStatus {
  const s = String(raw ?? "");
  if (GUEST_STATUSES.includes(s as GuestStatus)) return s as GuestStatus;
  if (s === "Invited") return "Not Contacted";
  if (s === "Confirmed") return "Called";
  return "Not Contacted";
}

export const guestRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = await getDb();
    const filter = listFilterForOwner(ctx.user.username);
    const guests = await db.collection("guests").find(filter).toArray();
    return guests.map((g) => ({
      id: g._id.toString(),
      name: g.name,
      phone: g.phone ?? "",
      group: g.group,
      status: normalizeGuestStatus(g.status),
    }));
  }),

  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().optional(),
        group: z.enum(["Family", "Friends", "Work", "Other"]),
        status: z.enum(GUEST_STATUSES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const ownerFilter = listFilterForOwner(ctx.user.username);
      const existing = await db.collection("guests").findOne({
        $and: [
          { name: { $regex: new RegExp(`^${escapeRegex(input.name.trim())}$`, "i") } },
          ownerFilter,
        ],
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `"${input.name.trim()}" is already in your guest list.`,
        });
      }
      const doc = {
        ...input,
        phone: input.phone ?? "",
        ownerId: ctx.user.username,
        createdAt: new Date(),
      };
      const result = await db.collection("guests").insertOne(doc);
      return { id: result.insertedId.toString(), ...doc };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        group: z.enum(["Family", "Friends", "Work", "Other"]).optional(),
        status: z.enum(GUEST_STATUSES).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const { id, ...updates } = input;
      const found = await db
        .collection("guests")
        .findOne({ _id: new ObjectId(id) });
      assertOwnerDoc(found, ctx.user.username);
      await db
        .collection("guests")
        .updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const found = await db
        .collection("guests")
        .findOne({ _id: new ObjectId(input.id) });
      assertOwnerDoc(found, ctx.user.username);
      await db.collection("guests").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
