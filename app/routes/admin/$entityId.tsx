import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import type { Entity } from "~/utils/db.server";
import db from "~/utils/db.server";

export type LoaderData = {
  entity: Entity;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });

  const entitySnap = await db.entity(params.entityId).get();
  const entity = entitySnap.data();
  if (!entity) throw new Response("Entity not found.", { status: 404 });

  return json<LoaderData>({ entity });
};

export default function EntityIdRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h2>
        <Link to=".">{loaderData.entity.name}</Link>
      </h2>
      <Outlet />
    </div>
  );
}
