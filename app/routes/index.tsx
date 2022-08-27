import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import type { User } from "~/utils/auth.server";
import { requireSession } from "~/utils/auth.server";

type LoaderData = {
  user: User;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireSession(request);
  return json<LoaderData>({ user });
};

export default function IndexRoute() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <div>
      <h1>Welcome to ContestDojo!</h1>
      <p>Logged in as: {user.displayName}</p>

      {user.isAdmin && (
        <p>
          <Link to="/admin">Go to Admin page</Link>
        </p>
      )}

      <Form reloadDocument action="/logout" method="post">
        <button type="submit">Sign out</button>
      </Form>
    </div>
  );
}
