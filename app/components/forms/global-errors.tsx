/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import Alert, { Status } from "~/components/alert";

export default function GlobalErrors({ className, ...props }: JSX.IntrinsicElements["div"]) {
  return <Alert className={className} status={Status.Error} title="Error" {...props} />;
}
