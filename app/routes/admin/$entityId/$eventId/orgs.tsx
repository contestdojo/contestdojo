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
import type { Event, EventOrganization, Organization } from "~/lib/db.server";

import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { BulkUpdateForm, BulkUpdateModal, runBulkUpdate } from "~/components/bulk-updates";
import { DataTable } from "~/components/data-table";
import { EventOrganizationReferenceEmbed } from "~/components/reference-embed";
import { Dropdown } from "~/components/ui";
import { db } from "~/lib/db.server";
import { reduceToMap } from "~/lib/utils/misc";

type LoaderData = {
  event: Event;
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

  return json<LoaderData>({ event, orgs });
};

type ActionData = BulkUpdateActionData<EventOrganization>;

const baseSchema = z.object({
  maxStudents: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "BulkUpdate") {
    const result = await withZod(BulkUpdateForm(baseSchema, event.customOrgFields)).validate(
      formData
    );
    if (result.error) return validationError(result.error);

    const results = await runBulkUpdate(db.eventOrgs(event.id), result.data.csv);
    return json<ActionData>({ _form: "BulkUpdate", result: results });
  }
};

const columnHelper = createColumnHelper<Organization & EventOrganization>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor((x) => `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`, {
    id: "address",
    header: "Address",
  }),
  columnHelper.accessor("admin.id", { header: "Contact ID" }),
  columnHelper.accessor((x) => `${x.adminData.fname} ${x.adminData.lname}`, {
    id: "admin_name",
    header: "Contact Name",
  }),
  columnHelper.accessor("adminData.email", { id: "admin_email", header: "Contact Email" }),
  columnHelper.accessor("maxStudents", { header: "Seats Purchased" }),
  columnHelper.accessor("notes", { header: "Notes" }),
];

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
    address: false,
    admin_id: false,
  },
};

export default function OrgsRoute() {
  const { event, orgs } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  const orgsById = reduceToMap(orgs);

  const customColumns = event.customOrgFields?.map((field) =>
    columnHelper.accessor((x) => x.customFields?.[field.id], {
      id: `customFields.${field.id}`,
      header: field.label.length <= 20 ? `[Custom] ${field.label}` : `[Custom] ${field.id}`,
    })
  );

  const [open, setOpen] = useState(false);

  return (
    <DataTable
      filename={`${new Date().toISOString()} - ${event.name} - orgs.csv`}
      data={orgs}
      columns={[...columns, ...(customColumns ?? [])]}
      initialState={initialState}
    >
      <Dropdown>
        <Dropdown.Button>Actions</Dropdown.Button>
        <Dropdown.Items>
          <Dropdown.Item onClick={() => setOpen(true)}>Bulk Update</Dropdown.Item>
        </Dropdown.Items>
      </Dropdown>

      <BulkUpdateModal
        baseSchema={baseSchema}
        customFields={event.customOrgFields ?? []}
        RowHeader={({ data }) => {
          const org = orgsById.get(data.id);
          if (!org) return <>data.id</>;
          return <EventOrganizationReferenceEmbed org={{ ...org, ...data }} />;
        }}
        result={actionData?._form === "BulkUpdate" ? actionData.result : undefined}
        open={open}
        setOpen={setOpen}
      />
    </DataTable>
  );
}

export const handle = {
  navigationHeading: "Organizations",
};
