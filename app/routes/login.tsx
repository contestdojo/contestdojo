import type { ActionFunction } from "@remix-run/node";
import { Form, useSubmit, useTransition } from "@remix-run/react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRef } from "react";
import { zfd } from "zod-form-data";
import Button from "~/components/button";
import Input from "~/components/input";
import { loginWithIdToken } from "~/utils/auth.server";
import { auth as clientAuth } from "~/utils/firebase.client";

const LoginFields = zfd.formData({
  idToken: zfd.text(),
});

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const { idToken } = LoginFields.parse(formData);

  const url = new URL(request.url);
  const redirectTo = url.searchParams.get("next") ?? "/";
  return loginWithIdToken(idToken, redirectTo);
};

export default function LoginRoute() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const transition = useTransition();
  const submit = useSubmit();

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

      <Form
        className="flex w-full flex-col gap-6 bg-white p-8 shadow sm:max-w-md sm:rounded-lg"
        onSubmit={handleSubmit}
      >
        <Input
          autoComplete="email"
          label="Email address"
          type="email"
          placeholder="blaise.pascal@gmail.com"
          ref={emailRef}
        />

        <Input
          autoComplete="current-password"
          label="Password"
          type="password"
          placeholder="Enter password..."
          ref={passwordRef}
        />

        <Button type="submit">Sign in</Button>
      </Form>
    </div>
  );
}
