import { createCookieSessionStorage } from "@remix-run/node";
import env from "./env.server";

export let storage = createCookieSessionStorage({
  cookie: {
    name: "contestdojo",
    secure: env.isProduction,
    secrets: [env.SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export const { getSession, commitSession, destroySession } = storage;
