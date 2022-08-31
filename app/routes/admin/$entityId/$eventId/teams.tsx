/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type { EventTeam } from "~/utils/db.server";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";

import DataTable from "~/components/data-table";
import db from "~/utils/db.server";

type LoaderData = {
  teams: EventTeam[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const teamsSnap = await db.eventTeams(params.eventId).get();
  const teams = teamsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ teams });
};

const columnHelper = createColumnHelper<EventTeam>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("number", { header: "Number" }),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor("org.id", { header: "Org ID" }),
  columnHelper.accessor("notes", { header: "Notes" }),
  columnHelper.accessor("scoreReport", { header: "Score Report" }),
];

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
  },
};

export default function TeamsRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return <DataTable data={loaderData.teams} columns={columns} initialState={initialState} />;
}

export const handle = {
  navigationHeading: "Teams",
};
