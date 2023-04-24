/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Center,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Link,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Suspense, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useAuth, useFirestore } from "reactfire";
import * as yup from "yup";

import RadioToggle from "../components/RadioToggle";

import FormField from "~/components/FormField";
import { delay } from "~/helpers/utils";

const schema = yup.object({
  type: yup.string().typeError("Account Type is required").oneOf(["coach", "student"]).required().label("Account Type"),
  fname: yup.string().required().label("First Name").trim(),
  lname: yup.string().required().label("Last Name").trim(),
  email: yup.string().email().required().label("Email Address"),
  password: yup
    .string()
    .required()
    .matches(
      /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
      "Password must contain at least 8 characters, one uppercase, one number and one special case character"
    )
    .label("Password"),
  passwordConfirm: yup
    .string()
    .equals([yup.ref("password")], "Passwords must match")
    .label("Confirm Password"),
});

const RegistrationForm = ({ onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    control,
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

        <FormControl id="type" isInvalid={errors.type} isRequired>
          <FormLabel>Account Type</FormLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => <RadioToggle options={["coach", "student"]} {...field} inputRef={field.ref} />}
          />
          <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
        </FormControl>

        <FormField {...register("fname")} label="First Name" placeholder="Blaise" error={errors.fname} isRequired />

        <FormField {...register("lname")} label="Last Name" placeholder="Pascal" error={errors.lname} isRequired />

        <FormField
          type="email"
          {...register("email")}
          label="Email Address"
          placeholder="blaise.pascal@gmail.com"
          error={errors.email}
          isRequired
        />

        <FormField
          type="password"
          {...register("password")}
          label="Create Password"
          placeholder="Enter secure password..."
          error={errors.password}
          isRequired
        />

        <FormField
          type="password"
          {...register("passwordConfirm")}
          label="Confirm Password"
          placeholder="Re-enter password..."
          error={errors.passwordConfirm}
          isRequired
        />

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          Register
        </Button>
      </Stack>
    </form>
  );
};

const RegisterPage = () => {
  const auth = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const firestore = useFirestore();

  const handleSubmit = async ({ type, fname, lname, email, password }) => {
    setLoading(true);
    await delay(300);

    try {
      const { user } = await auth.createUserWithEmailAndPassword(email, password);
      await user.updateProfile({ displayName: `${fname} ${lname}` });
      await firestore.collection("users").doc(user.uid).set({
        fname,
        lname,
        email,
        type,
      });
    } catch (err) {
      setError(err);
    }

    setLoading(false);
  };

  return (
    <Stack spacing={6} m={6} flexShrink={1} flexBasis={400}>
      <Heading textAlign="center">Create Account</Heading>
      <RegistrationForm onSubmit={handleSubmit} error={error} isLoading={loading} />
      <p>
        Already have an account?{" "}
        <NextLink href="/login" passHref>
          <Link color="blue.500">Login here</Link>
        </NextLink>
      </p>
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
    return <RegisterPage />;
  } else {
    return <Spinner />;
  }
};

const Register = () => (
  <Center minH="100vh">
    <Suspense fallback={<Spinner />}>
      <Wrapper />
    </Suspense>
  </Center>
);

export default Register;
