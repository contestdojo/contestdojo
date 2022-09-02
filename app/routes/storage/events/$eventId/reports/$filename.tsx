/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LoaderFunction } from "@remix-run/node";

import { Readable } from "stream";

import { storage } from "~/utils/firebase.server";

export const loader: LoaderFunction = async ({ params }) => {
  if (!params.eventId) throw new Response("Event ID must be provided.", { status: 400 });
  if (!params.filename) throw new Response("Filename must be provided.", { status: 400 });

  const file = storage.file(`events/${params.eventId}/reports/${params.filename}`);

  const [exists] = await file.exists();
  if (!exists) {
    throw new Response("File not found.", { status: 404 });
  }

  // TODO: Permission checking

  return new Response(Readable.toWeb(file.createReadStream()));
};
