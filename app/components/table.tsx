/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import clsx from "clsx";

export function Table({ className, ...props }: JSX.IntrinsicElements["table"]) {
  return <table className={clsx`min-w-full divide-y divide-gray-300 ${className}`} {...props} />;
}

export function Thead({ className, ...props }: JSX.IntrinsicElements["thead"]) {
  return <thead className={clsx`divide-y divide-gray-200 bg-gray-50 ${className}`} {...props} />;
}

export function Tbody({ className, ...props }: JSX.IntrinsicElements["tbody"]) {
  return <tbody className={clsx`divide-y divide-gray-200 bg-white ${className}`} {...props} />;
}

export function Tr({ className, ...props }: JSX.IntrinsicElements["tr"]) {
  return <tr className={clsx`divide-x divide-gray-200 ${className}`} {...props} />;
}

export function Th({ className, ...props }: JSX.IntrinsicElements["th"]) {
  return (
    <th
      className={clsx`whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900 ${className}`}
      {...props}
    />
  );
}

export function Td({ className, ...props }: JSX.IntrinsicElements["td"]) {
  return (
    <td
      className={clsx`whitespace-nowrap px-4 py-2 text-sm text-gray-500 ${className}`}
      {...props}
    />
  );
}
