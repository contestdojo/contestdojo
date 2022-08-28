import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { User } from "~/utils/auth.server";
import { requireAdmin } from "~/utils/auth.server";
import type { Entity } from "~/utils/db.server";
import db from "~/utils/db.server";

type LoaderData = {
  user: User;
  entities: Entity[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAdmin(request);

  const entitiesSnap = await db.entities.where("admins", "array-contains", db.user(user.uid)).get();
  const entities = entitiesSnap.docs.map((x) => x.data());

  return json<LoaderData>({ user, entities });
};

export default function AdminRoute() {
  const loaderData = useLoaderData<LoaderData>();

  console.log(loaderData);

  return (
    <div>
      <h1>Admin Page</h1>
      <p>Logged in as: {loaderData.user.displayName}</p>
      <h3>Entities</h3>
      <ul>
        {loaderData.entities.map((x) => (
          <li key={x.id}>{x.name}</li>
        ))}
      </ul>
    </div>
  );
}
