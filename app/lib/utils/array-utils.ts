/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function* intersperse<T, I>(arr: T[], delim: I) {
  for (let i = 0; i < arr.length; i++) {
    if (i > 0) yield delim;
    yield arr[i];
  }
}

export function* chunk<T>(arr: T[], chunk_size: number) {
  for (let i = 0; i < arr.length; i += chunk_size) {
    yield arr.slice(i, i + chunk_size);
  }
}

export function isNotEmpty<T>(arr: T[]): arr is [T, ...T[]] {
  return arr.length > 0;
}

export function mapToObject<T, U>(arr: T[], func: (entry: T) => [string, U]) {
  return Object.fromEntries(arr.map(func));
}
