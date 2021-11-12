/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Center,
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
  useDisclosure,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import firebase from "firebase";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Suspense, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "reactfire";
import * as yup from "yup";

import { useDialog } from "~/components/contexts/DialogProvider";
import FormField from "~/components/FormField";
import IntroDialog from "~/components/IntroDialog";
import { delay, useFormState, useLocalStorage } from "~/helpers/utils";

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

const LoginPage = () => {
  const auth = useAuth();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useLocalStorage("show-intro-dialog", true);

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
    <Stack spacing={6} m={6} flexShrink={1} flexBasis={400}>
      <Heading textAlign="center">Login</Heading>
      <LoginForm onSubmit={handleSubmit} error={error} isLoading={loading} />
      <Stack spacing={4}>
        <p>
          New coach?{" "}
          <NextLink href="/register" passHref>
            <Link color="blue.500">Register here</Link>
          </NextLink>
        </p>
        <Link color="red.500" onClick={onOpen}>
          Forgot Password
        </Link>
      </Stack>
      <ResetPasswordModal isOpen={isOpen} onClose={onClose} />
      <IntroDialog isOpen={showDialog} onClose={() => setShowDialog(false)} />
    </Stack>
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
