import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";

export const shoppingRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = await getDb();
    const items = await db.collection("shopping").find({}).toArray();
    return items.map((i) => ({
      id: i._id.toString(),
      itemName: i.itemName,
      category: i.category,
      isPurchased: i.isPurchased,
    }));
  }),

  create: publicQuery
    .input(
      z.object({
        itemName: z.string().min(1),
        category: z.enum(["Decor", "Attire", "Venue", "Catering", "Misc", "Gifts"]),
        isPurchased: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.collection("shopping").insertOne({
        ...input,
        createdAt: new Date(),
      });
      return { id: result.insertedId.toString(), ...input };
    }),

  toggle: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const item = await db.collection("shopping").findOne({ _id: new ObjectId(input.id) });
      if (item) {
        await db
          .collection("shopping")
          .updateOne(
            { _id: new ObjectId(input.id) },
            { $set: { isPurchased: !item.isPurchased } }
          );
      }
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.collection("shopping").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
