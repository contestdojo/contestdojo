/*
 * Copyright (c) 2024 Oliver Ni
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
import { useLoaderData } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import clsx from "clsx";
import { zonedTimeToUtc } from "date-fns-tz";
import { useHydrated } from "remix-utils/use-hydrated";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { SchemaForm } from "~/components/schema-form";
import { Alert, AlertStatus, Box } from "~/components/ui";
import { db } from "~/lib/db.server";

const UNIQUE_ERROR = {
  code: z.ZodIssueCode.custom,
  message: "Must be unique",
};

const EventDetailsForm = z.object({
  name: zfd.text(),
  date: z.coerce.date(),
  studentsPerTeam: zfd.numeric(),
  description: zfd.text(),
  hide: zfd.checkbox(),
  purchaseSeatsEnabled: zfd.checkbox(),
  purchaseSeats: zfd.text(z.string().optional()),
  studentRegistrationEnabled: zfd.checkbox(),
  maxStudents: zfd.numeric(z.number().optional()),
  maxStudentsPerOrg: zfd.numeric(z.number().optional()),
  _tz: zfd.text(),
});

// FIXME: hack to get around `date` being serialized as string
const CostDetailsForm = (event: Omit<Event, "date">) => {
  const choices = event.customOrgFields?.map((x) => `customFields.${x.id}`) ?? [];

  return z.object({
    costPerStudent: zfd.numeric(z.number().optional()),
    costDescription: zfd.text(z.string().optional()),
    costAdjustments: zfd.repeatableOfType(
      z.object({
        rule: z.object({
          field: zfd.text(z.enum(["id", ...choices])),
          rule: zfd.text(z.enum(["=", "!=", "=~", "!~", "in"])),
          value: zfd.text(),
        }),
        adjustment: zfd.numeric(),
      })
    ),
  });
};

const customFields = zfd
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
      helpText: zfd.text(z.string().optional()).transform((x) => x ?? null),
      validationRegex: zfd.text(z.string().optional()).transform((x) => x ?? null),
      flags: z.object({
        required: zfd.checkbox(),
        editable: zfd.checkbox(),
        hidden: zfd.checkbox(),
      }),
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
  });

const CustomFieldsForm = z.object({ customFields });
const CustomOrgFieldsForm = z.object({ customOrgFields: customFields });
const CustomTeamFieldsForm = z.object({ customTeamFields: customFields });

const customFieldsFieldProps = {
  elementClassName: "md:flex-row",
  element: {
    choices: {
      label: "Choices (optional)",
      placeholder: "Enter choices, comma-separated...",
    },
    flags: {
      __className: "flex-col gap-0.5",
      required: { labelInside: true },
      editable: { labelInside: true },
      hidden: { labelInside: true },
    },
    validationRegex: {
      label: "Validation Regex (contains)",
      placeholder: "e.g. ^[A-Za-z]+$",
    },
  },
};

// FIXME: hack to get around `date` being serialized as string
const WaiverForm = (event: Omit<Event, "date">) => {
  const result = z.object({ waiverDescription: zfd.text(z.string().optional()) });
  if (event.waiver === true) return result;
  return result.extend({ waiver: zfd.text(z.string().optional()) });
};

const CheckInForm = z.object({
  checkInWebhookUrl: zfd.text(z.string().optional()),
  enableCoachCheckIn: zfd.checkbox(),
  checkInInstructions: zfd.text(z.string().optional()),
  checkInFields: customFields,
  checkInPools: z
    .array(
      z.object({
        id: zfd.text(),
        maxStudents: zfd.numeric(z.number().optional()),
      })
    )
    .optional(),
});

const RoomAssignmentsForm = z.object({
  roomAssignments: z.array(
    z.object({
      id: zfd.text(),
      rooms: z.array(
        z.object({
          id: zfd.text(),
          maxStudents: zfd.numeric(),
          preferTeamSize: z.array(zfd.numeric(z.number().optional())).optional(),
          priority: zfd.numeric(z.number()),
        })
      ),
    })
  ),
});

const AddOnsForm = z.object({
  addOns: zfd.repeatableOfType(
    z.object({
      id: zfd.text().refine((x) => !x.includes(".")),
      name: zfd.text(),
      cost: zfd.numeric(),
      enabled: zfd.checkbox(),
    })
  ),
});

type LoaderData = {
  event: Event;
  serverTz: string;
};

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  return json<LoaderData & FormDefaults>({
    event,
    serverTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...setFormDefaults("EventDetails", event),
    ...setFormDefaults("CostDetails", event),
    ...setFormDefaults("CustomFields", event),
    ...setFormDefaults("CustomOrgFields", event),
    ...setFormDefaults("CustomTeamFields", event),
    ...setFormDefaults("Waiver", event),
    ...setFormDefaults("CheckIn", event),
    ...setFormDefaults("AddOns", event),
    ...setFormDefaults("RoomAssignments", event),
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const formData = await request.formData();

  let validator: Validator<Partial<Event>> | undefined;
  if (formData.get("_form") === "EventDetails")
    validator = withZod(
      EventDetailsForm.transform(({ date, ...data }) => ({
        date: zonedTimeToUtc(date, data._tz),
        ...data,
      }))
    );
  if (formData.get("_form") === "CostDetails") validator = withZod(CostDetailsForm(event));
  if (formData.get("_form") === "CustomFields") validator = withZod(CustomFieldsForm);
  if (formData.get("_form") === "CustomOrgFields") validator = withZod(CustomOrgFieldsForm);
  if (formData.get("_form") === "CustomTeamFields") validator = withZod(CustomTeamFieldsForm);
  if (formData.get("_form") === "Waiver") validator = withZod(WaiverForm(event));
  if (formData.get("_form") === "CheckIn") validator = withZod(CheckInForm);
  if (formData.get("_form") === "AddOns") validator = withZod(AddOnsForm);
  if (formData.get("_form") === "RoomAssignments") validator = withZod(RoomAssignmentsForm);

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
      {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
      {children}
    </Box>
  );
}

export default function SettingsRoute() {
  const { event, serverTz } = useLoaderData<LoaderData>();

  const hydrated = useHydrated();
  const tz = hydrated ? Intl.DateTimeFormat().resolvedOptions().timeZone : serverTz;
  const tzHelp = hydrated
    ? `In your local timezone (${tz})`
    : `In the server timezone (${serverTz})`;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Section title="Event Details">
        <SchemaForm
          id="EventDetails"
          method="post"
          schema={EventDetailsForm}
          buttonLabel="Save"
          fieldProps={{
            name: { label: "Event Name" },
            date: { help: tzHelp },
            description: { multiline: true, rows: 20 },
            hide: { label: "Hidden to Public?" },
            purchaseSeats: { label: "Custom Seats Purchase URL" },
            studentRegistrationEnabled: { label: "Student Registration Enabled?" },
            maxStudents: {
              help: "Deny registration after this many seats have been purchased (DOESN'T WORK WITH STUDENT REGISTRATION)",
            },
            maxStudentsPerOrg: {
              help: "Deny registration many seats have been purchased for an org (DOESN'T WORK WITH STUDENT REGISTRATION)",
            },
            _tz: { hide: true },
          }}
        >
          <input type="hidden" name="_tz" value={tz} />
        </SchemaForm>
      </Section>

      <Section title="Pricing Details">
        <SchemaForm
          id="CostDetails"
          method="post"
          className="flex-1"
          schema={CostDetailsForm(event)}
          buttonLabel="Save"
          fieldProps={{
            costPerStudent: { label: "Base Cost Per Student" },
            costDescription: { multiline: true, rows: 6 },
            costAdjustments: {
              label: "Cost Adjustments",
              elementClassName: "rounded-lg border border-gray-300 p-4 shadow-sm",
              element: {
                rule: {
                  __className: "md:flex-row",
                  rule: { className: "grow-0" },
                },
                adjustment: { label: "Additional Cost Per Student" },
              },
            },
          }}
        />
      </Section>

      <Section title="Add-ons" className="col-span-2">
        <SchemaForm
          id="AddOns"
          method="post"
          schema={AddOnsForm}
          buttonLabel="Save"
          fieldProps={{
            addOns: {
              elementClassName: "md:flex-row",
            },
          }}
        />
      </Section>

      <Section title="Custom Student Fields" className="col-span-2">
        <SchemaForm
          id="CustomFields"
          method="post"
          schema={CustomFieldsForm}
          buttonLabel="Save"
          fieldProps={{ customFields: customFieldsFieldProps }}
        />
      </Section>

      <Section title="Custom Organization Fields" className="col-span-2">
        <SchemaForm
          id="CustomOrgFields"
          method="post"
          schema={CustomOrgFieldsForm}
          buttonLabel="Save"
          fieldProps={{ customOrgFields: customFieldsFieldProps }}
        />
      </Section>

      <Section title="Custom Team Fields" className="col-span-2">
        <SchemaForm
          id="CustomTeamFields"
          method="post"
          schema={CustomTeamFieldsForm}
          buttonLabel="Save"
          fieldProps={{ customTeamFields: customFieldsFieldProps }}
        />
      </Section>

      <Section title="Waiver" className="col-span-2">
        {event.waiver === true && (
          <Alert status={AlertStatus.Info} title="External Waiver">
            This event is using an external waiver. Please contact Oliver to change this.
          </Alert>
        )}

        <SchemaForm
          id="Waiver"
          method="post"
          schema={WaiverForm(event)}
          buttonLabel="Save"
          fieldProps={{
            // @ts-ignore
            waiver: { multiline: true },
            waiverDescription: {
              help: "Instructions displayed with the waiver, when the student has not yet signed.",
              multiline: true,
            },
          }}
        />
      </Section>

      <Section title="Check-in" className="col-span-2">
        <SchemaForm
          id="CheckIn"
          method="post"
          schema={CheckInForm}
          buttonLabel="Save"
          fieldProps={{
            checkInWebhookUrl: { label: "Discord Webhook URL" },
            checkInInstructions: { multiline: true },
            checkInFields: { label: "Check In Fields", ...customFieldsFieldProps },
            checkInPools: { label: "Check In Pools", elementClassName: "md:flex-row" },
          }}
        />
      </Section>

      <Section title="Room Assignments" className="col-span-2">
        <SchemaForm
          id="RoomAssignments"
          method="post"
          schema={RoomAssignmentsForm}
          buttonLabel="Save"
          fieldProps={{
            roomAssignments: {
              element: {
                __label: "Section",
                rooms: {
                  label: "Rooms",
                  elementClassName: "md:flex-row",
                  element: {
                    priority: {
                      help: "Lower priority rooms fill first",
                    },
                  },
                },
              },
            },
          }}
        />
      </Section>
    </div>
  );
}

export const handle = {
  navigationHeading: "Settings",
};
