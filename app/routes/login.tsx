import type { ActionFunction } from "@remix-run/node";
import { Form, useSubmit } from "@remix-run/react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRef } from "react";
import { zfd } from "zod-form-data";
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
    <div>
      <noscript>JavaScript is required to run this page.</noscript>

      <Form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" ref={emailRef} />
        <input type="password" placeholder="Password" ref={passwordRef} />
        <button type="submit">Login</button>
      </Form>
    </div>
  );
}
