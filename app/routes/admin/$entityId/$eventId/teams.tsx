/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type { EventOrganization, EventTeam, Organization } from "~/lib/db.server";

import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";

import DataTable from "~/components/data-table";
import IconButton from "~/components/icon-button";
import { EventOrganizationReferenceEmbed } from "~/components/reference-embed";
import db from "~/lib/db.server";
import { reduceToMap } from "~/lib/utils/misc";

type LoaderData = {
  teams: EventTeam[];
  orgs: (Organization & EventOrganization)[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const eventOrgsSnap = await db.eventOrgs(params.eventId).get();
  const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

  const orgsSnap = await db.orgs.get();
  const orgs = orgsSnap.docs.flatMap((x) => {
    const eventOrg = eventOrgs.get(x.id);
    if (!eventOrg) return [];
    return { ...eventOrg, ...x.data() };
  });

  const teamsSnap = await db.eventTeams(params.eventId).get();
  const teams = teamsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ teams, orgs });
};

const columnHelper = createColumnHelper<EventTeam>();

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
  },
};

export default function TeamsRoute() {
  const { teams, orgs } = useLoaderData<LoaderData>();
  const orgsById = reduceToMap(orgs);

  const columns = [
    columnHelper.accessor("id", { header: "ID" }),
    columnHelper.accessor("number", { header: "Number" }),
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("org.id", {
      header: "Organization",
      cell: (props) => {
        const org = orgsById.get(props.getValue());
        return org ? <EventOrganizationReferenceEmbed org={org} /> : props.getValue();
      },
    }),
    columnHelper.accessor("notes", { header: "Notes" }),
    columnHelper.accessor("scoreReport", {
      header: "Score Report",
      cell: (props) => {
        const path = props.getValue();
        return path ? (
          <IconButton as={Link} to={`/storage/${path}`} reloadDocument>
            <ArrowDownTrayIcon className="h-4 w-4" />
          </IconButton>
        ) : null;
      },
    }),
  ];

  return <DataTable name="teams" data={teams} columns={columns} initialState={initialState} />;
}

export const handle = {
  navigationHeading: "Teams",
};
