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

import { requireUserType } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });

  const orgSnap = await db.org(params.orgId).get();
  const org = orgSnap.data();
  if (!org) throw new Response("Organization not found.", { status: 404 });

  const user = await requireUserType(request, "coach");
  if (org.admin.id !== user.uid)
    throw new Response("You are not an admin of this organization.", { status: 403 });

  return json({ org });
}

export default function OrgIdRoute() {
  return <Outlet />;
}

export const handle = {
  navigationHeading: "Events",
};
