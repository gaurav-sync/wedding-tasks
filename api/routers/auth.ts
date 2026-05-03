import { z } from "zod";
import { SignJWT } from "jose";
import { createRouter, publicQuery } from "../middleware";
import { env } from "../lib/env";

const CREDENTIALS = {
  username: "gauravsapkal",
  password: "Marriage@Plan121",
};

export const authRouter = createRouter({
  login: publicQuery
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input }) => {
      if (
        input.username !== CREDENTIALS.username ||
        input.password !== CREDENTIALS.password
      ) {
        throw new Error("Invalid username or password");
      }

      const secret = new TextEncoder().encode(env.appSecret);
      const token = await new SignJWT({ username: input.username })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      return { token };
    }),
});
