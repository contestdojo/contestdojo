/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type { BulkUpdateActionData } from "~/components/bulk-updates";
import type { Event, EventOrganization, EventTeam, Organization } from "~/lib/db.server";

import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { json } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { BulkUpdateForm, BulkUpdateModal, runBulkUpdate } from "~/components/bulk-updates";
import { DataTable } from "~/components/data-table";
import {
  EventOrganizationReferenceEmbed,
  EventTeamReferenceEmbed,
} from "~/components/reference-embed";
import { Dropdown, IconButton } from "~/components/ui";
import { db } from "~/lib/db.server";
import { reduceToMap } from "~/lib/utils/misc";

type LoaderData = {
  event: Event;
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

  return json<LoaderData>({ event, teams, orgs });
};

const baseSchema = z.object({
  name: z.string().optional(),
  number: z.string().optional(),
  notes: z.string().optional(),
});

type ActionData = BulkUpdateActionData<EventTeam>;

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "BulkUpdate") {
    const result = await withZod(BulkUpdateForm(baseSchema, event.customTeamFields)).validate(
      formData
    );
    if (result.error) return validationError(result.error);

    const results = await runBulkUpdate(db.eventTeams(event.id), result.data.csv);
    return json<ActionData>({ _form: "BulkUpdate", result: results });
  }
};

const columnHelper = createColumnHelper<EventTeam>();

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
  },
};

export default function TeamsRoute() {
  const { event, teams, orgs } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const orgsById = reduceToMap(orgs);

  const customColumns = event.customTeamFields?.map((field) =>
    columnHelper.accessor((x) => x.customFields?.[field.id], {
      id: `customFields.${field.id}`,
      header: field.label.length <= 20 ? `[Custom] ${field.label}` : `[Custom] ${field.id}`,
    })
  );

  const columns = [
    columnHelper.accessor("id", { header: "ID" }),
    columnHelper.accessor("number", { header: "Number" }),
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor((x) => x.org?.id, {
      id: "org_id",
      header: "Organization",
      cell: (props) => {
        const id = props.getValue();
        const org = id ? orgsById.get(id) : undefined;
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
    ...(customColumns ?? []),
  ];

  const [open, setOpen] = useState(false);

  return (
    <DataTable name="teams" data={teams} columns={columns} initialState={initialState}>
      <Dropdown>
        <Dropdown.Button>Actions</Dropdown.Button>
        <Dropdown.Items>
          <Dropdown.Item onClick={() => setOpen(true)}>Bulk Update</Dropdown.Item>
        </Dropdown.Items>
      </Dropdown>

      <BulkUpdateModal
        baseSchema={baseSchema}
        customFields={event.customTeamFields ?? []}
        RowHeader={({ data }) => <EventTeamReferenceEmbed team={data} />}
        result={actionData?._form === "BulkUpdate" ? actionData.result : undefined}
        open={open}
        setOpen={setOpen}
      />
    </DataTable>
  );
}

export const handle = {
  navigationHeading: "Teams",
};
