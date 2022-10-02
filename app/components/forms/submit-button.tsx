/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Button from "~/components/button";

export default function SubmitButton({ className, ...props }: JSX.IntrinsicElements["button"]) {
  return (
    <div className="flex justify-end">
      <Button {...props} />
    </div>
  );
}
