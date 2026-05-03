import { createRouter, publicQuery } from "./middleware";
import { guestRouter } from "./routers/guest";
import { shoppingRouter } from "./routers/shopping";
import { taskRouter } from "./routers/task";
import { chatRouter } from "./routers/chat";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  guest: guestRouter,
  shopping: shoppingRouter,
  task: taskRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
