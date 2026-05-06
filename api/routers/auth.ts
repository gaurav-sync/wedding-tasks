import { z } from "zod";
import { SignJWT } from "jose";
import { createRouter, publicQuery, protectedQuery } from "../middleware";
import { env } from "../lib/env";
import { USER_ACCOUNTS } from "../lib/users";

export const authRouter = createRouter({
  login: publicQuery
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      const account = USER_ACCOUNTS[input.username];
      if (!account || account.password !== input.password) {
        throw new Error("Invalid username or password");
      }

      const secret = new TextEncoder().encode(env.appSecret);
      const token = await new SignJWT({
        username: input.username,
        role: account.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      return { token };
    }),

  session: protectedQuery.query(({ ctx }) => {
    const account = USER_ACCOUNTS[ctx.user.username];
    return {
      username: ctx.user.username,
      role: ctx.user.role,
      displayName: account?.displayName ?? ctx.user.username,
      canManageExpensesFully: ctx.user.role === "owner",
    };
  }),
});
