import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import type { Event } from "~/utils/db.server";
import db from "~/utils/db.server";

export type LoaderData = {
  event: Event;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<LoaderData>({ event });
};

export default function EntityIdRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <h3>{loaderData.event.name}</h3>
      <ul>
        <li>
          <Link to="orgs">Organizations</Link>
        </li>
        <li>
          <Link to="teams">Teams</Link>
        </li>
        <li>
          <Link to="students">Students</Link>
        </li>
      </ul>
      <hr />
      <Outlet />
    </div>
  );
}
