/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertIcon, Button, Center, Spinner, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth, useFirestore } from "reactfire";
import * as yup from "yup";

import FormField from "~/components/FormField";
import { delay } from "~/helpers/utils";

const schema = yup.object({
  token: yup.string().required().label("Token"),
});

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
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

        <FormField {...register("token")} label="Token" error={errors.token} isRequired />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          Login
        </Button>
      </Stack>
    </form>
  );
};

const LoginPage = () => {
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const firestore = useFirestore();

  const handleSubmit = async ({ token }) => {
    setLoading(true);
    await delay(300);

    try {
      await auth.signInWithCustomToken(token);
    } catch (err) {
      setError(err);
    }

    setLoading(false);
  };

  return (
    <Stack spacing={6} m={6} flexShrink={1} flexBasis={400}>
      <LoginForm onSubmit={handleSubmit} error={error} isLoading={loading} />
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
        router.replace(router.query.next ?? "/");
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
