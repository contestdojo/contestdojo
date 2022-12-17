/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import * as build from "@remix-run/dev/server-build";
import { createRequestHandler } from "@remix-run/vercel";

export default createRequestHandler({ build, mode: process.env.NODE_ENV });