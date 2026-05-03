import { z } from "zod";
import { createRouter, protectedQuery as publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import Groq from "groq-sdk";
import { env } from "../lib/env";

function getGroqClient() {
  if (!env.groqApiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: env.groqApiKey });
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
    .mutation(async ({ input }) => {
      const db = await getDb();

      // Fetch live data to give AI context
      const [guests, tasks, shopping] = await Promise.all([
        db.collection("guests").find({}).toArray(),
        db.collection("tasks").find({}).toArray(),
        db.collection("shopping").find({}).toArray(),
      ]);

      const guestSummary = guests.map((g) => ({
        name: g.name,
        group: g.group,
        status: g.status,
        phone: g.phone ?? "",
      }));

      const taskSummary = tasks.map((t) => ({
        title: t.title,
        assignee: t.assignee,
        dueDate: t.dueDate ?? "",
        isCompleted: t.isCompleted,
      }));

      const shoppingSummary = shopping.map((s) => ({
        itemName: s.itemName,
        category: s.category,
        isPurchased: s.isPurchased,
      }));

      const systemPrompt = `You are a smart wedding planning assistant for EverAfter. You have access to the couple's real wedding data below. Answer questions using this data. Be concise, helpful, and warm.

=== GUEST LIST (${guests.length} total) ===
${JSON.stringify(guestSummary, null, 2)}

Guest status breakdown:
- Not Contacted: ${guests.filter((g) => g.status === "Not Contacted").length}
- Invited: ${guests.filter((g) => g.status === "Invited").length}
- Called: ${guests.filter((g) => g.status === "Called").length}
- Texted: ${guests.filter((g) => g.status === "Texted").length}
- Confirmed: ${guests.filter((g) => g.status === "Confirmed").length}
- Declined: ${guests.filter((g) => g.status === "Declined").length}

=== TASKS (${tasks.length} total) ===
${JSON.stringify(taskSummary, null, 2)}
Pending: ${tasks.filter((t) => !t.isCompleted).length} | Completed: ${tasks.filter((t) => t.isCompleted).length}

=== SHOPPING LIST (${shopping.length} total) ===
${JSON.stringify(shoppingSummary, null, 2)}
Purchased: ${shopping.filter((s) => s.isPurchased).length} | Remaining: ${shopping.filter((s) => !s.isPurchased).length}

When asked about guests to call, list specifically those with status "Not Contacted" or "Invited". When asked about tasks, focus on incomplete ones. Always use the real data above, never make up numbers.`;

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
        model: "llama3-8b-8192",
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
