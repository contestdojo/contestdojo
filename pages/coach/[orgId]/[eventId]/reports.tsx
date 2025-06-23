/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { Divider, Heading, HStack, IconButton, Stack, Text, Wrap, WrapItem } from "@chakra-ui/react";
import { HiDownload } from "react-icons/hi";
import { useFirestore, useFirestoreCollectionData, useStorage, useStorageDownloadURL } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
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
  <Card as={HStack} spacing={4} py={0} pl={2} pr={2} minW="xs">
    {number && <Text color="gray.500">{number}</Text>}
    <Heading as="h4" size="sm" position="relative" flex="1">
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

  // Get students
  const studentsRef = eventRef.collection("students");
  const { data: students } = useFirestoreCollectionData(studentsRef.where("org", "==", orgRef), { idField: "id" });

  // Collapse into dict
  const studentsByTeam = {};
  for (const student of students) {
    const key = student.team?.id ?? null;
    if (!studentsByTeam.hasOwnProperty(key)) studentsByTeam[key] = [];
    studentsByTeam[key].push(student);
  }

  return (
    <Stack spacing={6} flex={1}>
      <HStack alignItems="flex-end" spacing={6}>
        <Heading size="2xl">{event.name}</Heading>
        <Heading size="lg">{org.name}</Heading>
      </HStack>

      <Divider />

      <Stack spacing={4}>
        <Heading size="lg">Score Reports</Heading>
        <p>Available score reports for your organization&apos;s teams are listed below.</p>
      </Stack>

      {teams.map((x) => (
        <Stack spacing={4} key={x.id}>
          <HStack>
            {x.number && <Text color="gray.500">{x.number}</Text>}
            <Heading size="md">{x.name}</Heading>
          </HStack>
          {x.scoreReport || studentsByTeam[x.id]?.some((s) => s.scoreReport) ? (
            <Wrap>
              {x.scoreReport && (
                <WrapItem>
                  <ReportCard number={x.number} name="Team Score Report" scoreReport={x.scoreReport} />
                </WrapItem>
              )}
              {studentsByTeam[x.id]
                .filter((x) => x.scoreReport)
                .map((s) => (
                  <WrapItem key={s.id}>
                    <ReportCard number={s.number} name={`${s.fname} ${s.lname}`} scoreReport={s.scoreReport} />
                  </WrapItem>
                ))}
            </Wrap>
          ) : (
            <Text>No reports available.</Text>
          )}
        </Stack>
      ))}

      <ButtonLink href={`/coach/${orgRef.id}/${eventRef.id}`} colorScheme="blue" alignSelf="flex-start">
        Back to {event.name}
      </ButtonLink>
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
