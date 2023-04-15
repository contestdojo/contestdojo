/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { Transaction } from "firebase-admin/firestore";
import type {
  Event,
  EventOrganization,
  EventStudent,
  EventTeam,
  Organization,
} from "~/lib/db.server";

import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { json } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useLocation, useTransition } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import clsx from "clsx";
import { useMemo } from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import { Alert, AlertStatus, Box, Button, Select } from "~/components/ui";
import { db } from "~/lib/db.server";
import { firestore } from "~/lib/firebase.server";
import sendgrid from "~/lib/sendgrid.server";

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
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type ActionData = { success: false; error: string } | { success: true };

export const action: ActionFunction = async ({ request, params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  const eventRef = db.event(params.eventId);

  const formData = await request.formData();

  const validator = withZod(schema);
  const result = await validator.validate(formData);
  if (result.error) return validationError(result.error);

  const eventSnap = await eventRef.get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });
  if (!event.checkInPools) throw new Error("Event does not have check-in pools set up.");
  const checkInPools = event.checkInPools;

  const transactionFunc = async (t: Transaction) => {
    const pools = await Promise.all(
      checkInPools.map(async (x) => ({
        id: x.id,
        maxStudents: x.maxStudents ?? Infinity,
        numStudents: (
          await db.eventStudents(eventRef.id).where("checkInPool", "==", x.id).count().get()
        ).data().count,
      }))
    );

    let query = db.eventTeams(eventRef.id).where("number", "!=", "").orderBy("number", "desc");
    const teamsSnap = await query.get();
    let nextNumber = teamsSnap.docs.map((x) => Number(x.data().number)).find((x) => !isNaN(x)) ?? 0;
    nextNumber++;

    const entries = Object.entries(result.data);
    const allStudents = await Promise.all(
      entries.map(([id]) =>
        t.get(db.eventStudents(eventRef.id).where("team", "==", db.eventTeam(eventRef.id, id)))
      )
    );

    const _orgIds = await Promise.all(entries.map(([id]) => t.get(db.eventTeam(eventRef.id, id))));
    const orgIds = _orgIds.map((x) => x.data()?.org?.id).filter(Boolean);

    const zipped = entries.map(([id, poolId], i) => ({
      id,
      poolId,
      students: allStudents[i],
    }));

    for (let { id, poolId, students } of zipped) {
      if (poolId === "__skip__") continue;

      if (poolId === "__auto__") {
        poolId = pools.reduce((a, b) =>
          a.maxStudents - a.numStudents > b.maxStudents - b.numStudents ? a : b
        ).id;
      }

      const number = String(nextNumber++).padStart(3, "0");
      const pool = pools.find((x) => x.id === poolId);
      const taken = new Set(
        students.docs
          .map((x) => x.data().number)
          .map((x) => x?.startsWith(number) && x[x.length - 1])
          .filter(Boolean)
      );

      if (!pool) throw new Error("Invalid check-in pool provided.");
      if (pool.maxStudents && pool.maxStudents < (pool.numStudents ?? 0) + students.docs.length) {
        throw new Error("Pool would exceed maximum capacity.");
      }

      t.update(db.eventTeam(eventRef.id, id), {
        number,
        checkInPool: poolId,
      });

      for (const student of students.docs) {
        const letter = alphabet.find((x) => !taken.has(x));
        t.update(student.ref, { number: `${number}${letter}`, checkInPool: poolId });
        taken.add(letter);
      }

      pool.numStudents += students.docs.length;
    }

    t.update(eventRef, { checkInPools: pools });

    return new Set(orgIds as string[]);
  };

  let orgIds: Set<string>;

  try {
    orgIds = await firestore.runTransaction(transactionFunc);
  } catch (_e) {
    const e = _e as Error;
    return json<ActionData>({ success: false, error: e.message });
  }

  console.log(orgIds);

  try {
    await Promise.all(
      [...orgIds].map(async (x) => {
        const org = await db.org(x).get();
        const orgData = org.data();
        console.log(orgData);
        if (!orgData) return;

        const teams = await db.eventTeams(eventRef.id).where("org", "==", db.org(x)).get();
        const students = await db.eventStudents(eventRef.id).where("org", "==", db.org(x)).get();

        const teamsText = teams.docs
          .map((x) => x.data())
          .map((x) =>
            x.checkInPool
              ? `Team ${x.name} — ${x.number} — ${x.checkInPool}`
              : `Team ${x.name} — Not Checked In`
          )
          .join("\n");

        const studentsText = students.docs
          .map((x) => x.data())
          .map((x) =>
            x.checkInPool
              ? `Student ${x.fname} ${x.lname} — ${x.number} — ${x.checkInPool}`
              : `Student ${x.fname} ${x.lname} — Not Checked In`
          );

        console.log(teamsText + "\n\n" + studentsText);

        await sendgrid.send({
          to: org.data()?.adminData.email,
          from: "noreply@contestdojo.com",
          templateId: "d-1d624e07ec5b4930824eecc1e28007e1",
          dynamicTemplateData: {
            event: event.name,
            org: orgData.name,
            text: teamsText + "\n\n" + studentsText,
          },
        });
      })
    );
  } catch (e) {
    console.error(e);
  }

  return json<ActionData>({ success: true });
};

