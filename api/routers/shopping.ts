import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";
import { assertOwnerDoc, listFilterForOwner } from "../lib/scoping";

export const shoppingRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = await getDb();
    const items = await db
      .collection("shopping")
      .find(listFilterForOwner(ctx.user.username))
      .toArray();
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
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const result = await db.collection("shopping").insertOne({
        ...input,
        ownerId: ctx.user.username,
        createdAt: new Date(),
      });
      return { id: result.insertedId.toString(), ...input };
    }),

  toggle: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const item = await db.collection("shopping").findOne({ _id: new ObjectId(input.id) });
      assertOwnerDoc(item, ctx.user.username);
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
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const item = await db.collection("shopping").findOne({ _id: new ObjectId(input.id) });
      assertOwnerDoc(item, ctx.user.username);
      await db.collection("shopping").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
