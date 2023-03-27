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
import type {
  Event,
  EventOrganization,
  EventStudent,
  EventTeam,
  Organization,
} from "~/lib/db.server";

import { Dialog } from "@headlessui/react";
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { BulkUpdateForm, BulkUpdateModal, runBulkUpdate } from "~/components/bulk-updates";
import { DataTable } from "~/components/data-table";
import {
  EventOrganizationReferenceEmbed,
  EventStudentReferenceEmbed,
  EventTeamReferenceEmbed,
} from "~/components/reference-embed";
import { SchemaForm } from "~/components/schema-form";
import { Dropdown, IconButton, Modal } from "~/components/ui";
import { db } from "~/lib/db.server";
import { isNotEmpty } from "~/lib/utils/array-utils";
import { reduceToMap } from "~/lib/utils/misc";
import { UnifiedDocumentReference } from "~/lib/zfb";

const StudentUpdateForm = (eventId: Event["id"], customFields: Event["customFields"]) => {
  const customFieldsSchema =
    customFields &&
    Object.fromEntries(
      customFields.map((x) => {
        let field;
        if (x.choices && isNotEmpty(x.choices)) field = z.enum(x.choices);
        else field = z.string();
        if (!x.flags.required) field = field.optional();
        return [x.id, zfd.text(field)];
      })
    );

  return z.object({
    id: zfd.text(),
    fname: zfd.text(),
    lname: zfd.text(),
    grade: zfd.numeric(z.number().optional()),
    org: zfd
      .text(z.string().optional())
      .transform((x) => x && new UnifiedDocumentReference(`orgs/${x}`)),
    team: zfd
      .text(z.string().optional())
      .transform((x) => x && new UnifiedDocumentReference(`events/${eventId}/teams/${x}`)),
    number: zfd.text(z.string().optional()),
    notes: zfd.text(z.string().optional()),
    ...(customFieldsSchema && { customFields: z.object(customFieldsSchema) }),
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

const baseSchema = z.object({
  org: z.string().optional(),
  team: z.string().optional().nullable(),
  number: z.string().optional(),
  notes: z.string().optional(),
});

const baseSchemaServer = (event: Event) =>
  z.object({
    org: z
      .string()
      .transform((x) => (x === "" ? null : db.org(x)))
      .optional(),
    team: z
      .string()
      .transform((x) => (x === "" ? null : db.eventTeam(event.id, x)))
      .optional(),
    number: z.string().optional(),
    notes: z.string().optional(),
  });

type ActionData =
  | BulkUpdateActionData<EventStudent>
  | {
      _form: "StudentUpdate";
    };

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "StudentUpdate") {
    const result = await withZod(StudentUpdateForm(event.id, event.customFields)).validate(
      formData
    );
    if (result.error) return validationError(result.error);

    const updateData = {
      ...result.data,
      org: result.data.org && db.doc(result.data.org.path),
      team: result.data.team && db.doc(result.data.team.path),
    };

    await db
      .eventStudent(params.eventId, result.data.id)
      .update(db.util.mapUndefinedToDelete(updateData));

    return json<ActionData>({ _form: "StudentUpdate" });
  }

  if (formData.get("_form") === "BulkUpdate") {
    const result = await withZod(
      BulkUpdateForm(baseSchemaServer(event), event.customFields)
    ).validate(formData);
    if (result.error) return validationError(result.error);

    const results = await runBulkUpdate(db.eventStudents(event.id), result.data.csv);
    return json<ActionData>({ _form: "BulkUpdate", result: results });
  }
};

const columnHelper = createColumnHelper<EventStudent>();

const initialState: Partial<TableState> = {
  columnVisibility: {
    id: false,
    email: false,
  },
};

type StudentUpdateModalProps = {
  student: EventStudent;
  open: boolean;
  setOpen: (open: boolean) => void;
};

function StudentUpdateModal({ student, open, setOpen }: StudentUpdateModalProps) {
  const { event } = useLoaderData<LoaderData>();
  const form = useMemo(() => StudentUpdateForm(event.id, event.customFields), [event]);

  // TODO: Streamline DocumentReference fields
  const defaultValues = { ...student, org: student.org?.id, team: student.team?.id };

  return (
    <Modal open={open} setOpen={setOpen} className="flex max-w-2xl flex-col gap-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
        <PencilSquareIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>

      <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
        Update {student.fname} {student.lname}
      </Dialog.Title>

      <SchemaForm
        id="StudentUpdate"
        method="post"
        schema={form}
        buttonLabel="Update"
        // TODO: Fix issue with DocumentReference fields
        // @ts-ignore
        defaultValues={defaultValues}
        fieldProps={{
          customFields:
            event.customFields &&
            Object.fromEntries(
              event.customFields.map((x) => [x.id, { label: `[Custom] ${x.label}` }])
            ),
        }}
      />
    </Modal>
  );
}
export default function StudentsRoute() {
  const { event, students, orgs, teams } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
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
    columnHelper.accessor((x) => x.org?.id, {
      id: "org_id",
      header: "Organization",
      cell: (props) => {
        const id = props.getValue();
        const org = id ? orgsById.get(id) : undefined;
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
    columnHelper.display({
      id: "update",
      cell: function Cell(props) {
        const [open, setOpen] = useState(false);
        return (
          <>
            <IconButton onClick={() => setOpen(true)}>
              <PencilSquareIcon className="h-4 w-4" />
            </IconButton>
            <StudentUpdateModal student={props.row.original} open={open} setOpen={setOpen} />
          </>
        );
      },
    }),
  ];

  const [open, setOpen] = useState(false);

  return (
    <DataTable
      filename={`${new Date().toISOString()} - ${event.name} - students.csv`}
      data={students}
      columns={columns}
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
        customFields={event.customFields ?? []}
        RowHeader={({ data }) => <EventStudentReferenceEmbed student={data} />}
        result={actionData?._form === "BulkUpdate" ? actionData.result : undefined}
        open={open}
        setOpen={setOpen}
      />
    </DataTable>
  );
}

export const handle = {
  navigationHeading: "Students",
};
