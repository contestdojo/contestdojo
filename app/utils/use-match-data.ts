/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { useMatches } from "@remix-run/react";

export default function useMatchData<T>(routeId: string) {
  return useMatches().find((x) => x.id === routeId)?.data as T | undefined;
}
