/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Center } from "@chakra-ui/react";

const EmptyLayout = ({ children }) => (
  <Center minH="100vh" p={8}>
    {children}
  </Center>
);

export default EmptyLayout;
