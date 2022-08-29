import type { LoaderFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";

import { requireSession } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireSession(request);
  return redirect("/admin");
};
