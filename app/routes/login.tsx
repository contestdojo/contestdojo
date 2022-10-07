/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";
import { useSubmit } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import React from "react";
import { validationError } from "remix-validated-form";
import { z } from "zod";

import SchemaForm from "~/components/forms/schema-form";
import { loginWithIdToken } from "~/lib/auth.server";
import { auth as clientAuth } from "~/lib/firebase.client";

const LoginValidator = withZod(
  z.object({
    idToken: z.string(),
  })
);

const LoginForm = z.object({
  email: z.string().min(1, "Required").email(),
  password: z.string().min(1, "Required"),
});

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

  const handleSubmit = async (
    data: z.infer<typeof LoginForm>,
    event: React.FormEvent<HTMLFormElement>
  ) => {
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

      <SchemaForm
        id="Login"
        className="w-full bg-white p-8 shadow sm:max-w-md sm:rounded-lg"
        schema={LoginForm}
        onSubmit={handleSubmit}
        fieldProps={{
          email: { placeholder: "blaise.pascal@gmail.com" },
          password: { type: "password" },
        }}
        buttonLabel="Sign in"
      />
    </div>
  );
}
