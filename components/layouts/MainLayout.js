/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  IconButton,
  Spacer,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { useEffect } from "react";
import { HiMenu } from "react-icons/hi";
import { StickyContainer } from "react-sticky";
import { useAuth, useUser } from "reactfire";

import { useDialog } from "~/components/contexts/DialogProvider";
import { useFormState } from "~/helpers/utils";

const SidebarContent = ({ sidebar, pt }) => {
  const auth = useAuth();

  return (
    <Stack height="100%" spacing={0} divider={<Divider />}>
      <Box padding={6} mx="auto" pt={pt}>
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
        &copy; 2025 Oliver Ni
      </Text>
    </Stack>
  );
};

const Navigation = ({ sidebar, onOpen }) => {
  return (
    <>
      <IconButton
        icon={<HiMenu />}
        onClick={onOpen}
        position="fixed"
        top={4}
        left={4}
        zIndex={1}
        display={{ base: "flex", lg: "none" }}
        aria-label="Open menu"
      />

      <Stack overflow="scroll" flexBasis={300} shadow="md" spacing={0} display={{ base: "none", lg: "flex" }}>
        <SidebarContent sidebar={sidebar} />
      </Stack>
    </>
  );
};

const MainLayout = ({ sidebar, children }) => {
  const [openDialog] = useDialog();
  const { data: user } = useUser();
  const [{ isLoading, error }, wrapAction] = useFormState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const auth = useAuth();

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
        <Navigation sidebar={sidebar} onOpen={onOpen} />

        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerBody p={0}>
              <SidebarContent sidebar={sidebar} pt={12} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box as={StickyContainer} flex={1} padding={12} overflow="scroll">
          {children}
        </Box>
      </Flex>
    </Stack>
  );
};

export default MainLayout;
