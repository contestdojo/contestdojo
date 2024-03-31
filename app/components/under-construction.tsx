/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { WrenchScrewdriverIcon } from "@heroicons/react/24/solid";
import { useLocation } from "@remix-run/react";

export default function UnderConstruction() {
  const location = useLocation();
  const oldUrl = new URL(location.pathname, "https://contestdojo.com");
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4">
      <WrenchScrewdriverIcon className="h-12 w-12 text-gray-500" />
      <div className="flex flex-col items-center gap-1">
        <p className="text-lg text-gray-500">This site is currently under construction.</p>
        <p className="text-lg text-gray-500">
          Visit this page on the{" "}
          <a className="text-blue-500 hover:underline" href={oldUrl.toString()}>
            current website?
          </a>
        </p>
      </div>
    </div>
  );
}
