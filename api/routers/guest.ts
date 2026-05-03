import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";

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
  list: publicQuery.query(async () => {
    const db = await getDb();
    const guests = await db.collection("guests").find({}).toArray();
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      const existing = await db.collection("guests").findOne({
        name: { $regex: new RegExp(`^${input.name.trim()}$`, "i") },
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...updates } = input;
      await db
        .collection("guests")
        .updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.collection("guests").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
