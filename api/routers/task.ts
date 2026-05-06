import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { ObjectId } from "mongodb";
import { TASK_ASSIGNEES, USER_ACCOUNTS, USER_GAURAV } from "../lib/users";
import type { TaskAssignee } from "../lib/users";
import { taskListFilter } from "../lib/scoping";

function assertCanActOnTask(
  task: unknown,
  username: string,
) {
  const t = task as { assignedTo?: string } | null;
  if (!t) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  const assigned = t.assignedTo ?? USER_GAURAV;
  if (assigned !== username) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You can only update tasks assigned to you.",
    });
  }
}

export const taskRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = await getDb();
    const filter =
      ctx.user.role === "owner"
        ? {}
        : taskListFilter(ctx.user.username);
    const tasks = await db.collection("tasks").find(filter).toArray();
    return tasks.map((t) => {
      const assignedKey = (t.assignedTo as string) ?? USER_GAURAV;
      return {
        id: t._id.toString(),
        title: t.title,
        assignee:
          (t.assignee as string) ||
          USER_ACCOUNTS[assignedKey as TaskAssignee]?.displayName ||
          assignedKey,
        assignedTo: assignedKey,
        dueDate: t.dueDate ?? "",
        isCompleted: t.isCompleted,
      };
    });
  }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1),
        assignedTo: z.enum(TASK_ASSIGNEES),
        dueDate: z.string().optional(),
        isCompleted: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const assigneeLabel = USER_ACCOUNTS[input.assignedTo].displayName;
      const result = await db.collection("tasks").insertOne({
        title: input.title,
        assignedTo: input.assignedTo,
        assignee: assigneeLabel,
        dueDate: input.dueDate ?? "",
        isCompleted: input.isCompleted,
        createdAt: new Date(),
      });
      return {
        id: result.insertedId.toString(),
        title: input.title,
        assignee: assigneeLabel,
        assignedTo: input.assignedTo,
        dueDate: input.dueDate ?? "",
        isCompleted: input.isCompleted,
      };
    }),

  toggle: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const task = await db.collection("tasks").findOne({ _id: new ObjectId(input.id) });
      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      if (ctx.user.role !== "owner") {
        assertCanActOnTask(task, ctx.user.username);
      }
      await db
        .collection("tasks")
        .updateOne(
          { _id: new ObjectId(input.id) },
          { $set: { isCompleted: !task.isCompleted } }
        );
      return { success: true };
    }),

  delete: publicQuery
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Gaurav can delete tasks.",
        });
      }
      const db = await getDb();
      const result = await db.collection("tasks").deleteOne({
        _id: new ObjectId(input.id),
      });
      if (result.deletedCount === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }
      return { success: true };
    }),
});
