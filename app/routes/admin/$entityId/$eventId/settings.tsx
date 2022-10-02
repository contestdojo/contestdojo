/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { withZod } from "@remix-validated-form/with-zod";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";

import Box from "~/components/box";
import SchemaForm from "~/components/forms/schema-form";

const EventDetailsForm = z.object({
  email: z.string().min(1, "Required").email(),
  password: z.string().min(1, "Required"),
});

const EventDetailsFormValidator = withZod(EventDetailsForm);

function EventDetails() {
  return (
    <Box className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-medium text-gray-900">Event Details</h2>
      <ValidatedForm
        className="flex flex-col gap-5"
        validator={EventDetailsFormValidator}
      ></ValidatedForm>

      <SchemaForm className="flex flex-col gap-5" schema={EventDetailsForm}></SchemaForm>
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
