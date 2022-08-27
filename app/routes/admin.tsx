import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { User } from "~/utils/auth.server";
import { requireAdmin } from "~/utils/auth.server";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAdmin(request);
  return json<LoaderData>({ user });
};

export default function AdminRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return <div>welcome, {loaderData.user.displayName}</div>;
}
