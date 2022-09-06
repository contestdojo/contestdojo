/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";
import type { Entity } from "~/utils/db.server";

import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { requireAdmin } from "~/utils/auth.server";
import db from "~/utils/db.server";

type LoaderData = {
  entities: Entity[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireAdmin(request);
  const entitiesSnap = await db.entities.where("admins", "array-contains", db.user(user.uid)).get();
  const entities = entitiesSnap.docs.map((x) => x.data());
  return json<LoaderData>({ entities });
};

export default function IndexRoute() {
  const loaderData = useLoaderData<LoaderData>();

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {loaderData.entities.map((x) => (
          <li
            key={x.id}
            className="rounded-lg border border-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:border-gray-400"
          >
            <Link to={x.id} className="flex flex-col gap-1 p-4 focus:outline-none">
              <h2 className="text-lg font-medium text-gray-900">{x.name}</h2>
              <h3 className="text-sm text-gray-400">{x.id}</h3>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const handle = {
  navigationHeading: "Entities",
};
