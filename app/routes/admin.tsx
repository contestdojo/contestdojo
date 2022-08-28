import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
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

  return (
    <div>
      <h1>
        <Link to=".">Admin Page</Link>
      </h1>
      <p>Logged in as: {loaderData.user.displayName}</p>
      <Outlet />
    </div>
  );
}
