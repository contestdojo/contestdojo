/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { FormDefaults } from "remix-validated-form";

import { json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Box from "~/components/box";
import SchemaForm from "~/components/forms/schema-form";
import db from "~/lib/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<FormDefaults>(setFormDefaults("EventDetails", event));
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const data = await request.formData();

  if (data.get("_form") === "EventDetails") {
    const result = await withZod(EventDetailsForm).validate(data);
    if (result.error) return validationError(result.error);
    return await db.event(params.eventId).update({ studentsPerTeam: 10 });
  }

  return {};
};

const EventDetailsForm = z.object({
  name: zfd.text(),
  studentsPerTeam: zfd.numeric(),
  costPerStudent: zfd.numeric(),
});

function EventDetails() {
  // TODO: TextArea fields

  return (
    <Box className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium text-gray-900">Event Details</h2>

      <SchemaForm
        id="EventDetails"
        className="flex flex-col gap-5"
        method="post"
        schema={EventDetailsForm}
        labels={{ name: "Event Name" }}
      />
    </Box>
  );
}

export default function SettingsRoute() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <EventDetails />
    </div>
  );
}

export const handle = {
  navigationHeading: "Settings",
};
