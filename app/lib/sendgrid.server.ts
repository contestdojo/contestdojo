/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import sendgrid from "@sendgrid/mail";

import { env } from "./env.server";

sendgrid.setApiKey(env.SENDGRID_KEY);

export default sendgrid;
