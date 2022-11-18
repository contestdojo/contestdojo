/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

export function makePartial<T>(obj: T | undefined): Partial<T> {
  return obj ?? {};
}

export function mapEntries<T, U>(obj: Record<string, T>, func: (entry: [string, T]) => [string, U]): Record<string, U> {
  return Object.fromEntries(Object.entries(obj).map(func));
}

export function mapKeys<T>(obj: Record<string, T>, func: (key: string) => string): Record<string, T> {
  return mapEntries(obj, ([key, val]) => [func(key), val]);
}

export function mapValues<T, U>(obj: Record<string, T>, func: (val: T) => U): Record<string, U> {
  return mapEntries(obj, ([key, val]) => [key, func(val)]);
}

export function filterEntries<T>(obj: Record<string, T>, func: (entry: [string, T]) => unknown): Record<string, T> {
  return Object.fromEntries(Object.entries(obj).filter(func));
}

export function filterKeys<T>(obj: Record<string, T>, func: (key: string) => unknown): Record<string, T> {
  return filterEntries(obj, ([key, val]) => func(key));
}

export function filterValues<T>(obj: Record<string, T>, func: (val: T) => unknown): Record<string, T> {
  return filterEntries(obj, ([key, val]) => func(val));
}

export type NestedPaths<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: K | `${K}.${NestedPaths<T[K]>}`;
    }[Extract<keyof T, string>]
  : never;

export function getNestedPath<T>(obj: T, path: NestedPaths<T>) {
  return path.split(".").reduce((acc: any, curr) => acc && acc[curr], obj);
}
