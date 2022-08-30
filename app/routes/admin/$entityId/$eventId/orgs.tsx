/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { EventOrganization, Organization } from "~/utils/db.server";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import DataTable from "~/components/data-table";
import db from "~/utils/db.server";

type LoaderData = {
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

  return json<LoaderData>({ orgs });
};

const columnHelper = createColumnHelper<Organization & EventOrganization>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("name", { header: "Name" }),
  columnHelper.accessor((x) => `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`, {
    header: "Address",
  }),
  columnHelper.accessor("admin.id", { header: "Contact ID" }),
  columnHelper.accessor((x) => `${x.adminData.fname} ${x.adminData.lname}`, {
    header: "Contact Name",
  }),
  columnHelper.accessor("adminData.email", { header: "Contact Email" }),
  columnHelper.accessor("maxStudents", { header: "Seats Purchased" }),
  columnHelper.accessor("notes", { header: "Notes" }),
];

export default function OrgsRoute() {
  const loaderData = useLoaderData<LoaderData>();

  const table = useReactTable({
    data: loaderData.orgs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full">
      <DataTable table={table} />
    </div>
  );
}

export const handle = {
  navigationHeading: "Organizations",
};
