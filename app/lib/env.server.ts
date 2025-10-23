/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { cleanEnv, json, str } from "envalid";

export const env = cleanEnv(process.env, {
  SESSION_SECRET: str(),
  FIREBASE_SERVICE_ACCOUNT: json(),
  NODE_ENV: str({ choices: ["development", "production"] }),
  SENDGRID_KEY: str(),
  RESEND_API_KEY: str(),
});
