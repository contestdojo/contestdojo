/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { TableState } from "@tanstack/react-table";
import type {
  Event,
  EventOrganization,
  EventStudent,
  EventTeam,
  Organization,
} from "~/lib/db.server";

import { Dialog } from "@headlessui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { createColumnHelper } from "@tanstack/react-table";
import { parse } from "csv/browser/esm";
import { Fragment, useEffect, useMemo, useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import DataTable from "~/components/data-table";
import Dropdown from "~/components/dropdown";
import SchemaForm from "~/components/forms/schema-form";
import IconButton from "~/components/icon-button";
import Modal from "~/components/modal";
import {
  EventOrganizationReferenceEmbed,
  EventTeamReferenceEmbed,
} from "~/components/reference-embed";
import db from "~/lib/db.server";
import { firestore } from "~/lib/firebase.server";
import { reduceToMap } from "~/lib/utils/misc";

const BulkUpdateForm = (customFields: Event["customFields"]) => {
  const customFieldIds = customFields?.map((x) => x.id) ?? [];

  return z.object({
    csv: zfd
      .text()
      .transform(
        (val) =>
          new Promise((resolve, reject) => {
            parse(val, { columns: true }, (err, data) => {
              if (err) reject(err);
              resolve(data);
            });
          })
      )
      .superRefine((val, ctx) => {
        if (!Array.isArray(val)) return { message: "Must be an array" };
        if (val.length === 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cannot be empty" });
        }
        for (const item of val) {
          const keys = Object.getOwnPropertyNames(item);
          if (!keys.includes("id")) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Missing field id" });
          }
          for (const key of keys) {
            if (key !== "id" && !customFieldIds.includes(key)) {
              ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid field ${key}` });
            }
          }
        }
      }),
  });
};

type LoaderData = {
  event: Event;
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

  return json<LoaderData>({ event, students, orgs, teams });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  const result = await withZod(BulkUpdateForm(event.customFields)).validate(formData);
  if (result.error) return validationError(result.error);

  const batch = firestore.batch();

  for (const row of result.data.csv as { id: string; [key: string]: string }[]) {
    batch.update(
      db.eventStudent(params.eventId, row["id"]),
      Object.fromEntries(Object.entries(row).map(([key, val]) => [`customFields.${key}`, val]))
    );
  }

  // TODO: Refactor

  await batch.commit();
  return true;
};

const columnHelper = createColumnHelper<EventStudent>();

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
    email: false,
  },
};

type BulkUpdateModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function BulkUpdateModal({ open, setOpen }: BulkUpdateModalProps) {
  const { event } = useLoaderData<LoaderData>();
  const form = useMemo(() => BulkUpdateForm(event.customFields), [event]);
  const actionData = useActionData<boolean>();

  useEffect(() => {
    if (actionData) setOpen(false);
  }, [actionData, setOpen]);

  return (
    <Modal open={open} setOpen={setOpen} className="flex max-w-xl flex-col gap-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <ArrowUpTrayIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-2">
        <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
          Bulk Update Custom Fields
        </Dialog.Title>

        <p className="text-center text-sm text-gray-500">
          Required fields: <span className="font-mono">id</span>
        </p>

        <p className="text-center text-sm text-gray-500">
          Accepted fields:{" "}
          {event.customFields?.map((x, i) => (
            <Fragment key={x.id}>
              {i !== 0 && ", "}
              <span className="font-mono">{x.id}</span>
            </Fragment>
          ))}
        </p>
      </div>

      <SchemaForm
        id="BulkUpdate"
        method="post"
        schema={form}
        buttonLabel="Update"
        fieldProps={{ csv: { label: "CSV Text", multiline: true } }}
      />
    </Modal>
  );
}

export default function StudentsRoute() {
  const { event, students, orgs, teams } = useLoaderData<LoaderData>();
  const orgsById = reduceToMap(orgs);
  const teamsById = reduceToMap(teams);

  const customColumns = event.customFields?.map((field) =>
    columnHelper.accessor((x) => x.customFields?.[field.id], {
      id: `customFields.${field.id}`,
      header: field.label.length <= 20 ? `[Custom] ${field.label}` : `[Custom] ${field.id}`,
    })
  );

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
    ...(customColumns ?? []),
  ];

  const [open, setOpen] = useState(false);

  return (
    <DataTable name="students" data={students} columns={columns} initialState={initialState}>
      <Dropdown>
        <Dropdown.Button>Actions</Dropdown.Button>
        <Dropdown.Items>
          <Dropdown.Item onClick={() => setOpen(true)}>Bulk Update</Dropdown.Item>
        </Dropdown.Items>
      </Dropdown>
      <BulkUpdateModal open={open} setOpen={setOpen} />
    </DataTable>
  );
}

export const handle = {
  navigationHeading: "Students",
};
