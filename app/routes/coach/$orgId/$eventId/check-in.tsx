/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { Event, EventOrganization } from "~/lib/db.server";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  Link,
  json,
  useFetcher,
  useLoaderData,
  useLocation,
  useRevalidator,
} from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import clsx from "clsx";
import { useEffect } from "react";
import { setFormDefaults, validationError } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";

import { TeamsGrid } from "~/components/check-in";
import Markdown from "~/components/markdown";
import { SchemaForm, SubmitButton } from "~/components/schema-form";
import { Alert, AlertStatus, Box, Button, IconButton } from "~/components/ui";
import Steps from "~/components/ui/steps";
import { requireUserType } from "~/lib/auth.server";
import { checkIn } from "~/lib/check-in.server";
import { customFieldsFieldProps, customFieldsSchema } from "~/lib/custom-fields";
import { db } from "~/lib/db.server";
import { mapToObject } from "~/lib/utils/array-utils";

const CheckInForm = (event: Omit<Event, "date">, eventOrg: EventOrganization) => {
  if (!event.checkInFields) return z.object({});
  return z.object({
    checkInFields: customFieldsSchema(event.checkInFields, eventOrg.checkInFields),
  });
};

const checkInFieldProps = (event: Omit<Event, "date">, eventOrg: EventOrganization) => {
  if (!event.checkInFields) return {};
  return { checkInFields: customFieldsFieldProps(event.checkInFields, eventOrg.checkInFields) };
};

const FinalizeForm = z.object({
  acknowledgeCoach: zfd.checkbox().refine((x) => x),
  acknowledgeInstructions: zfd.checkbox().refine((x) => x),
  acknowledgeRoster: zfd.checkbox().refine((x) => x),
  acknowledgeRosterFinal: zfd.checkbox().refine((x) => x),
});

const finalizeFieldProps = {
  acknowledgeCoach: { labelInside: true, label: "I am the coach representing this organization." },
  acknowledgeInstructions: {
    labelInside: true,
    label: "I have thoroughly read and understood the check-in instructions described in Step 1.",
  },
  acknowledgeRoster: {
    labelInside: true,
    label:
      "I have verified that my roster is correct, and that all students have completed waivers (if required).",
  },
  acknowledgeRosterFinal: {
    labelInside: true,
    label: "I understand that no further changes can be made to my roster after checking in.",
  },
};

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  // Fetch event
  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });
  if (!event.enableCoachCheckIn)
    throw new Response("Online check-in is not enabled for this event.", { status: 400 });

  // Fetch org
  const eventOrgSnap = await db.eventOrg(params.eventId, params.orgId).get();
  const eventOrg = eventOrgSnap.data();
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
    ...setFormDefaults("CheckIn", eventOrg),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  if (!params.orgId) throw new Response("Org ID must be provided.", { status: 400 });
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });

  const eventSnap = await db.event(params.eventId).get();
  const event = eventSnap.data();
  if (!event) throw new Response("Event not found.", { status: 404 });

  // Fetch org
  const orgSnap = await db.org(params.orgId).get();
  const org = orgSnap.data();
  if (!org) throw new Response("Organization not found.", { status: 404 });

  const user = await requireUserType(request, "coach");
  if (org.admin.id !== user.uid)
    throw new Response("You are not an admin of this organization.", { status: 403 });

  // Fetch event org
  const eventOrgSnap = await db.eventOrg(params.eventId, params.orgId).get();
  const eventOrg = eventOrgSnap.data();
  if (!eventOrg) throw new Response("Organization not found.", { status: 404 });

  const formData = await request.formData();

  if (formData.get("_form") === "CheckIn" && event.checkInFields) {
    const validator = withZod(CheckInForm(event, eventOrg));
    const validated = await validator.validate(formData);
    if (validated.error) return validationError(validated.error);
    return await eventOrgSnap.ref.update(db.util.mapUndefinedToDelete(validated.data));
  }

  if (formData.get("_form") === "Finalize") {
    const validator = withZod(FinalizeForm);
    const validated = await validator.validate(formData);
    if (validated.error) return validationError(validated.error);

    const validator2 = CheckInForm(event, eventOrg);
    const validated2 = await validator2.safeParse(eventOrg);
    if (!validated2.success)
      return { success: false, error: "Incomplete check-in form. See Step 1." };

    const teamsSnap = await db.eventTeams(params.eventId).where("org", "==", orgSnap.ref).get();
    const teams = mapToObject(teamsSnap.docs, (x) => [x.id, "__auto__"]);

    try {
      await checkIn(user, params.eventId, teams, false);
    } catch (_e) {
      let e = _e as Error;
      return json({ success: false, error: e.message });
    }

    return { success: true, error: null };
  }

  return null;
}

type StepProps = {
  setIndex: (index: number) => void;
};

