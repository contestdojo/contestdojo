/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Divider, Heading, Stack } from "@chakra-ui/react";

import StudentLayout from "./StudentLayout";

import EventProvider, { useEvent } from "~/components/contexts/EventProvider";

const StudentEventLayoutContent = ({ children, maxW = 600, ...props }) => {
  const { data: event } = useEvent();

  return (
    <Stack flex={1} spacing={6} maxW={maxW} mx="auto" {...props}>
      <Heading>{event.name}</Heading>
      <Divider />
      {children}
    </Stack>
  );
};

const StudentEventLayout = ({ children, ...props }) => (
  <StudentLayout>
    <EventProvider>
      <StudentEventLayoutContent {...props}>{children}</StudentEventLayoutContent>
    </EventProvider>
  </StudentLayout>
);

export default StudentEventLayout;
