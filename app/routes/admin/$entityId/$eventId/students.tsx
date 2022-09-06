/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type { EventOrganization, EventStudent, EventTeam, Organization } from "~/utils/db.server";

import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";

import DataTable from "~/components/data-table";
import IconButton from "~/components/icon-button";
import {
  EventOrganizationReferenceEmbed,
  EventTeamReferenceEmbed,
} from "~/components/reference-embed";
import db from "~/utils/db.server";
import { reduceToMap } from "~/utils/utils";

type LoaderData = {
  students: EventStudent[];
  orgs: (Organization & EventOrganization)[];
  teams: EventTeam[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const studentsSnap = await db.eventStudents(params.eventId).get();
  const students = studentsSnap.docs.map((x) => x.data());

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

  return json<LoaderData>({ students, orgs, teams });
};

const columnHelper = createColumnHelper<EventStudent>();

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
    email: false,
  },
};

export default function StudentsRoute() {
  const { students, orgs, teams } = useLoaderData<LoaderData>();
  const orgsById = reduceToMap(orgs);
  const teamsById = reduceToMap(teams);

  const columns = [
    columnHelper.accessor("id", { header: "ID" }),
    columnHelper.accessor("number", { header: "Number" }),
    columnHelper.accessor((x) => `${x.fname} ${x.lname}`, { id: "name", header: "Name" }),
    columnHelper.accessor("email", { header: "Email" }),
    columnHelper.accessor("grade", { header: "Grade" }),
    columnHelper.accessor("org.id", {
      header: "Organization",
      cell: (props) => {
        const org = orgsById.get(props.getValue());
        return org ? <EventOrganizationReferenceEmbed org={org} /> : props.getValue();
      },
    }),
    columnHelper.accessor((x) => x.team?.id, {
      id: "team_id",
      header: "Team",
      cell: (props) => {
        const id = props.getValue();
        const team = id ? teamsById.get(id) : undefined;
        return team ? <EventTeamReferenceEmbed team={team} /> : id;
      },
    }),
    columnHelper.accessor("notes", { header: "Notes" }),
    columnHelper.accessor("waiver", {
      header: "Waiver",
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

  return (
    <DataTable name="students" data={students} columns={columns} initialState={initialState} />
  );
}

export const handle = {
  navigationHeading: "Students",
};
