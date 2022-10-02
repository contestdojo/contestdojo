/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { ActionFunction } from "@remix-run/node";
import type { Result } from "remix-domains";

import { redirect } from "@remix-run/node";
import { Form as RemixForm, useActionData, useSubmit } from "@remix-run/react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRef } from "react";
import { errorMessagesForSchema, inputFromForm } from "remix-domains";
import { z } from "zod";

import Button from "~/components/button";
import Field from "~/components/forms/field";
import Input from "~/components/forms/input";
import Label from "~/components/forms/label";
import { loginWithIdToken } from "~/lib/auth.server";
import { auth as clientAuth } from "~/lib/firebase.client";

export const action: ActionFunction = async ({ request }) => {
  const result = await loginWithIdToken(await inputFromForm(request));
  if (!result.success) return result;

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/";
  return redirect(next, { headers: { "Set-Cookie": result.data } });
};

export default function LoginRoute() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = useSubmit();
  const actionData = useActionData<Result<string>>();
  const errors = actionData ? errorMessagesForSchema(actionData.inputErrors, z.object({})) : [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailRef.current || !passwordRef.current) return;

    const { user } = await signInWithEmailAndPassword(
      clientAuth,
      emailRef.current.value,
      passwordRef.current.value
    );

    const idToken = await user.getIdToken();
    submit({ idToken }, { method: "post" });

    await signOut(clientAuth);
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-gray-50">
      <noscript>JavaScript is required to run this page.</noscript>

      <img className="mx-auto h-16 w-auto" src="/assets/logo.png" alt="" />

      <RemixForm
        className="flex w-full flex-col gap-5 bg-white p-8 shadow sm:max-w-md sm:rounded-lg"
        onSubmit={handleSubmit}
      >
        <Field>
          <Label>Email address</Label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="blaise.pascal@gmail.com"
            ref={emailRef}
          />
        </Field>

        <Field>
          <Label>Password</Label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Enter password..."
            ref={passwordRef}
          />
        </Field>

        <Button type="submit">Sign in</Button>
      </RemixForm>
    </div>
  );
}
