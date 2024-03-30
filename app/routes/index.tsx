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
  let user = await requireSession(request);
  console.log(user);
  if (user.type === "admin") return redirect("/admin");
  if (user.type === "coach") return redirect("/coach");
  return new Error("Invalid user type");
};

export default function IndexRoute() {
  return null;
}
