/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { Divider, Heading, HStack, IconButton, Stack, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { HiDownload } from "react-icons/hi";
import { useFirestore, useFirestoreCollectionData, useStorage, useStorageDownloadURL } from "reactfire";

import Card from "~/components/Card";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import OrgProvider, { useOrg } from "~/components/contexts/OrgProvider";

const DownloadReport = ({ scoreReport }) => {
  const storage = useStorage();
  const { data: scoreReportURL } = useStorageDownloadURL(storage.ref().child(scoreReport));
  return (
    <IconButton
      icon={<HiDownload />}
      variant="ghost"
      rounded="full"
      onClick={() => window.open(scoreReportURL, "_blank")}
      alignSelf="flex-start"
    >
      Download Score Report
    </IconButton>
  );
};

const ReportCard = ({ number, name, scoreReport }) => (
  <Card as={HStack} spacing={4} py={2} pl={4} pr={2} minW="md">
    {number && <Text color="gray.500">{number}</Text>}
    <Heading as="h4" size="md" position="relative" flex="1">
      {name}
    </Heading>
    <DownloadReport scoreReport={scoreReport} />
  </Card>
);

const Reports = () => {
  // Functions
  const firestore = useFirestore();

  // Data
  const { ref: orgRef, data: org } = useOrg();
  const { ref: eventRef, data: event } = useEvent();

  // Get teams
  const teamsRef = eventRef.collection("teams");
  const { data: teams } = useFirestoreCollectionData(teamsRef.where("org", "==", orgRef), { idField: "id" });

  return (
    <Stack spacing={6} flex={1}>
      <HStack alignItems="flex-end" spacing={6}>
        <Heading size="2xl">{event.name}</Heading>
        <Heading size="lg">{org.name}</Heading>
      </HStack>
      <Divider />
      <Stack spacing={4}>
        <Heading size="lg">Score Reports</Heading>
        <p>Available score reports for your organization&quot;s teams are listed below.</p>
        <Wrap>
          {teams
            .filter((x) => x.scoreReport)
            .map((x) => (
              <WrapItem key={x.id}>
                <ReportCard {...x} />
              </WrapItem>
            ))}
        </Wrap>
      </Stack>
    </Stack>
  );
};

const ReportsPage = () => (
  <OrgProvider>
    <EventProvider>
      <Reports />
    </EventProvider>
  </OrgProvider>
);

export default ReportsPage;
