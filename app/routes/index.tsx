/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";

import { requireSession } from "~/lib/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireSession(request);
  return redirect("/admin");
};
