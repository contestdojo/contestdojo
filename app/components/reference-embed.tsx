/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithChildren } from "react";
import type { EventOrganization, EventTeam, Organization } from "~/utils/db.server";

import { Popover, Transition } from "@headlessui/react";
import React from "react";

import { intersperse } from "~/utils/array-utils";

type ReferenceEmbedProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  fields: { name: string; value?: string }[];
}>;

export default function ReferenceEmbed({ title, subtitle, fields, children }: ReferenceEmbedProps) {
  return (
    <Popover className="relative inline-block whitespace-normal">
      <Popover.Button className="max-w-xs cursor-pointer truncate rounded-lg bg-gray-100 px-2 text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        {children}
      </Popover.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-1/2 z-10 mt-2 flex w-screen max-w-xs -translate-x-1/2 transform flex-col gap-1 rounded-lg bg-white p-3 shadow-lg ring-1 ring-black ring-opacity-5">
          <h2 className="text-sm font-medium text-gray-900">{title}</h2>
          <h3 className="text-xs text-gray-400">{subtitle}</h3>
          <div className="mt-1 flex flex-col gap-1">
            {fields.map((x) => (
              <div key={x.name} className="flex justify-between gap-2">
                <div className="whitespace-nowrap font-medium text-gray-600">{x.name}</div>
                <div className="break-all text-right">
                  {x.value ? [...intersperse(x.value.split("\n"), <br />)] : "-"}
                </div>
              </div>
            ))}
          </div>
        </Popover.Panel>
      </Transition>
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
        { name: "Org ID", value: team.org.id },
        { name: "Notes", value: team.notes },
      ]}
    >
      {team.number ? `${team.number} · ${team.name}` : team.name}
    </ReferenceEmbed>
  );
}
