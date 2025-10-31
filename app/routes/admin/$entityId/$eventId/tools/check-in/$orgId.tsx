/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type {
  Event,
  EventOrganization,
  EventStudent,
  EventTeam,
  Organization,
} from "~/lib/db.server";

import { json } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useParams,
} from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useMemo } from "react";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";

import { CheckInForm, TeamsGrid, checkInFieldProps } from "~/components/check-in";
import { Alert, AlertStatus, Box, Button, Checkbox, Label, Select } from "~/components/ui";
import { requireUserType } from "~/lib/auth.server";
import { checkIn } from "~/lib/check-in.server";
import { db } from "~/lib/db.server";
import { SchemaForm } from "~/components/schema-form";

type LoaderData = {
  event: Event;
  orgs: (Organization & EventOrganization)[];
  selectedOrg?: {
    eventOrg: EventOrganization;
    teams: EventTeam[];
    students: EventStudent[];
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  const eventOrgsSnap = await db.eventOrgs(params.eventId).get();
  const eventOrgs = new Map(eventOrgsSnap.docs.map((x) => [x.id, x.data()]));

  const orgsSnap = await db.orgs.get();
  const orgs = orgsSnap.docs.flatMap((x) => {
    const eventOrg = eventOrgs.get(x.id);
    if (!eventOrg) return [];
    return { ...eventOrg, ...x.data() };
  });

  const result: LoaderData = { event, orgs };

  const eventOrg = eventOrgs.get(params.orgId);
  if (!eventOrg) throw new Response("Organization not found.", { status: 404 });

  const teams = await db.eventTeams(params.eventId).where("org", "==", db.org(params.orgId)).get();
  const students = await db
    .eventStudents(params.eventId)
    .where("org", "==", db.org(params.orgId))
    .get();
  result.selectedOrg = {
    eventOrg: eventOrg,
    teams: teams.docs.map((x) => x.data()),
    students: students.docs.map((x) => x.data()),
  };
  return { ...result, ...setFormDefaults("CheckIn", { checkInForm: eventOrg }) };
};

const schema = (event: Omit<Event, "date">, eventOrg: EventOrganization) => {
  return z.object({
    checkInForm: CheckInForm(event, eventOrg),
    checkInActions: z.record(z.string()),
  });
};

type ActionData = { success: false; error: string } | { success: true };

export const action: ActionFunction = async ({ request, params }) => {
  // if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  // const usere = await requireUserType(request, "admin");

  // const teams = await db.eventTeams(params.eventId).get();
  // for (const team of teams.docs) {
  //   console.log(team.id);
  //   const data = team.data();
  //   if (data.number) {
  //     if (!data.org) {
  //       console.log("BAD TEAM", data);
  //       continue;
  //     }
  //     await checkIn(usere, params.eventId, data.org.id, { [team.id]: "__auto__" });
  //   }
  // }
  // return;
  // ORIGINAL CODE
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });
  const user = await requireUserType(request, "admin");

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  // Fetch event org
  const eventOrgSnap = await db.eventOrg(params.eventId, params.orgId).get();
  const eventOrg = eventOrgSnap.data();
  if (!eventOrg) throw new Response("Organization not found.", { status: 404 });

  const formData = await request.formData();
  const validator = withZod(schema(event, eventOrg));
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  try {
    await eventOrgSnap.ref.update(db.util.mapUndefinedToDelete(result.data.checkInForm));
    await checkIn(user, params.eventId, params.orgId, result.data.checkInActions, true);
  } catch (_e) {
    let e = _e as Error;
    return json({ success: false, error: e.message });
  }

  return json({ success: true });
};

type SelectOrgProps = {
  orgs: (Organization & EventOrganization)[];
};

function SelectOrg({ orgs }: SelectOrgProps) {
  const { entityId, eventId, orgId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="col-span-full flex gap-4">
      <Select
        name="org"
        value={orgId}
        onChange={(e) => navigate(`/admin/${entityId}/${eventId}/tools/check-in/${e.target.value}`)}
      >
        <option value="" disabled>
          Select
        </option>
        {orgs.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default function OrgsRoute() {
  const { event, orgs, selectedOrg } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const transition = useNavigation();

  const orgsAlphabetical = useMemo(
    () => [...orgs].sort((a, b) => a.name.localeCompare(b.name)),
    [orgs],
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectOrg orgs={orgsAlphabetical} />

      {selectedOrg && (
        <>
          <TeamsGrid {...selectedOrg}>
            {(team, _, allReady) =>
              team.isCheckedIn ? (
                <div className="relative flex items-center justify-center gap-2">
                  <Checkbox
                    name={`checkInActions.${team.id}`}
                    id={team.id}
                    form="CheckIn"
                    value="__undo__"
                  />
                  <Label htmlFor={team.id}>Undo Check-in</Label>
                </div>
              ) : team.roomAssignments ? (
                <Select
                  name={`checkInActions.${team.id}`}
                  form="CheckIn"
                  defaultValue={allReady ? "__existing__" : "__skip__"}
                >
                  <option value="__existing__">Check In &amp; Use Previously Assigned Rooms</option>
                  <option value="__auto__">Check In &amp; Automatically Reassign Rooms</option>
                  <option value="__clear__">Clear Existing Check-in Data</option>
                  <option value="__skip__">Do Not Check In</option>
                </Select>
              ) : (
                <Select
                  name={`checkInActions.${team.id}`}
                  form="CheckIn"
                  defaultValue={allReady ? "__auto__" : "__skip__"}
                >
                  <option value="__auto__">Check In &amp; Automatically Assign Rooms</option>
                  <option value="__skip__">Do Not Check In</option>
                </Select>
              )
            }
          </TeamsGrid>

          <Box className="col-span-full flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Check-in Details</h2>
            <SchemaForm
              key={selectedOrg.eventOrg.id}
              id="CheckIn"
              method="post"
              schema={schema(event, { ...selectedOrg.eventOrg, checkInFields: {} })}
              fieldProps={{
                checkInForm: checkInFieldProps(event, {
                  ...selectedOrg.eventOrg,
                  checkInFields: {},
                }),
              }}
              overrides={{
                checkInActions: <></>,
              }}
              showButton={false}
            />
          </Box>

          <div className="col-span-full flex flex-col gap-4 lg:col-span-1 lg:col-start-2 lg:col-end-2">
            {actionData && !actionData.success && (
              <Alert status={AlertStatus.Error} title={actionData.error} />
            )}

            <Button form="CheckIn" disabled={transition.state !== "idle"}>
              Check In
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
