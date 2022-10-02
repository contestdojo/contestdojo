/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithChildren } from "react";

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import clsx from "clsx";

export enum Status {
  Success,
  Warning,
  Error,
  Info,
}

type AlertProps = PropsWithChildren<{
  className?: string;
  status: Status;
  title: string;
}>;

const ICON_COMPONENTS = {
  [Status.Success]: CheckCircleIcon,
  [Status.Warning]: ExclamationCircleIcon,
  [Status.Error]: XCircleIcon,
  [Status.Info]: InformationCircleIcon,
};

const WRAPPER_CLASSES = {
  [Status.Success]: "bg-green-50",
  [Status.Warning]: "bg-yellow-50",
  [Status.Error]: "bg-red-50",
  [Status.Info]: "bg-blue-50",
};

const ICON_CLASSES = {
  [Status.Success]: "text-green-400",
  [Status.Warning]: "text-yellow-400",
  [Status.Error]: "text-red-400",
  [Status.Info]: "text-blue-400",
};

const TITLE_CLASSES = {
  [Status.Success]: "text-green-800",
  [Status.Warning]: "text-yellow-800",
  [Status.Error]: "text-red-800",
  [Status.Info]: "text-blue-800",
};

const DESCRIPTION_CLASSES = {
  [Status.Success]: "text-green-700",
  [Status.Warning]: "text-yellow-700",
  [Status.Error]: "text-red-700",
  [Status.Info]: "text-blue-700",
};

export default function Alert({ className, status, title, children }: AlertProps) {
  const Icon = ICON_COMPONENTS[status];

  return (
    <div className={clsx`rounded-md p-4 ${WRAPPER_CLASSES[status]} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={clsx`h-5 w-5 ${ICON_CLASSES[status]}`} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className={clsx`text-sm font-medium ${TITLE_CLASSES[status]}`}>{title}</h3>
          <div className={clsx`mt-2 text-sm text-yellow-700 ${DESCRIPTION_CLASSES[status]}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
