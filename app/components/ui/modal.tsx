/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ComponentType, PropsWithChildren, ReactNode } from "react";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

type ModalProps = PropsWithChildren<{
  open: boolean;
  setOpen: (open: boolean) => void;
  className?: string;
  icon?: ComponentType<{ className?: string }>;
  iconColor?: "blue" | "green" | "red" | "yellow" | "purple";
  title?: ReactNode;
  description?: ReactNode;
}>;

const iconColorClasses = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  yellow: "bg-yellow-100 text-yellow-600",
  purple: "bg-purple-100 text-purple-600",
};

export function Modal({
  open,
  setOpen,
  className,
  icon: Icon,
  iconColor = "blue",
  title,
  description,
  children,
}: ModalProps) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 min-h-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={twMerge(
                  "relative w-full max-w-sm transform rounded-lg bg-white p-6 text-left shadow-xl transition-all",
                  className
                )}
              >
                {Icon && (
                  <div
                    className={twMerge(
                      "mx-auto flex h-12 w-12 items-center justify-center rounded-full",
                      iconColorClasses[iconColor]
                    )}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                )}

                {title && (
                  <Dialog.Title as="h3" className="text-center text-lg font-medium text-gray-900">
                    {title}
                  </Dialog.Title>
                )}

                {description && (
                  <Dialog.Description className="text-center text-sm text-gray-500">
                    {description}
                  </Dialog.Description>
                )}

                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