function ConfirmDetails({ setIndex }: StepProps) {
  const { event, eventOrg } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.data && typeof fetcher.data === "object" && !("fieldErrors" in fetcher.data)) {
      setIndex(1);
      revalidator.revalidate();
    }
  }, [fetcher, fetcher.data, setIndex, revalidator]);

  return (
    <>
      <Box className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Confirm Details</h2>
        <p>Welcome to the online check-in system for {event.name}!</p>
      </Box>

      <hr />

      {event.checkInInstructions && (
        <Box>
          <Markdown children={event.checkInInstructions} />
        </Box>
      )}

      {event.checkInFields && (
        <Box className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Check-in Details</h2>
          <SchemaForm
            fetcher={fetcher}
            id="CheckIn"
            method="post"
            schema={CheckInForm(event, { ...eventOrg, checkInFields: {} })}
            fieldProps={checkInFieldProps(event, { ...eventOrg, checkInFields: {} })}
            showButton={false}
          />
        </Box>
      )}

      <SubmitButton formId="CheckIn" className="self-center">
        Save and Continue
      </SubmitButton>
    </>
  );
}

function ConfirmRoster({ setIndex }: StepProps) {
  const { teams, students } = useLoaderData<typeof loader>();
  const teamsUrl = new URL("teams", new URL(useLocation().pathname, "https://contestdojo.com/"));
  const revalidator = useRevalidator();

  return (
    <>
      <Box className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Confirm Roster</h2>
        <p>
          Please confirm your roster shown below. You can make changes to your roster at the{" "}
          <a className="text-blue-500 hover:underline" href={teamsUrl.toString()}>
            Teams portal
          </a>
          .{" "}
        </p>
        <p className="font-semibold">
          Once checked in, no further changes can be made, so please ensure your roster is correct.
        </p>
      </Box>

      <hr />

      <Alert
        className="relative"
        status={AlertStatus.Info}
        title="This page does not update automatically."
      >
        To see new updates to your roster, please click the button on the right or refresh the page.
        <div className="absolute inset-0 flex items-center justify-end pr-4">
          <IconButton onClick={revalidator.revalidate}>
            <ArrowPathIcon
              className={clsx`h-6 w-6 ${revalidator.state === "loading" && "animate-spin"}`}
            />
          </IconButton>
        </div>
      </Alert>

      <div
        className={clsx`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3 ${
          revalidator.state === "loading" && "opacity-50"
        }`}
      >
        <TeamsGrid teams={teams} students={students} />
      </div>

      <Button
        disabled={revalidator.state === "loading"}
        onClick={() => setIndex(2)}
        className="self-center"
      >
        Continue
      </Button>
    </>
  );
}

function FinalizeCheckIn(_: StepProps) {
  const { event } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const revalidator = useRevalidator();

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success) {
      revalidator.revalidate();
    }
  }, [fetcher, fetcher.data, revalidator]);

  return (
    <>
      <Box className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Check In</h2>
        <p>
          Please acknowledge the following statements in order to complete the check-in process.
        </p>
      </Box>

      <Box className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Final Confirmation</h2>
        <SchemaForm
          fetcher={fetcher}
          id="Finalize"
          method="post"
          schema={FinalizeForm}
          fieldProps={finalizeFieldProps}
          buttonLabel={`Check Into ${event.name}`}
        >
          {fetcher.data && "success" in fetcher.data && !fetcher.data.success && (
            <Alert
              status={AlertStatus.Error}
              title={fetcher.data.error ?? "An unexpected error occurred."}
            />
          )}
        </SchemaForm>
      </Box>
    </>
  );
}

export default function CheckInRoute() {
  const { event, eventOrg, teams, students } = useLoaderData<typeof loader>();
  const teamsUrl = new URL("teams", new URL(useLocation().pathname, "https://contestdojo.com/"));

  if (teams.some((x) => x.checkInPool)) {
    return (
      <div className="flex flex-col gap-4">
        {teams.some((x) => !x.checkInPool) ? (
          <Alert status={AlertStatus.Warning} title="Partially Checked In" className="p-4">
            Some teams have not been checked in yet. This likely means you added additional teams
            after checking in. Please contact the tournament for guidance.
          </Alert>
        ) : (
          <Alert status={AlertStatus.Success} title="Checked In" className="p-4">
            You have checked in for this event. Your teams are displayed below, with their IDs and
            room assignments.
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3">
          <TeamsGrid teams={teams} students={students}>
            {(team) =>
              !team.checkInPool ? (
                <p className="text-center text-sm font-medium text-red-500">Not checked in</p>
              ) : null
            }
          </TeamsGrid>
        </div>

        {event.checkInFields && (
          <Box className="flex flex-col gap-4">
            <SchemaForm
              id="CheckIn"
              method="post"
              schema={CheckInForm(event, eventOrg)}
              fieldProps={checkInFieldProps(event, eventOrg)}
              buttonLabel="Update Details"
            />
          </Box>
        )}

        <Button as={Link} to={teamsUrl.toString()} className="self-center">
          Return to Teams Portal
        </Button>
      </div>
    );
  }

  return (
    <Steps labels={["Confirm Details", "Confirm Roster", "Check In"]} canChangeStep={() => true}>
      {(steps, index, setIndex) => (
        <div className="flex flex-col gap-6">
          {steps}
          {index === 0 && <ConfirmDetails setIndex={setIndex} />}
          {index === 1 && <ConfirmRoster setIndex={setIndex} />}
          {index === 2 && <FinalizeCheckIn setIndex={setIndex} />}
        </div>
      )}
    </Steps>
  );
}
