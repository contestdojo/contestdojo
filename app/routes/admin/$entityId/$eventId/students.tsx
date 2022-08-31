/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type { EventStudent } from "~/utils/db.server";

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";

import DataTable from "~/components/data-table";
import db from "~/utils/db.server";

type LoaderData = {
  students: EventStudent[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  const studentsSnap = await db.eventStudents(params.eventId).get();
  const students = studentsSnap.docs.map((x) => x.data());

  return json<LoaderData>({ students });
};

const columnHelper = createColumnHelper<EventStudent>();

const columns = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("number", { header: "Number" }),
  columnHelper.accessor((x) => `${x.fname} ${x.lname}`, { header: "Name" }),
  columnHelper.accessor("email", { header: "Email" }),
  columnHelper.accessor("grade", { header: "Grade" }),
  columnHelper.accessor("org.id", { header: "Org ID" }),
  columnHelper.accessor((x) => x.team?.id, { header: "Team ID" }),
  columnHelper.accessor("notes", { header: "Notes" }),
  columnHelper.accessor("waiver", { header: "Waiver" }),
];

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
    email: false,
  },
};

export default function StudentsRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return <DataTable data={loaderData.students} columns={columns} initialState={initialState} />;
}

export const handle = {
  navigationHeading: "Students",
};
