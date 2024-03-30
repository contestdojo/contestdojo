/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// TODO: Make this not a straight copy paste of admin.tsx

import type { LoaderFunctionArgs } from "@remix-run/node";
import type { ShouldRevalidateFunctionArgs } from "@remix-run/react";
import type { PropsWithChildren } from "react";
import type { Event } from "~/lib/db.server";

import { Disclosure, Menu } from "@headlessui/react";
import { BuildingOffice2Icon, CalendarIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import clsx from "clsx";
import { compareDesc } from "date-fns";

import { Dropdown } from "~/components/ui";
import { requireUserType } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { makePartial } from "~/lib/utils/object-utils";
import { useMatchData } from "~/lib/utils/route-utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUserType(request, "coach");
  const orgsSnap = await db.orgs.where("admin", "==", db.user(user.uid)).get();
  const orgs = orgsSnap.docs.map((x) => x.data());
  let events: Event[] = [];

  if (params.orgId) {
    const eventOrgs = await db.orgsGroup.where("_id", "==", params.orgId).get();
    events = (await Promise.all(
      eventOrgs.docs
        .map((x) => x.ref.parent.parent)
        .filter(Boolean)
        .map((x) => db.event(x!.id))
        .filter((x) => x && x.id != "smt21")
        .map((x) => x!.get().then((y) => y.data()))
        .filter(Boolean)
    )) as Event[];
  }

  events.sort((a, b) => compareDesc(a.date, b.date));

  return json({ user, orgs, events });
}

export function shouldRevalidate({
  currentParams,
  defaultShouldRevalidate,
  nextParams,
}: ShouldRevalidateFunctionArgs) {
  if (currentParams.orgId !== nextParams.orgId) return true;
  return defaultShouldRevalidate;
}

// type NavItemProps = PropsWithChildren<{
//   to: string;
// }>;

// function NavItem({ to, children }: NavItemProps) {
//   return (
//     <NavLink
//       to={to}
//       className={({ isActive }) =>
//         clsx`rounded-md px-4 py-2 text-sm font-medium ${
//           isActive ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-700 hover:text-white"
//         }`
//       }
//       aria-current="page"
//     >
//       {children}
//     </NavLink>
//   );
// }

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

export default function CoachRoute() {
  const matches = useMatches();
  const { org } = makePartial(useMatchData<any>("routes/coach/$orgId"));
  const { event } = makePartial(useMatchData<any>("routes/coach/$orgId/$eventId"));

  let { user, orgs, events } = useLoaderData<typeof loader>();

  const titles = matches.map((x) => (x.handle as any)?.navigationHeading).filter(Boolean);
  const title = titles.length > 0 ? titles[titles.length - 1] : "Coach";

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

                {/* Organization & Event Selectors */}
                <div className="hidden gap-4 lg:flex">
                  <EntityEventSelector
                    all={orgs}
                    current={org}
                    icon={<BuildingOffice2Icon className="mr-2 h-5 w-5" aria-hidden="true" />}
                    label="Organization"
                    to={(x) => x.id}
                  />

                  {org && events && (
                    <EntityEventSelector
                      all={[...events, { id: "__all__", name: "(Other Events)" }]}
                      current={event}
                      icon={<CalendarIcon className="mr-2 h-5 w-5" aria-hidden="true" />}
                      label="Event"
                      to={(x) => (x.id === "__all__" ? org.id : `${org.id}/${x.id}`)}
                    />
                  )}
                </div>
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
                    all={orgs}
                    current={org}
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
                    className={clsx`w-full text-left ${MOBILE_NAV_ITEM_CLASS_NAME}`}
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
        <div className="mx-auto max-w-7xl px-6 py-4">
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
