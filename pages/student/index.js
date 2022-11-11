/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Box, Button, Divider, Heading, HStack, Stack, Tooltip } from "@chakra-ui/react";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useFirestore, useFirestoreCollectionData } from "reactfire";

import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useUserData } from "~/helpers/utils";

const EventCard = ({ id, name, studentRegistrationEnabled, date: { seconds } }) => {
  const router = useRouter();
  const date = dayjs.unix(seconds);
  return (
    <Card as={HStack} p={4} maxWidth="sm">
      <Box flex={1}>
        <Box as="h4" fontWeight="semibold" isTruncated>
          {name}
        </Box>
        <Box as="h5" color="gray.500">
          {date.format("MMMM D, YYYY")}
        </Box>
      </Box>
      {studentRegistrationEnabled ? (
        <ButtonLink href={`/student/${id}`} mt={2} colorScheme="blue" size="sm">
          Register
        </ButtonLink>
      ) : (
        <Tooltip label="Please have your school's math coach register you for this event." shouldWrapChildren>
          <Button mt={2} colorScheme="blue" size="sm" isDisabled>
            Coach Only
          </Button>
        </Tooltip>
      )}
    </Card>
  );
};
const Home = () => {
  const firestore = useFirestore();
  const { data: user } = useUserData();

  // Get events
  const eventsRef = firestore.collection("events");
  let { data: events } = useFirestoreCollectionData(eventsRef, { idField: "id" });

  events = events.filter((x) => !x.hide);

  return (
    <Stack spacing={6} maxW={600} mx="auto">
      <Heading size="2xl">
        {user.fname} {user.lname}
      </Heading>
      <Divider />

      <Heading size="lg">Event Registration</Heading>
      {events.map((x) => (
        <EventCard key={x.id} {...x} />
      ))}
      {events.length == 0 && <p>No events to register for at this time.</p>}
    </Stack>
  );
};

export default Home;
