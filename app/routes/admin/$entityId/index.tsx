import type { LoaderFunction } from "@remix-run/node";
import type { Entity, Event } from "~/utils/db.server";

import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import db from "~/utils/db.server";

type LoaderData = {
  entity: Entity;
  events: Event[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });

  const entitySnap = await db.entity(params.entityId).get();
  const entity = entitySnap.data();

  if (!entity) throw new Response("Entity not found.", { status: 404 });

  const eventsSnap = await db.events.where("owner", "==", entitySnap.ref).get();
  const events = eventsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ entity, events });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>Events</h3>
      <ul>
        {loaderData.events.map((x) => (
          <li key={x.id}>
            <Link to={x.id}>{x.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const handle = {
  navigationHeading: "Events",
};
