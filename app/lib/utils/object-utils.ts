/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function makePartial<T>(obj: T | undefined): Partial<T> {
  return obj ?? {};
}

export function mapToArray<T, U>(obj: Record<string, T>, func: (key: string, val: T) => U): U[] {
  return Object.entries(obj).map(([key, val]) => func(key, val));
}

export function mapEntries<T, U>(
  obj: Record<string, T>,
  func: (key: string, val: T) => [string, U]
): Record<string, U> {
  return Object.fromEntries(mapToArray(obj, func));
}

export function mapKeys<T>(
  obj: Record<string, T>,
  func: (key: string) => string
): Record<string, T> {
  return mapEntries(obj, (key, val) => [func(key), val]);
}

export function mapValues<T, U>(obj: Record<string, T>, func: (val: T) => U): Record<string, U> {
  return mapEntries(obj, (key, val) => [key, func(val)]);
}

export function filterEntries<T>(
  obj: Record<string, T>,
  func: (key: string, val: T) => unknown
): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).filter(([key, val]) => func(key, val)));
}

export function filterKeys<T>(
  obj: Record<string, T>,
  func: (key: string) => unknown
): Record<string, T> {
  return filterEntries(obj, (key, _) => func(key));
}

export function filterValues<T>(
  obj: Record<string, T>,
  func: (val: T) => unknown
): Record<string, T> {
  return filterEntries(obj, (_, val) => func(val));
}

export function getNestedPath<T>(obj: T, path: string) {
  return path.split(".").reduce((acc: any, curr) => acc && acc[curr], obj);
}
