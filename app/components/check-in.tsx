/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Event, EventOrganization, EventStudent, EventTeam } from "~/lib/db.server";

import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import React, { useMemo } from "react";
import { z } from "zod";

import { customFieldsFieldProps, customFieldsSchema } from "~/lib/custom-fields";
import { Box } from "~/components/ui";

export const CheckInForm = (event: Omit<Event, "date">, eventOrg: EventOrganization) => {
  if (!event.checkInFields) return z.object({});
  return z.object({
    checkInFields: customFieldsSchema(event.checkInFields, eventOrg.checkInFields),
  });
};

export const checkInFieldProps = (event: Omit<Event, "date">, eventOrg: EventOrganization) => {
  if (!event.checkInFields) return {};
  return { checkInFields: customFieldsFieldProps(event.checkInFields, eventOrg.checkInFields) };
};

type TeamProps = {
  team: EventTeam;
  students: EventStudent[];
  children?: (team: EventTeam, students: EventStudent[], allReady: boolean) => React.ReactNode;
};

function Team({ team, students, children }: TeamProps) {
  const allReady = students.length === students.filter((x) => x.waiver).length;

  return (
    <Box
      className={clsx`flex flex-col gap-4 p-4 ${
        !team.isCheckedIn &&
        students.length > 0 &&
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

      {children?.(team, students, allReady)}

      {team.roomAssignments && (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Room Assignments</h3>

          {Object.entries(team.roomAssignments).map(([k, v]) => (
            <p key={k} className="text-sm text-gray-500">
              <span className="font-semibold">{k}:</span> {v}
            </p>
          ))}
        </div>
      )}
    </Box>
  );
}

type TeamsProps = {
  teams: EventTeam[];
  students: EventStudent[];
  children?: TeamProps["children"];
};

export function TeamsGrid({ teams, students, children }: TeamsProps) {
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
    [students],
  );

  return (
    <>
      {teams.map((x) => (
        <Team key={x.id} team={x} students={studentsByTeam.get(x.id) ?? []} children={children} />
      ))}

      <div className="hidden lg:block" />
    </>
  );
}
