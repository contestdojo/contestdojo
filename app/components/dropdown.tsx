/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithChildren } from "react";

import { Menu, Transition } from "@headlessui/react";
import { Link } from "@remix-run/react";
import clsx from "clsx";
import React from "react";

type DropdownProps = PropsWithChildren<{ className?: string }>;

export default function Dropdown({ className, children }: DropdownProps) {
  return (
    <Menu as="div" className={`relative ${className}`}>
      {children}
    </Menu>
  );
}

type DropdownItemsProps = PropsWithChildren<{
  className?: string;
  align?: "left" | "right";
}>;

Dropdown.Items = function DropdownItems({
  className,
  children,
  align = "right",
}: DropdownItemsProps) {
  return (
    <Transition
      as={React.Fragment}
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      <Menu.Items
        className={clsx`absolute ${
          align === "left" ? "left-0" : "right-0"
        } mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}
      >
        {children}
      </Menu.Items>
    </Transition>
  );
};

type DropdownItemFnProps = { children: (className: string) => JSX.Element };

Dropdown.ItemFn = function DropdownItem({ children }: DropdownItemFnProps) {
  return (
    <Menu.Item>
      {({ active }) =>
        children(clsx`block px-4 py-2 text-sm text-gray-700 ${active && "bg-gray-100"}`)
      }
    </Menu.Item>
  );
};

type DropdownItemProps = PropsWithChildren<{ to: string }>;

Dropdown.Item = function DropdownItem({ to, children }: DropdownItemProps) {
  return (
    <Dropdown.ItemFn>
      {(className) => (
        <Link to={to} className={className}>
          {children}
        </Link>
      )}
    </Dropdown.ItemFn>
  );
};
