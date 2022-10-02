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
import type { LoaderData as EventIdLoaderData } from "~/routes/admin/$entityId/$eventId";

import { json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Box from "~/components/box";
import Button from "~/components/button";
import Checkbox from "~/components/forms/checkbox";
import FormControl from "~/components/forms/form-control";
import SchemaForm, { FieldsFromSchema } from "~/components/forms/schema-form";
import db from "~/lib/db.server";
import makePartial from "~/lib/utils/make-partial";
import useMatchData from "~/lib/utils/use-match-data";

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
      required: zfd.checkbox(),
      choices: zfd.text(z.string().optional()).transform((value) => {
        if (!value) return null;
        const items = value.split(",").map((x) => x.trim());
        if (items.length === 0) return null;
        return items;
      }),
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
        labels={{ name: "Event Name" }}
      />
    </Box>
  );
}

function CustomFields() {
  const { event } = makePartial(useMatchData<EventIdLoaderData>("routes/admin/$entityId/$eventId"));
  const [count, setCount] = useState(event?.customFields?.length ?? 0);

  return (
    <Box className="col-span-2 flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium text-gray-900">Custom Registration Fields</h2>

      <SchemaForm
        id="CustomFields"
        className="flex flex-col gap-5"
        method="post"
        schema={CustomFieldsForm}
      >
        {Array(count)
          .fill(null)
          .map((_, i) => (
            <div key={i} className="flex flex-col gap-5 md:flex-row">
              <FieldsFromSchema
                schema={CustomFieldsForm.shape.customFields.innerType().element}
                namePrefix={`customFields[${i}].`}
                fieldProps={{
                  choices: {
                    label: "Choices (optional)",
                    placeholder: "Enter choices, comma-separated...",
                  },
                }}
              >
                <FormControl
                  as={Checkbox}
                  type="checkbox"
                  name={`customFields[${i}].required`}
                  label="Required"
                />
              </FieldsFromSchema>
            </div>
          ))}

        <Button type="button" className="self-start" onClick={() => setCount(count + 1)}>
          Add Custom Field
        </Button>
      </SchemaForm>
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
