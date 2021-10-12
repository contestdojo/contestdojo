/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, BoxProps, forwardRef } from "@chakra-ui/react";

type CardProps = BoxProps;

const Card = forwardRef(({ children, ...props }: BoxProps, ref) => (
  <Box borderWidth={1} borderRadius="md" backgroundColor="white" ref={ref} {...props}>
    {children}
  </Box>
));

export default Card;
