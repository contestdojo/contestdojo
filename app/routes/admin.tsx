/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { PropsWithChildren } from "react";
import type { LoaderData as EntityIdLoaderData } from "~/routes/admin/$entityId";
import type { LoaderData as EventIdLoaderData } from "~/routes/admin/$entityId/$eventId";
import type { User } from "~/utils/auth.server";
import type { Entity, Event } from "~/utils/db.server";

import { Disclosure, Menu } from "@headlessui/react";
import { BuildingOffice2Icon, CalendarIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import clsx from "clsx";

import Dropdown from "~/components/dropdown";
import { chunk } from "~/utils/array-utils";
import { requireAdmin } from "~/utils/auth.server";
import db from "~/utils/db.server";
import makePartial from "~/utils/make-partial";
import useMatchData from "~/utils/use-match-data";

type LoaderData = {
  user: User;
  entities: Entity[];
  events?: Event[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const user = await requireAdmin(request);
  const entitiesSnap = await db.entities.where("admins", "array-contains", db.user(user.uid)).get();
  const entities = entitiesSnap.docs.map((x) => x.data());

  const eventChunks = await Promise.all(
    [...chunk(entities, 10)]
      .map((ch) => ch.map((x) => db.entity(x.id)))
      .map((ch) => db.events.where("owner", "in", ch).get())
  );

  const events = eventChunks.flatMap((ch) => ch.docs.map((x) => x.data()));

  return json<LoaderData>({ user, entities, events });
};

type NavItemProps = PropsWithChildren<{
  to: string;
}>;

function NavItem({ to, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx`rounded-md px-4 py-2 text-sm font-medium ${
          isActive ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"
        }`
      }
      aria-current="page"
    >
      {children}
    </NavLink>
  );
}

const MOBILE_NAV_ITEM_CLASS_NAME =
  "block rounded-md px-3 py-2 font-medium text-gray-400 hover:bg-gray-700 hover:text-white";

type MobileNavItemProps = PropsWithChildren<{ to: string }>;

function MobileNavItem({ children, ...props }: MobileNavItemProps) {
  return (
    <Disclosure.Button
      as={NavLink}
      to={props.to}
      className={MOBILE_NAV_ITEM_CLASS_NAME}
      aria-current="page"
    >
      {children}
    </Disclosure.Button>
  );
}

function NavDivider() {
  return (
    <div className="relative hidden self-stretch lg:block">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="h-full border-l border-gray-700" />
      </div>
    </div>
  );
}

type EntityEventSelectorProps<T> = {
  all: T[];
  current?: T;
  icon: JSX.Element;
  label: string;
  align?: "left" | "right";
  to: (item: T) => string;
};

function EntityEventSelector<T extends { id: string; name: string }>({
  all,
  current,
  icon,
  label,
  align,
  to,
}: EntityEventSelectorProps<T>) {
  return (
    <Dropdown className="grow">
      <Menu.Button
        className={clsx`flex w-full items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white ${
          current ? "text-white" : "text-gray-400"
        }`}
      >
        {icon}
        {current?.name ?? `Select ${label}...`}
        <div className="grow" />
        <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
      </Menu.Button>

      <Dropdown.Items align={align}>
        {all.map((x) => (
          <Dropdown.Item key={x.id} as={Link} to={to(x)}>
            {x.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Items>
    </Dropdown>
  );
}

export default function AdminRoute() {
  const matches = useMatches();
  const { entity } = makePartial(useMatchData<EntityIdLoaderData>("routes/admin/$entityId"));
  const { event } = makePartial(useMatchData<EventIdLoaderData>("routes/admin/$entityId/$eventId"));

  let { user, entities, events } = useLoaderData<LoaderData>();
  events = entity && events?.filter((x) => x.owner.id === entity?.id);

  const titles = matches.map((x) => x.handle?.navigationHeading).filter(Boolean);
  const title = titles.length > 0 ? titles[titles.length - 1] : "Admin";

  return (
    <div className="flex h-full flex-col">
      <Disclosure as="nav" className="z-20 bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
              {/* Left navigation */}
              <div className="flex items-center gap-5">
                <Link to=".">
                  <img
                    className="h-8 w-8 flex-shrink-0"
                    src="/assets/logo-icon.svg"
                    alt="ContestDojo Logo"
                  />
                </Link>

                <NavDivider />

                {/* Entity & Event Selectors */}
                <div className="hidden gap-4 lg:flex">
                  <EntityEventSelector
                    all={entities}
                    current={entity}
                    icon={<BuildingOffice2Icon className="mr-2 h-5 w-5" aria-hidden="true" />}
                    label="Entity"
                    to={(x) => x.id}
                  />

                  {events && (
                    <EntityEventSelector
                      all={events}
                      current={event}
                      icon={<CalendarIcon className="mr-2 h-5 w-5" aria-hidden="true" />}
                      label="Event"
                      to={(x) => `${x.owner.id}/${x.id}`}
                    />
                  )}
                </div>

                {/* Event Navigation */}
                {entity && event && (
                  <>
                    <NavDivider />
                    <div className="hidden gap-4 lg:flex">
                      <>
                        <NavItem to={`${entity.id}/${event.id}/orgs`}>Organizations</NavItem>
                        <NavItem to={`${entity.id}/${event.id}/teams`}>Teams</NavItem>
                        <NavItem to={`${entity.id}/${event.id}/students`}>Students</NavItem>
                        <NavItem to={`${entity.id}/${event.id}/tests`}>Tests</NavItem>
                        <NavItem to={`${entity.id}/${event.id}/settings`}>Settings</NavItem>
                      </>
                    </div>
                  </>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="hidden items-center lg:ml-6 lg:flex">
                <Dropdown>
                  <Menu.Button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="sr-only">Open user menu</span>
                    <img className="h-8 w-8 rounded-full" src={user.photoUrl} alt="" />
                  </Menu.Button>

                  <Dropdown.Items className="divide-y divide-gray-100">
                    <div className="py-1">
                      <Dropdown.Item as={Link} to="/admin">
                        Entities
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/admin/settings">
                        Settings
                      </Dropdown.Item>
                    </div>
                    <Form className="py-1" action="/logout" method="post">
                      <Dropdown.Item type="submit">Sign Out</Dropdown.Item>
                    </Form>
                  </Dropdown.Items>
                </Dropdown>
              </div>

              {/* Mobile menu button */}
              <div className="-mr-2 flex lg:hidden">
                <Disclosure.Button className="flex rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>

            <Disclosure.Panel className="divide-y divide-gray-700 lg:hidden">
              <div className="flex flex-col gap-1 p-2">
                <div className="flex justify-between gap-3 px-2 pb-2">
                  <EntityEventSelector
                    all={entities}
                    current={entity}
                    icon={<BuildingOffice2Icon className="mr-2 h-5 w-5" aria-hidden="true" />}
                    label="Entity"
                    to={(x) => x.id}
                    align="left"
                  />

                  {events && (
                    <EntityEventSelector
                      all={events}
                      current={event}
                      icon={<CalendarIcon className="mr-2 h-5 w-5" aria-hidden="true" />}
                      label="Event"
                      to={(x) => `${x.owner.id}/${x.id}`}
                    />
                  )}
                </div>

                {entity && event && (
                  <>
                    <MobileNavItem to={`${entity.id}/${event.id}/orgs`}>
                      Organizations
                    </MobileNavItem>
                    <MobileNavItem to={`${entity.id}/${event.id}/teams`}>Teams</MobileNavItem>
                    <MobileNavItem to={`${entity.id}/${event.id}/students`}>Students</MobileNavItem>
                    <MobileNavItem to={`${entity.id}/${event.id}/tests`}>Tests</MobileNavItem>
                    <MobileNavItem to={`${entity.id}/${event.id}/settings`}>Settings</MobileNavItem>
                  </>
                )}
              </div>

              <div className="p-2">
                <div className="flex items-center gap-3 p-3">
                  <img className="h-10 w-10 rounded-full" src={user.photoUrl} alt="" />
                  <div>
                    <div className="font-medium leading-snug text-white">{user.displayName}</div>
                    <div className="text-sm font-medium leading-snug text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>

                <Form className="flex flex-col gap-1" action="/logout" method="post">
                  <MobileNavItem to="/admin">Entities</MobileNavItem>
                  <MobileNavItem to="/admin/settings">Settings</MobileNavItem>
                  <button
                    className={`w-full text-left ${MOBILE_NAV_ITEM_CLASS_NAME}`}
                    type="submit"
                  >
                    Sign Out
                  </button>
                </Form>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="z-10 bg-white shadow">
        <div className="mx-auto max-w-7xl py-4 px-6">
          <h1 className="text-lg font-semibold leading-none">{title}</h1>
        </div>
      </header>

      <main className="z-0 mx-auto min-h-0 w-full flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
