/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";

import { logout } from "~/lib/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return logout();
};

export const loader: LoaderFunction = async () => {
  return redirect("/");
};
