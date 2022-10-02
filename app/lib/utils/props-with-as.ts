/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export type PropsWithAs<P, T extends React.ElementType> = P &
  Omit<React.ComponentPropsWithoutRef<T>, "as" | keyof P> & {
    as?: T;
  };

export type PropsWithAsAndRef<P, T extends React.ElementType> = P &
  Omit<React.ComponentPropsWithRef<T>, "as" | keyof P> & {
    as?: T;
  };
