/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Divider,
  Heading,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import firebase from "firebase";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Suspense, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "reactfire";
import * as yup from "yup";

import logo from "~/assets/logo.png";
import bmt from "~/assets/logos/bmt.png";
import mmt from "~/assets/logos/mmt.png";
import smt from "~/assets/logos/smt.png";
import { useDialog } from "~/components/contexts/DialogProvider";
import FormField from "~/components/FormField";
import { delay, useFormState } from "~/helpers/utils";

const loginSchema = yup.object({
  email: yup.string().email().required().label("Email Address"),
  password: yup.string().required().label("Password"),
});

const resetPasswordSchema = yup.object({
  email: yup.string().required().email().label("Email"),
});

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const { register, handleSubmit, errors } = useForm({
    mode: "onTouched",
    resolver: yupResolver(loginSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        )}

        <FormField
          ref={register}
          type="email"
          name="email"
          label="Email Address"
          placeholder="blaise.pascal@gmail.com"
          error={errors.email}
          isRequired
        />

        <FormField
          ref={register}
          type="password"
          name="password"
          label="Password"
          placeholder="Enter password..."
          error={errors.password}
          isRequired
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          Login
        </Button>
      </Stack>
    </form>
  );
};

const ResetPasswordModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, errors } = useForm({
    mode: "onTouched",
    resolver: yupResolver(resetPasswordSchema),
  });

  const initialRef = useRef();
  const [{ isLoading, error }, wrapAction] = useFormState();
  const [openDialog] = useDialog();

  const auth = useAuth();

  const handleResetPassword = wrapAction(async ({ email }) => {
    await auth.sendPasswordResetEmail(email);
    onClose();
    openDialog({
      type: "alert",
      title: "Sent",
      description: "A password reset email has been sent.",
    });
  });

  return (
    <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Reset Password</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id="reset-pwd-form" onSubmit={handleSubmit(handleResetPassword)}>
            {error && (
              <Alert status="error">
                <AlertIcon />
                {error.message}
              </Alert>
            )}

            <FormField
              ref={(ref) => {
                initialRef.current = ref;
                register(ref);
              }}
              name="email"
              label="Email Address"
              placeholder="blaise.pascal@gmail.com"
              error={errors.email}
              isRequired
            />
          </form>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} type="submit" form="reset-pwd-form" isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const LOGOS = [bmt, smt, mmt];

const Logos = () => {
  return (
    <Stack direction="row" alignItems="center">
      {LOGOS.map((x) => (
        <Box flex={1} key={x.src} position="relative">
          <Image src={x} alt="" className="login-contest-logo" />
        </Box>
      ))}
    </Stack>
  );
};

const LoginSection = () => {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleSubmit = async ({ email, password }) => {
    setLoading(true);
    await delay(300);
    try {
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      setError(err);
    }
    setLoading(false);
  };

  return (
    <Stack flex={1} spacing={10} maxW={400}>
      <Box>
        <Image alt="" src={logo} layout="responsive" />
      </Box>

      <Stack spacing={6}>
        <LoginForm onSubmit={handleSubmit} error={error} isLoading={loading} />

        <Stack spacing={4}>
          <Text>
            Don&apos;t have an account?{" "}
            <NextLink href="/register" passHref>
              <Link color="blue.500">Register here</Link>
            </NextLink>
          </Text>

          <Link color="red.500" onClick={onOpen}>
            Forgot Password
          </Link>
        </Stack>
      </Stack>

      <Logos />

      <ResetPasswordModal isOpen={isOpen} onClose={onClose} />
    </Stack>
  );
};

const Instructions = () => (
  <Stack spacing={4} flex={1} maxW={400}>
    <Heading size="lg">Welcome to ContestDojo!</Heading>
    <Text>
      ContestDojo is an online math competition platform used by events such as the Stanford Math Tournament and the
      Berkeley Math Tournament.
    </Text>

    <Heading size="md">Coaches &amp; Parents</Heading>
    <Text>
      If you are a coach, please sign in with an existing coach account, or create a new coach account using the link
      below. Once you sign in, you can register for contests.
    </Text>
    <NextLink href="/register" passHref>
      <Link color="blue.500">Create a coach account</Link>
    </NextLink>

    <Heading size="md">Students</Heading>
    <Text>
      If you are a participant, please ask your math club/team coach to register you for contests. Once registered, you
      will receive an email with your login credentials.
    </Text>
    <Text>
      Some events allow students to register independently. For those contests, please sign in with an existing student
      account, or create a new student account using the link below.
    </Text>
    <NextLink href="/register" passHref>
      <Link color="blue.500">Create a student account</Link>
    </NextLink>
  </Stack>
);

const LoginPage = () => {
  return (
    <>
      <Stack
        m={8}
        flex={1}
        direction={{ base: "column", md: "row" }}
        spacing={12}
        justifyContent="center"
        alignItems="center"
        divider={
          <Divider
            orientation={{ base: "horizontal", md: "vertical" }}
            h={{ md: "60vh" }}
            w={{ base: "80vw", md: "inherit" }}
          />
        }
      >
        <LoginSection />
        <Instructions />
      </Stack>
    </>
  );
};

const Wrapper = () => {
  const auth = useAuth();
  const router = useRouter();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        router.replace("/");
      } else {
        setReady(true);
      }
    });
  }, []);

  if (ready) {
    return <LoginPage />;
  } else {
    return <Spinner />;
  }
};

const Login = () => (
  <Center minH="100vh">
    <Suspense fallback={<Spinner />}>
      <Wrapper />
    </Suspense>
  </Center>
);

export default Login;
