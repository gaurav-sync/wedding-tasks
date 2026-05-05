import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";

export const EXPENSE_CATEGORIES = [
  "Venue",
  "Catering",
  "Attire",
  "Photography",
  "Decor",
  "Entertainment",
  "Gifts",
  "Travel",
  "Invitations",
  "Misc",
] as const;

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const expenseRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = await getDb();
    const docs = await db
      .collection("expenses")
      .find({})
      .sort({ spentOn: -1, createdAt: -1 })
      .toArray();
    return docs.map((e) => ({
      id: e._id.toString(),
      title: e.title as string,
      amountInr: e.amountInr as number,
      spentOn: e.spentOn as string,
      category: e.category as (typeof EXPENSE_CATEGORIES)[number],
      notes: (e.notes as string) ?? "",
    }));
  }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        amountInr: z
          .number()
          .positive("Amount must be greater than 0")
          .finite(),
        spentOn: dateStr,
        category: z.enum(EXPENSE_CATEGORIES),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const doc = {
        ...input,
        notes: input.notes?.trim() ?? "",
        createdAt: new Date(),
      };
      const result = await db.collection("expenses").insertOne(doc);
      return { id: result.insertedId.toString(), ...doc };
    }),

  update: publicQuery
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        amountInr: z.number().positive().finite().optional(),
        spentOn: dateStr.optional(),
        category: z.enum(EXPENSE_CATEGORIES).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, ...raw } = input;
      const updates: Record<string, unknown> = {};
      if (raw.title !== undefined) updates.title = raw.title;
      if (raw.amountInr !== undefined) updates.amountInr = raw.amountInr;
      if (raw.spentOn !== undefined) updates.spentOn = raw.spentOn;
      if (raw.category !== undefined) updates.category = raw.category;
      if (raw.notes !== undefined) updates.notes = raw.notes.trim();
      if (Object.keys(updates).length === 0) return { success: true };
      await db
        .collection("expenses")
        .updateOne({ _id: new ObjectId(id) }, { $set: updates });
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.collection("expenses").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
