/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithChildren } from "react";
import type { PropsWithAs } from "~/lib/utils/props-with-as";

import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import React from "react";

type DropdownProps = PropsWithChildren<{ className?: string }>;

export default function Dropdown({ className, children }: DropdownProps) {
  return (
    <Menu as="div" className={clsx`relative ${className}`}>
      {children}
    </Menu>
  );
}

type DropdownButtonProps = PropsWithChildren<{ className?: string }>;

Dropdown.Button = function DropdownButton({ className, children }: DropdownButtonProps) {
  return (
    <Menu.Button
      className={clsx`flex w-full items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 ${className}`}
    >
      {children}
      <div className="grow" />
      <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
    </Menu.Button>
  );
};

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
          align === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"
        } z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}
      >
        {children}
      </Menu.Items>
    </Transition>
  );
};

Dropdown.Item = function DropdownItem<T extends React.ElementType = "button">({
  as,
  className,
  ...props
}: PropsWithAs<{}, T>) {
  const As = as ?? "button";

  return (
    <Menu.Item>
      {({ active }) => (
        <As
          {...props}
          className={clsx`block w-full px-4 py-2 text-left text-sm text-gray-700 ${
            active && "bg-gray-100"
          } ${className}`}
        />
      )}
    </Menu.Item>
  );
};
