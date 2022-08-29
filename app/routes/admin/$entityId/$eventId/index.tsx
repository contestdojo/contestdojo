import type { LoaderFunction } from "@remix-run/node";

import { redirect } from "@remix-run/node";
import { resolvePath } from "react-router";

export const loader: LoaderFunction = ({ request }) => {
  const path = resolvePath("orgs", request.url);
  return redirect(path.pathname);
};
