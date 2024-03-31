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
import { Form, useActionData, useLoaderData, useLocation, useNavigation } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useMemo } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { TeamsGrid } from "~/components/check-in";
import { Alert, AlertStatus, Button, Select } from "~/components/ui";
import { requireUserType } from "~/lib/auth.server";
import { checkIn } from "~/lib/check-in.server";
import { db } from "~/lib/db.server";

type LoaderData = {
  event: Event;
  orgs: (Organization & EventOrganization)[];
  selectedOrg?: {
    teams: EventTeam[];
    students: EventStudent[];
  };
};

export const loader: LoaderFunction = async ({ request, params }) => {
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

  let { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org");
  if (orgId) {
    const teams = await db.eventTeams(params.eventId).where("org", "==", db.org(orgId)).get();
    const students = await db.eventStudents(params.eventId).where("org", "==", db.org(orgId)).get();
    result.selectedOrg = {
      teams: teams.docs.map((x) => x.data()),
      students: students.docs.map((x) => x.data()),
    };
  }

  return json<LoaderData>(result);
};

const schema = z.record(z.string());

type ActionData = { success: false; error: string } | { success: true };

export const action: ActionFunction = async ({ request, params }) => {
  const user = await requireUserType(request, "admin");
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const formData = await request.formData();
  const validator = withZod(schema);
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  try {
    await checkIn(user, params.eventId, result.data, true);
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
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const transition = useNavigation();

  return (
    <Form action="" className="col-span-full flex gap-4">
      <Select name="org" defaultValue={query.get("org") ?? ""}>
        <option value="" disabled>
          Select
        </option>
        {orgs.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={transition.state !== "idle"}>
        View
      </Button>
    </Form>
  );
}

export default function OrgsRoute() {
  const { event, orgs, selectedOrg } = useLoaderData<LoaderData>();
  const transition = useNavigation();
  const actionData = useActionData<ActionData>();

  const orgsAlphabetical = useMemo(
    () => [...orgs].sort((a, b) => a.name.localeCompare(b.name)),
    [orgs]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectOrg orgs={orgsAlphabetical} />

      {selectedOrg && (
        <TeamsGrid {...selectedOrg}>
          {(team, _, allReady) =>
            team.checkInPool ? (
              <p className="text-center text-sm">Already checked in</p>
            ) : (
              <Select
                name={team.id}
                form="check-in"
                defaultValue={allReady ? "__auto__" : "__skip__"}
              >
                <option value="__auto__">Check In: Automatically Assign Pool</option>
                <option value="__skip__">Do Not Check In</option>
                {event.checkInPools?.map((x) => (
                  <option key={x.id} value={x.id}>
                    Check In: {x.id}
                  </option>
                ))}
              </Select>
            )
          }
        </TeamsGrid>
      )}

      <Form
        id="check-in"
        method="post"
        className="col-span-full flex flex-col gap-4 lg:col-span-1 lg:col-start-2 lg:col-end-2"
      >
        {actionData && !actionData.success && (
          <Alert status={AlertStatus.Error} title={actionData.error} />
        )}

        <Button disabled={transition.state !== "idle"}>Check In</Button>
      </Form>
    </div>
  );
}
