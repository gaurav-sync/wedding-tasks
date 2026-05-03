import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";

export const chatRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = await getDb();
    const messages = await db
      .collection("chatMessages")
      .find({})
      .sort({ timestamp: 1 })
      .toArray();
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));
  }),

  save: publicQuery
    .input(
      z.object({
        id: z.string(),
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        timestamp: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.collection("chatMessages").updateOne(
        { id: input.id },
        { $set: input },
        { upsert: true }
      );
      return { success: true };
    }),

  clear: publicQuery.mutation(async () => {
    const db = await getDb();
    await db.collection("chatMessages").deleteMany({});
    return { success: true };
  }),
});
