import { Disclosure, Menu } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, NavLink, Outlet, useLoaderData, useMatches } from "@remix-run/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import Dropdown from "~/components/dropdown";
import type { User } from "~/utils/auth.server";
import { requireAdmin } from "~/utils/auth.server";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAdmin(request);
  return json<LoaderData>({ user });
};

type NavItemProps = PropsWithChildren<{
  to: string;
}>;

function NavItem({ to, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx`rounded-md px-3 py-2 text-sm font-medium ${
          isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
        }`
      }
      aria-current="page"
    >
      {children}
    </NavLink>
  );
}

const MOBILE_NAV_ITEM_CLASS_NAME = clsx`block rounded-md px-3 py-2 font-medium text-gray-400 ${
  false ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
}`;

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

export default function AdminRoute() {
  const { user } = useLoaderData<LoaderData>();

  const matches = useMatches();
  const entityId = matches.find((x) => x.id === "routes/admin/$entityId")?.params.entityId;
  const eventId = matches.find((x) => x.id === "routes/admin/$entityId/$eventId")?.params.eventId;

  const titles = matches.map((x) => x.handle?.navigationHeading).filter(Boolean);
  const title = titles.length > 0 ? titles[titles.length - 1] : "Admin";

  return (
    <div className="min-h-full">
      <Disclosure as="nav" className="bg-gray-800">
        {({ open }) => (
          <>
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Left navigation */}
              <div className="flex items-center">
                <img
                  className="h-8 w-8 flex-shrink-0"
                  src="/assets/logo-icon.svg"
                  alt="ContestDojo Logo"
                />

                {/* TODO: Event Selector */}

                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {entityId && eventId && (
                      <>
                        <NavItem to={`${entityId}/${eventId}/orgs`}>Organizations</NavItem>
                        <NavItem to={`${entityId}/${eventId}/teams`}>Teams</NavItem>
                        <NavItem to={`${entityId}/${eventId}/students`}>Students</NavItem>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile dropdown */}
              <div className="ml-4 hidden items-center md:ml-6 md:flex">
                <Dropdown>
                  <Menu.Button className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span className="sr-only">Open user menu</span>
                    <img className="h-8 w-8 rounded-full" src={user.photoUrl} alt="" />
                  </Menu.Button>

                  <Dropdown.Items className="divide-y divide-gray-100">
                    <div className="py-1">
                      <Dropdown.Item to="/admin">Entities</Dropdown.Item>
                      <Dropdown.Item to="/admin/settings">Settings</Dropdown.Item>
                    </div>
                    <Form className="py-1" action="/logout" method="post">
                      <Dropdown.ItemFn>
                        {(className) => (
                          <button className={`w-full text-left ${className}`} type="submit">
                            Sign Out
                          </button>
                        )}
                      </Dropdown.ItemFn>
                    </Form>
                  </Dropdown.Items>
                </Dropdown>
              </div>

              {/* Mobile menu button */}
              <div className="-mr-2 flex md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>

            <Disclosure.Panel className="md:hidden">
              {/* TODO: Event Selector */}

              {entityId && eventId && (
                <div className="space-y-1 px-2 pt-2 pb-3 sm:px-3">
                  <MobileNavItem to={`${entityId}/${eventId}/orgs`}>Organizations</MobileNavItem>
                  <MobileNavItem to={`${entityId}/${eventId}/teams`}>Teams</MobileNavItem>
                  <MobileNavItem to={`${entityId}/${eventId}/students`}>Students</MobileNavItem>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4 pb-3">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <img className="h-10 w-10 rounded-full" src={user.photoUrl} alt="" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-snug text-white">
                      {user.displayName}
                    </div>
                    <div className="text-sm font-medium leading-snug text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1 px-2 sm:px-3">
                  <Form action="/logout" method="post">
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
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold leading-6 text-gray-900">{title}</h1>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-4 sm:px-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