type SelectOrgProps = {
  orgs: (Organization & EventOrganization)[];
};

function SelectOrg({ orgs }: SelectOrgProps) {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const transition = useTransition();

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
      <Button
        type="submit"
        disabled={transition.state !== "idle" && transition.type.startsWith("loader")}
      >
        View
      </Button>
    </Form>
  );
}

type TeamProps = {
  event: Event;
  team: EventTeam;
  students: EventStudent[];
};

function Team({ event, team, students }: TeamProps) {
  const allReady = students.length === students.filter((x) => x.waiver).length;

  return (
    <Box
      className={clsx`flex flex-col gap-4 p-4 ${
        !team.checkInPool &&
        (allReady
          ? "border-transparent ring-2 ring-green-500"
          : "border-transparent ring-2 ring-red-500")
      }`}
    >
      <h3 className="flex flex-row items-center gap-2">
        <span className="font-medium">{team.name}</span>
        {team.number && (
          <span className="rounded-lg bg-gray-100 px-2 text-sm text-gray-500">{team.number}</span>
        )}
        {team.checkInPool && <span className="text-sm text-gray-500">{team.checkInPool}</span>}
      </h3>

      <div className="flex flex-1 flex-col gap-2 text-sm">
        {students.map((x) => (
          <div
            key={x.id}
            className={clsx`flex items-center gap-2 ${
              x.waiver ? (x.number ? "text-gray-500" : "text-green-500") : "text-red-500"
            }`}
          >
            {x.waiver ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            {x.number && <span className="rounded-lg bg-gray-100 px-2">{x.number}</span>}
            {x.fname} {x.lname}
            {!x.waiver && <span className="rounded-lg bg-red-100 px-2">No Waiver</span>}
          </div>
        ))}
      </div>

      {team.checkInPool ? (
        <p className="text-center text-sm">Already checked in</p>
      ) : (
        <Select name={team.id} form="check-in" defaultValue={allReady ? "__auto__" : "__skip__"}>
          <option value="__auto__">Check In: Automatically Assign Pool</option>
          <option value="__skip__">Do Not Check In</option>
          {event.checkInPools?.map((x) => (
            <option key={x.id} value={x.id}>
              Check In: {x.id}
            </option>
          ))}
        </Select>
      )}
    </Box>
  );
}

type TeamsProps = {
  event: Event;
  teams: EventTeam[];
  students: EventStudent[];
};

function Teams({ event, teams, students }: TeamsProps) {
  const transition = useTransition();
  const actionData = useActionData<ActionData>();

  const studentsByTeam = useMemo(
    () =>
      students.reduce<Map<string, EventStudent[]>>((acc, curr) => {
        if (curr.team) {
          const team = acc.get(curr.team.id);
          if (!team) acc.set(curr.team.id, [curr]);
          else team.push(curr);
        }
        return acc;
      }, new Map()),
    [students]
  );

  return (
    <>
      {teams.map((x) => (
        <Team key={x.id} event={event} team={x} students={studentsByTeam.get(x.id) ?? []} />
      ))}

      <div className="hidden lg:block" />

      <Form
        id="check-in"
        method="post"
        className="col-span-full flex flex-col gap-4 lg:col-span-1 lg:col-start-2 lg:col-end-2"
      >
        {actionData && !actionData.success && (
          <Alert status={AlertStatus.Error} title={actionData.error} />
        )}

        <Button disabled={transition.state !== "idle" && transition.type.startsWith("action")}>
          Check In
        </Button>
      </Form>
    </>
  );
}

export default function OrgsRoute() {
  const { event, orgs, selectedOrg } = useLoaderData<LoaderData>();

  const orgsAlphabetical = useMemo(
    () => [...orgs].sort((a, b) => a.name.localeCompare(b.name)),
    [orgs]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectOrg orgs={orgsAlphabetical} />
      {selectedOrg && <Teams event={event} {...selectedOrg} />}
    </div>
  );
}