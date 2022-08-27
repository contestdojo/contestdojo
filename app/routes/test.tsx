import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { User } from "~/utils/auth.server";
import { verifySession } from "~/utils/auth.server";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await verifySession(request);
  return json<LoaderData>({ user });
};

export default function AdminRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return <div>test test, {loaderData.user.displayName}</div>;
}
