/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunctionArgs } from "@remix-run/node";

import { useLoaderData } from "@remix-run/react";

import { TeamsGrid } from "~/components/check-in";
import Markdown from "~/components/markdown";
import { Box } from "~/components/ui";
import Steps from "~/components/ui/steps";
import { db } from "~/lib/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  // Fetch event
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  // Fetch org
  const eventOrgsSnap = await db.eventOrg(params.eventId, params.orgId).get();
  const eventOrg = eventOrgsSnap.data();
  if (!eventOrg) throw new Response("Organization not found.", { status: 404 });

  // Fetch teams
  const orgRef = db.org(params.orgId);
  const teamsRef = db.eventTeams(params.eventId).where("org", "==", orgRef);
  const teams = await teamsRef.get();

  // Fetch students
  const studentsRef = db.eventStudents(params.eventId).where("org", "==", orgRef);
  const students = await studentsRef.get();

  return {
    event,
    eventOrg,
    teams: teams.docs.map((x) => x.data()),
    students: students.docs.map((x) => x.data()),
  };
}

function StepOne() {
  const { event } = useLoaderData<typeof loader>();

  return (
    <>
      <Box className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Confirm Details</h2>
        <p>Welcome to the online check-in system for {event.name}!</p>
      </Box>
      {event.checkInInstructions && (
        <Box>
          <Markdown children={event.checkInInstructions} />
        </Box>
      )}
    </>
  );
}

function StepTwo() {
  const { teams, students } = useLoaderData<typeof loader>();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <TeamsGrid teams={teams} students={students} />
    </div>
  );
}

export default function CheckInRoute() {
  return (
    <Steps
      labels={["Confirm Details", "Confirm Roster", "Confirm Add-ons", "Finalize Check-in"]}
      canChangeStep={() => true}
    >
      {(steps, index, setIndex) => (
        <div className="flex flex-col gap-6">
          {steps}
          {index === 0 && <StepOne />}
          {index === 1 && <StepTwo />}
        </div>
      )}
    </Steps>
  );
}

export const navigationHandle = {
  heading: "Check-in",
};
