import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import Groq from "groq-sdk";
import { env } from "../lib/env";
import { listFilterForOwner, taskListFilter } from "../lib/scoping";
import { USER_ACCOUNTS, USER_GAURAV } from "../lib/users";
import type { TaskAssignee } from "../lib/users";

function getGroqClient() {
  if (!env.groqApiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: env.groqApiKey });
}

function normalizeGuestStatusForChat(raw: unknown): string {
  const s = String(raw ?? "");
  if (
    s === "Not Contacted" ||
    s === "Texted" ||
    s === "Called" ||
    s === "Declined"
  ) {
    return s;
  }
  if (s === "Invited") return "Not Contacted";
  if (s === "Confirmed") return "Called";
  return "Not Contacted";
}

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
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: m.timestamp,
    }));
  }),

  send: publicQuery
    .input(z.object({ message: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      const guestFilter = listFilterForOwner(ctx.user.username);
      const taskFilter = taskListFilter(ctx.user.username);

      // Fetch live data to give AI context (scoped to this user, except shared expenses)
      const [guests, tasks, shopping, expenseRows] = await Promise.all([
        db.collection("guests").find(guestFilter).toArray(),
        db.collection("tasks").find(taskFilter).toArray(),
        db.collection("shopping").find(guestFilter).toArray(),
        db.collection("expenses").find({}).toArray(),
      ]);

      const guestSummary = guests.map((g) => ({
        name: g.name,
        group: g.group,
        status: normalizeGuestStatusForChat(g.status),
        phone: g.phone ?? "",
      }));

      const taskSummary = tasks.map((t) => {
        const assignedKey = (t.assignedTo as string) ?? USER_GAURAV;
        return {
          title: t.title,
          assignee:
            (t.assignee as string) ||
            USER_ACCOUNTS[assignedKey as TaskAssignee]?.displayName,
          assignedTo: assignedKey,
          dueDate: t.dueDate ?? "",
          isCompleted: t.isCompleted,
        };
      });

      const shoppingSummary = shopping.map((s) => ({
        itemName: s.itemName,
        category: s.category,
        isPurchased: s.isPurchased,
      }));

      const expenseSummary = expenseRows.map((ex) => ({
        title: ex.title,
        amountInr: ex.amountInr,
        spentOn: ex.spentOn,
        category: ex.category,
        notes: ex.notes ?? "",
      }));

      const totalExpensesInr = expenseRows.reduce(
        (s, ex) =>
          s +
          (typeof ex.amountInr === "number" && Number.isFinite(ex.amountInr)
            ? ex.amountInr
            : 0),
        0
      );

      const systemPrompt = `You are a smart wedding planning assistant for EverAfter. You are speaking with ${USER_ACCOUNTS[ctx.user.username]?.displayName ?? ctx.user.username}. Only the data below applies to them (their guest list, their shopping list, tasks assigned to them). Expenses are shared with their partner.

=== GUEST LIST (${guests.length} total, this user's list) ===
${JSON.stringify(guestSummary, null, 2)}

Guest status breakdown:
- Not Contacted: ${guests.filter((g) => normalizeGuestStatusForChat(g.status) === "Not Contacted").length}
- Texted: ${guests.filter((g) => normalizeGuestStatusForChat(g.status) === "Texted").length}
- Called: ${guests.filter((g) => normalizeGuestStatusForChat(g.status) === "Called").length}
- Declined: ${guests.filter((g) => normalizeGuestStatusForChat(g.status) === "Declined").length}

=== TASKS (${tasks.length} total) ===
${JSON.stringify(taskSummary, null, 2)}
Pending: ${tasks.filter((t) => !t.isCompleted).length} | Completed: ${tasks.filter((t) => t.isCompleted).length}

=== SHOPPING LIST (${shopping.length} total) ===
${JSON.stringify(shoppingSummary, null, 2)}
Purchased: ${shopping.filter((s) => s.isPurchased).length} | Remaining: ${shopping.filter((s) => !s.isPurchased).length}

=== EXPENSES (INR, ${expenseRows.length} entries) ===
Total recorded spend: ₹${totalExpensesInr.toLocaleString("en-IN")}
${JSON.stringify(expenseSummary, null, 2)}

When asked about guests to reach out to, prioritize those with status "Not Contacted". When asked about tasks, focus on incomplete ones. For budget or spending questions, use the expense list and total in INR. Always use the real data above, never make up numbers.`;

      // Fetch recent chat history for context
      const recentMessages = await db
        .collection("chatMessages")
        .find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .toArray();
      const history = recentMessages.reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const groq = getGroqClient();
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: input.message },
        ],
        max_tokens: 512,
        temperature: 0.7,
      });

      const aiReply =
        completion.choices[0]?.message?.content ?? "Sorry, I could not generate a response.";

      const now = Date.now();

      const userMsg = {
        id: `u_${now}`,
        role: "user" as const,
        content: input.message,
        timestamp: now,
      };
      const assistantMsg = {
        id: `a_${now}`,
        role: "assistant" as const,
        content: aiReply,
        timestamp: now + 1,
      };

      await db.collection("chatMessages").insertMany([userMsg, assistantMsg]);

      return { reply: aiReply };
    }),

  clear: publicQuery.mutation(async () => {
    const db = await getDb();
    await db.collection("chatMessages").deleteMany({});
    return { success: true };
  }),
});
