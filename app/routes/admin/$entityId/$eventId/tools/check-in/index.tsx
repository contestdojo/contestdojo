/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { Event, EventOrganization, Organization } from "~/lib/db.server";

import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useMemo } from "react";

import { Select } from "~/components/ui";
import { db } from "~/lib/db.server";

type LoaderData = {
  event: Event;
  orgs: (Organization & EventOrganization)[];
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

  return { event, orgs };
};

type SelectOrgProps = {
  orgs: (Organization & EventOrganization)[];
};

function SelectOrg({ orgs }: SelectOrgProps) {
  const { entityId, eventId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="col-span-full flex gap-4">
      <Select
        name="org"
        value={""}
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
  const { orgs } = useLoaderData<LoaderData>();

  const orgsAlphabetical = useMemo(
    () => [...orgs].sort((a, b) => a.name.localeCompare(b.name)),
    [orgs]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectOrg orgs={orgsAlphabetical} />
    </div>
  );
}
