/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { Entity, Event } from "~/lib/db.server";

import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Box } from "~/components/ui";
import { db } from "~/lib/db.server";

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
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {loaderData.events.map((x) => (
          <Box key={x.id} as="li" hoverEffect focusEffect>
            <Link to={x.id} className="flex flex-col gap-1 focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <h2 className="text-lg font-medium text-gray-900">{x.name}</h2>
              <h3 className="text-sm text-gray-400">{x.id}</h3>
            </Link>
          </Box>
        ))}
      </ul>
    </div>
  );
}

export const handle = {
  navigationHeading: "Events",
};