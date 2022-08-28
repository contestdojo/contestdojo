import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { requireAdmin } from "~/utils/auth.server";
import type { Entity } from "~/utils/db.server";
import db from "~/utils/db.server";

type LoaderData = {
  entities: Entity[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAdmin(request);
  const entitiesSnap = await db.entities.where("admins", "array-contains", db.user(user.uid)).get();
  const entities = entitiesSnap.docs.map((x) => x.data());
  return json<LoaderData>({ entities });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h2>Entities</h2>
      <ul>
        {loaderData.entities.map((x) => (
          <li key={x.id}>
            <Link to={x.id}>{x.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
