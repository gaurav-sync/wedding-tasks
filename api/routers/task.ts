import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";

export const taskRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = await getDb();
    const tasks = await db.collection("tasks").find({}).toArray();
    return tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      assignee: t.assignee,
      dueDate: t.dueDate ?? "",
      isCompleted: t.isCompleted,
    }));
  }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        assignee: z.string().default("Me"),
        dueDate: z.string().optional(),
        isCompleted: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.collection("tasks").insertOne({
        ...input,
        createdAt: new Date(),
      });
      return { id: result.insertedId.toString(), ...input };
    }),

  toggle: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const task = await db.collection("tasks").findOne({ _id: new ObjectId(input.id) });
      if (task) {
        await db
          .collection("tasks")
          .updateOne(
            { _id: new ObjectId(input.id) },
            { $set: { isCompleted: !task.isCompleted } }
          );
      }
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.collection("tasks").deleteOne({ _id: new ObjectId(input.id) });
      return { success: true };
    }),
});
