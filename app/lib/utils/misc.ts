/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMemo } from "react";

export function reduceToMap<T extends { id: string }>(data: T[]) {
  return data.reduce(
    (acc, curr) => acc.set(curr.id, { ...acc.get(curr.id), ...curr }),
    new Map<string, T>()
  );
}

export function isObject(x: any): x is object {
  return x && typeof x === "object";
}

export function useSumColumn<Data>(
  data: Data[],
  accessor: (x: Data) => number | undefined
): number {
  return useMemo(() => data.map((x) => accessor(x) ?? 0).reduce((a, b) => a + b), [data]);
}
