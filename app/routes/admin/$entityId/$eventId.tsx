/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { Event } from "~/lib/db.server";

import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { db } from "~/lib/db.server";

export type LoaderData = {
  event: Event;
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<LoaderData>({ event });
};

export default function EventIdRoute() {
  return <Outlet />;
}
