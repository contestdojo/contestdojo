/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunctionArgs } from "@remix-run/node";

import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { db } from "~/lib/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  return json({ event });
}

export default function EventIdRoute() {
  return <Outlet />;
}

export const handle = {
  navigationHeading: "Event",
};
