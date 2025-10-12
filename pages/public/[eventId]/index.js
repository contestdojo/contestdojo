/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Button, Center, Divider, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import NextLink from "next/link";

import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import EmptyLayout from "~/components/layouts/EmptyLayout";
import Markdown from "~/components/Markdown";

const EventPreviewContent = () => {
  const { data: event } = useEvent();
  const router = useRouter();
  const { eventId } = router.query;

  return (
    <Center minH="100vh" p={8}>
      <Stack spacing={6} maxW={600} w="full">
        <Heading size="2xl" textAlign="center">
          {event.name}
        </Heading>

        {event.description && (
          <>
            <Box>
              <Markdown>{event.description}</Markdown>
            </Box>
            <Divider />
          </>
        )}

        <HStack spacing={4} align="center">
          <Box width={150}>
            <Image src="/logo.svg" width={150} height={150} alt="ContestDojo" />
          </Box>

          <Text textAlign="left" color="gray.600">
            ContestDojo is an online math competition platform used by events such as the Stanford Math Tournament and
            the Berkeley Math Tournament.
          </Text>
        </HStack>

        <Divider />

        <Stack spacing={4} textAlign="center">
          <Text fontSize="lg">To register for this event, please login or create an account.</Text>

          <Stack direction={{ base: "column", sm: "row" }} spacing={4} justifyContent="center">
            <NextLink href={`/login?next=/public/${eventId}`} passHref>
              <Button as="a" colorScheme="blue" size="lg">
                Login
              </Button>
            </NextLink>

            <NextLink href={`/register?next=/public/${eventId}`} passHref>
              <Button as="a" colorScheme="green" size="lg">
                Sign Up
              </Button>
            </NextLink>
          </Stack>
        </Stack>
      </Stack>
    </Center>
  );
};

const EventPreview = () => (
  <EventProvider>
    <EventPreviewContent />
  </EventProvider>
);

EventPreview.layout = EmptyLayout;

export default EventPreview;
