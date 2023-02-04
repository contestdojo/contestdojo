/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Box, Button, Divider, Flex, Spacer, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { useEffect } from "react";
import { StickyContainer } from "react-sticky";
import { useAuth, useUser } from "reactfire";

import { useDialog } from "~/components/contexts/DialogProvider";
import { useFormState } from "~/helpers/utils";

const Navigation = ({ sidebar }) => {
  const auth = useAuth();

  return (
    <Stack overflow="scroll" flexBasis={300} shadow="md" spacing={0} divider={<Divider />}>
      <Box padding={6} mx="auto">
        <NextLink href="/">
          <a>
            <Image src="/logo.svg" width={100} height={100} alt="ContestDojo" />
          </a>
        </NextLink>
      </Box>

      <Stack spacing={6} p={8} flex={1}>
        {sidebar}
        <Spacer />
        <Button onClick={() => auth.signOut()}>Sign Out</Button>
      </Stack>

      <Text py={2} align="center" color="gray.500" fontSize="sm">
        &copy; 2021 Oliver Ni
      </Text>
    </Stack>
  );
};

const MainLayout = ({ sidebar, children }) => {
  const [openDialog] = useDialog();
  const { data: user } = useUser();
  const [{ isLoading, error }, wrapAction] = useFormState();

  const handleResend = wrapAction(async () => {
    await user.sendEmailVerification({ url: window.location.href });
    openDialog({
      type: "alert",
      title: "Verification Link Sent",
      description: `An email verification link has been sent to ${user.email}.`,
    });
  });

  useEffect(() => {
    if (error) openDialog({ type: "alert", title: "Error", description: error.message });
  }, [error]);

  return (
    <Stack height="100vh" spacing={0}>
      {!user.emailVerified && (
        <Box p={4} textAlign="center" bg="blue.700" color="white">
          <strong>Your email is not verified.</strong> You must verify your email before registering for events.{" "}
          <Button variant="link" color="gray.400" onClick={handleResend} isLoading={isLoading}>
            Send Verification Email
          </Button>
        </Box>
      )}

      <Flex flex={1} overflow="auto">
        <Navigation sidebar={sidebar} />
        <Box as={StickyContainer} flex={1} padding={12} overflow="scroll">
          {children}
        </Box>
      </Flex>
    </Stack>
  );
};

export default MainLayout;
