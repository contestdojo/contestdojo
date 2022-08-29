import { Menu, Transition } from "@headlessui/react";
import { Link } from "@remix-run/react";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import React from "react";

type DropdownProps = PropsWithChildren<{}>;

export default function Dropdown({ children }: DropdownProps) {
  return (
    <Menu as="div" className="relative">
      {children}
    </Menu>
  );
}

type DropdownItemsProps = PropsWithChildren<{ className?: string }>;

Dropdown.Items = function DropdownItems({ className, children }: DropdownItemsProps) {
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
        className={clsx`absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${className}`}
      >
        {children}
      </Menu.Items>
    </Transition>
  );
};

type DropdownItemProps = PropsWithChildren<{ to: string }>;

Dropdown.Item = function DropdownItem({ to, children }: DropdownItemProps) {
  return (
    <Menu.Item>
      {({ active }) => (
        <Link
          to={to}
          className={clsx`block px-4 py-2 text-sm text-gray-700 ${active && "bg-gray-100"}`}
        >
          {children}
        </Link>
      )}
    </Menu.Item>
  );
};
