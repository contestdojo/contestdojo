/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { FormDefaults, Validator } from "remix-validated-form";
import type { Event } from "~/lib/db.server";

import { json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Box from "~/components/box";
import SchemaForm from "~/components/forms/schema-form";
import db from "~/lib/db.server";

const EventDetailsForm = z.object({
  name: zfd.text(),
  studentsPerTeam: zfd.numeric(),
  costPerStudent: zfd.numeric(),
});

const CustomFieldsForm = z.object({
  customFields: zfd.repeatableOfType(
    z.object({
      id: zfd.text(),
      label: zfd.text(),
      choices: zfd.text(z.string().optional()).transform((value) => {
        if (!value) return null;
        const items = value.split(",").map((x) => x.trim());
        if (items.length === 0) return null;
        return items;
      }),
      required: zfd.checkbox(),
    })
  ),
});

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<FormDefaults>({
    ...setFormDefaults("EventDetails", event),
    ...setFormDefaults("CustomFields", event),
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const formData = await request.formData();

  let validator: Validator<Partial<Event>> | undefined;
  if (formData.get("_form") === "EventDetails") validator = withZod(EventDetailsForm);
  if (formData.get("_form") === "CustomFields") validator = withZod(CustomFieldsForm);

  if (validator) {
    const result = await validator.validate(formData);
    if (result.error) return validationError(result.error);
    return await db.event(params.eventId).update(result.data);
  }
};

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
        buttonLabel="Save"
        fieldProps={{ name: { label: "Event Name" } }}
      />
    </Box>
  );
}

function CustomFields() {
  return (
    <Box className="col-span-2 flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium text-gray-900">Custom Registration Fields</h2>

      <SchemaForm
        id="CustomFields"
        className="flex flex-col gap-5"
        method="post"
        schema={CustomFieldsForm}
        buttonLabel="Save"
      />
    </Box>
  );
}

export default function SettingsRoute() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <EventDetails />
      <CustomFields />
    </div>
  );
}

export const handle = {
  navigationHeading: "Settings",
};
