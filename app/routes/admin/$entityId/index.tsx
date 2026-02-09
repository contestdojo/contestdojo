/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { Entity, Event } from "~/lib/db.server";

import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { Timestamp } from "firebase-admin/firestore";
import { zonedTimeToUtc } from "date-fns-tz";
import { useState } from "react";
import { useHydrated } from "remix-utils/use-hydrated";
import { validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { SchemaForm } from "~/components/schema-form";
import { Box, Button, Modal } from "~/components/ui";
import { db } from "~/lib/db.server";

const NewEventForm = z.object({
  name: zfd.text(),
  date: z.coerce.date(),
  studentsPerTeam: zfd.numeric(),
  _tz: zfd.text(),
});

type LoaderData = {
  entity: Entity;
  events: Event[];
  serverTz: string;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });

  const entitySnap = await db.entity(params.entityId).get();
  const entity = entitySnap.data();

  if (!entity) throw new Response("Entity not found.", { status: 404 });

  const eventsSnap = await db.events.where("owner", "==", entitySnap.ref).get();
  const events = eventsSnap.docs.map((x) => x.data());

  return json<LoaderData>({
    entity,
    events,
    serverTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.entityId) throw new Response("Entity ID must be provided.", { status: 400 });

  const entitySnap = await db.entity(params.entityId).get();
  const entity = entitySnap.data();
  if (!entity) throw new Response("Entity not found.", { status: 404 });

  const formData = await request.formData();
  const validator = withZod(
    NewEventForm.transform(({ date, _tz, ...data }) => ({
      ...data,
      date: zonedTimeToUtc(date, _tz),
    }))
  );

  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const eventRef = await db.events.add({
    ...result.data,
    id: "",
    date: Timestamp.fromDate(result.data.date),
    owner: entitySnap.ref,
    frozen: false,
  } as never);

  return redirect(`/admin/${params.entityId}/${eventRef.id}`);
};

export default function IndexRoute() {
  const { events, serverTz } = useLoaderData<LoaderData>();
  const [modalOpen, setModalOpen] = useState(false);

  const hydrated = useHydrated();
  const tz = hydrated ? Intl.DateTimeFormat().resolvedOptions().timeZone : serverTz;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>New Event</Button>
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {events.map((x) => (
          <Box key={x.id} as="li" hoverEffect focusEffect>
            <Link to={x.id} className="flex flex-col gap-1 focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              <h2 className="text-lg font-medium text-gray-900">{x.name}</h2>
              <h3 className="text-sm text-gray-400">{x.id}</h3>
            </Link>
          </Box>
        ))}
      </ul>

      <Modal open={modalOpen} setOpen={setModalOpen} title="New Event" className="max-w-lg">
        <SchemaForm
          id="NewEvent"
          method="post"
          schema={NewEventForm}
          buttonLabel="Create Event"
          fieldProps={{
            name: { label: "Event Name" },
            date: { label: "Date" },
            studentsPerTeam: { label: "Students Per Team" },
            _tz: { hide: true },
          }}
        >
          <input type="hidden" name="_tz" value={tz} />
        </SchemaForm>
      </Modal>
    </div>
  );
}

export const handle = {
  navigationHeading: "Events",
};
