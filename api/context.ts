import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { jwtVerify } from "jose";
import { env } from "./lib/env";
import type { UserRole } from "./lib/users";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user: { username: string; role: UserRole } | null;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  let user: { username: string; role: UserRole } | null = null;

  const authHeader = opts.req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(env.appSecret);
      const { payload } = await jwtVerify(token, secret);
      if (payload.username && typeof payload.username === "string") {
        const role: UserRole =
          payload.role === "collaborator" ? "collaborator" : "owner";
        user = { username: payload.username, role };
      }
    } catch {
      // invalid or expired token — user stays null
    }
  }

  return { req: opts.req, resHeaders: opts.resHeaders, user };
}
