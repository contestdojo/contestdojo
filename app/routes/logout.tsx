import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { logout } from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return logout();
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
