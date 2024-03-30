/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithChildren } from "react";
import type { EventOrganization, EventStudent, EventTeam, Organization } from "~/lib/db.server";

import { Float } from "@headlessui-float/react";
import { Popover } from "@headlessui/react";

type ReferenceEmbedProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  fields: { name: string; value?: string }[];
}>;

export function ReferenceEmbed({ title, subtitle, fields, children }: ReferenceEmbedProps) {
  return (
    <Popover className="relative inline-block whitespace-normal">
      <Float
        autoPlacement={{ allowedPlacements: ["top", "bottom"] }}
        offset={16}
        arrow
        portal
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Button className="max-w-xs cursor-pointer truncate rounded-lg bg-gray-100 px-2 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {children}
        </Popover.Button>

        <Popover.Panel className="flex w-screen max-w-xs flex-col gap-1 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
          <Float.Arrow className="absolute h-5 w-5 rotate-45 bg-white shadow-lg ring-1 ring-black ring-opacity-5" />
          <div className="relative flex flex-col gap-1 rounded-lg bg-white p-3">
            <h2 className="text-sm font-medium text-gray-900">{title}</h2>
            <h3 className="text-xs text-gray-400">{subtitle}</h3>
            <div className="mt-1 flex flex-col gap-1">
              {fields.map((x) => (
                <div key={x.name} className="flex justify-between gap-2">
                  <div className="whitespace-nowrap text-sm font-medium text-gray-600">
                    {x.name}
                  </div>
                  <div className="whitespace-pre break-all text-right text-sm text-gray-500">
                    {x.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Popover.Panel>
      </Float>
    </Popover>
  );
}

type EventOrganizationReferenceEmbedProps = { org: Organization & EventOrganization };

export function EventOrganizationReferenceEmbed({ org }: EventOrganizationReferenceEmbedProps) {
  return (
    <ReferenceEmbed
      title={org.name}
      subtitle={org.id}
      fields={[
        {
          name: "Address",
          value: `${org.address}\n${org.city}, ${org.state}, ${org.country} ${org.zip}`,
        },
        { name: "Contact Name", value: `${org.adminData.fname} ${org.adminData.lname}` },
        { name: "Contact Email", value: org.adminData.email },
        { name: "Seats Purchased", value: org.maxStudents?.toString() },
        { name: "Notes", value: org.notes },
      ]}
    >
      {org.name}
    </ReferenceEmbed>
  );
}

type EventTeamReferenceEmbedProps = { team: EventTeam };

export function EventTeamReferenceEmbed({ team }: EventTeamReferenceEmbedProps) {
  return (
    <ReferenceEmbed
      title={team.name}
      subtitle={team.id}
      fields={[
        { name: "Number", value: team.number },
        { name: "Org ID", value: team.org?.id },
        { name: "Notes", value: team.notes },
      ]}
    >
      {team.number ? `${team.number} · ${team.name}` : team.name}
    </ReferenceEmbed>
  );
}

type EventStudentReferenceEmbedProps = { student: EventStudent };

export function EventStudentReferenceEmbed({ student }: EventStudentReferenceEmbedProps) {
  const name = `${student.fname} ${student.lname}`;

  return (
    <ReferenceEmbed
      title={name}
      subtitle={student.id}
      fields={[
        { name: "Number", value: student.number },
        { name: "Email", value: student.email },
        { name: "Grade", value: student.grade?.toString() },
        { name: "Org ID", value: student.org?.id },
        { name: "Team ID", value: student.team?.id },
        { name: "Notes", value: student.notes },
      ]}
    >
      {student.number ? `${student.number} · ${name}` : name}
    </ReferenceEmbed>
  );
}
