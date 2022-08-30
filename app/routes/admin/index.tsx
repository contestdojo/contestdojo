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
      <ul>
        {loaderData.entities.map((x) => (
          <li key={x.id}>
            <Link to={x.id}>{x.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const handle = {
  navigationHeading: "Entities",
};
