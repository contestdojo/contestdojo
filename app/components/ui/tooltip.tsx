/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { PropsWithAs } from "~/lib/utils/props-with-as";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";

export { Provider } from "@radix-ui/react-tooltip";

type TooltipProps = {
  label: string;
  side?: "top" | "right" | "bottom" | "left";
};

export default function Tooltip<T extends React.ElementType = "div">({
  as,
  label,
  side = "bottom",
  ...props
}: PropsWithAs<TooltipProps, T>) {
  const As = as ?? "div";

  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        <As {...props} />
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content asChild side={side} align="center">
        <div className="TooltipContent rounded bg-gray-700 px-2 py-1 text-sm text-white drop-shadow-md">
          {label}
          <TooltipPrimitive.Arrow className="fill-gray-700" width={11} height={5} />
        </div>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
}
