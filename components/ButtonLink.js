/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button } from "@chakra-ui/react";
import NextLink from "next/link";

const ButtonLink = ({ href, children, ...props }) => (
  <NextLink href={href} passHref>
    <Button as="a" {...props}>
      {children}
    </Button>
  </NextLink>
);

export default ButtonLink;
