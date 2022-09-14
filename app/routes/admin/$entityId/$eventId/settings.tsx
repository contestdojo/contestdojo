/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Box from "~/components/box";

function Registration() {
  return (
    <Box className="p-4">
      <h2 className="text-lg font-medium text-gray-900">Registration</h2>
    </Box>
  );
}

export default function SettingsRoute() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Registration />
    </div>
  );
}

export const handle = {
  navigationHeading: "Settings",
};
