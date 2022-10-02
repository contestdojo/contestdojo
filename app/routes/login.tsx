/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction } from "@remix-run/node";
import type { Validator } from "remix-validated-form";

import { redirect } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import React from "react";
import { ValidatedForm, validationError } from "remix-validated-form";
import { z } from "zod";

import Button from "~/components/button";
import FormControl from "~/components/forms/form-control";
import { loginWithIdToken } from "~/lib/auth.server";
import { auth as clientAuth } from "~/lib/firebase.client";

const LoginValidator = withZod(
  z.object({
    idToken: z.string(),
  })
);

const LoginFormValidator = withZod(
  z.object({
    email: z.string().min(1, "Required").email(),
    password: z.string().min(1, "Required"),
  })
);

type LoginFormData = typeof LoginFormValidator extends Validator<infer T> ? T : never;

export const action: ActionFunction = async ({ request }) => {
  const result = await LoginValidator.validate(await request.formData());
  if (result.error) throw validationError(result.error);

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";
  const cookie = await loginWithIdToken(result.data.idToken);
  return redirect(next, { headers: { "Set-Cookie": cookie } });
};

export default function LoginRoute() {
  const submit = useSubmit();

  const handleSubmit = async (data: LoginFormData, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { user } = await signInWithEmailAndPassword(clientAuth, data.email, data.password);
    const idToken = await user.getIdToken();
    submit({ idToken }, { method: "post" });
    await signOut(clientAuth);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-gray-50">
      <noscript>JavaScript is required to run this page.</noscript>

      <img className="mx-auto h-16 w-auto" src="/assets/logo.png" alt="" />

      <ValidatedForm
        className="flex w-full flex-col gap-5 bg-white p-8 shadow sm:max-w-md sm:rounded-lg"
        validator={LoginFormValidator}
        onSubmit={handleSubmit}
      >
        <FormControl
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="blaise.pascal@gmail.com"
        />

        <FormControl
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password..."
        />

        <Button type="submit">Sign in</Button>
      </ValidatedForm>
    </div>
  );
}
