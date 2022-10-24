/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { PropsWithChildren } from "react";
import type { FormDefaults, Validator } from "remix-validated-form";
import type { Event } from "~/lib/db.server";

import { json } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import clsx from "clsx";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import Box from "~/components/box";
import SchemaForm from "~/components/forms/schema-form";
import db from "~/lib/db.server";

const UNIQUE_ERROR = {
  code: z.ZodIssueCode.custom,
  message: "Must be unique",
};

const EventDetailsForm = z.object({
  name: zfd.text(),
  studentsPerTeam: zfd.numeric(),
  description: zfd.text(),
});

const CostDetailsForm = z.object({
  costPerStudent: zfd.numeric(z.number().optional()),
  costDescription: zfd.text(z.string().optional()),
});

const CustomFieldsForm = z.object({
  customFields: zfd
    .repeatableOfType(
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
        hidden: zfd.checkbox(),
      })
    )
    .superRefine((items, ctx) => {
      const ids = items.map((x, index) => [x.id, index]).sort();
      for (let i = 1; i < ids.length; i++) {
        if (ids[i - 1][0] === ids[i][0]) {
          ctx.addIssue({ ...UNIQUE_ERROR, path: [ids[i - 1][1], "id"] });
          ctx.addIssue({ ...UNIQUE_ERROR, path: [ids[i][1], "id"] });
        }
      }
    }),
});

const WaiverForm = z.object({
  waiver: zfd.text(z.string().optional()),
});

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();

  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<FormDefaults>({
    ...setFormDefaults("EventDetails", event),
    ...setFormDefaults("CostDetails", event),
    ...setFormDefaults("CustomFields", event),
    ...setFormDefaults("Waiver", event),
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const formData = await request.formData();

  let validator: Validator<Partial<Event>> | undefined;
  if (formData.get("_form") === "EventDetails") validator = withZod(EventDetailsForm);
  if (formData.get("_form") === "CostDetails") validator = withZod(CostDetailsForm);
  if (formData.get("_form") === "CustomFields") validator = withZod(CustomFieldsForm);
  if (formData.get("_form") === "Waiver") validator = withZod(WaiverForm);

  if (validator) {
    const result = await validator.validate(formData);
    if (result.error) return validationError(result.error);
    return await db.event(params.eventId).update(db.util.mapUndefinedToDelete(result.data));
  }
};

type SectionProps = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

function Section({ title, className, children }: SectionProps) {
  return (
    <Box className={clsx`flex flex-col gap-4 p-4 ${className}`}>
      {title && <h2 className="text-lg font-medium text-gray-900">{title}</h2>}
      {children}
    </Box>
  );
}

export default function SettingsRoute() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Section title="Event Details">
        <SchemaForm
          className="flex-1"
          id="EventDetails"
          method="post"
          schema={EventDetailsForm}
          buttonLabel="Save"
          fieldProps={{ name: { label: "Event Name" }, description: { multiline: true, rows: 10 } }}
        />
      </Section>

      <Section title="Pricing Details">
        <SchemaForm
          className="flex-1"
          id="CostDetails"
          method="post"
          schema={CostDetailsForm}
          buttonLabel="Save"
          fieldProps={{ costDescription: { multiline: true, rows: 10 } }}
        />
      </Section>

      <Section title="Custom Fields" className="col-span-2">
        <SchemaForm
          className="flex-1"
          id="CustomFields"
          method="post"
          schema={CustomFieldsForm}
          buttonLabel="Save"
          fieldProps={{
            customFields: {
              elementClassName: "md:flex-row",
              element: {
                choices: {
                  label: "Choices (optional)",
                  placeholder: "Enter choices, comma-separated...",
                },
              },
            },
          }}
        />
      </Section>

      <Section title="Waiver" className="col-span-2">
        <SchemaForm
          className="flex-1"
          id="Waiver"
          method="post"
          schema={WaiverForm}
          buttonLabel="Save"
          fieldProps={{ waiver: { multiline: true } }}
        />
      </Section>
    </div>
  );
}

export const handle = {
  navigationHeading: "Settings",
};
