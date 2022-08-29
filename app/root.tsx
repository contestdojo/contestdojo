/*
 * Copyright (c) 2022 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { LinksFunction, MetaFunction } from "@remix-run/node";

import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useTransition,
} from "@remix-run/react";
import nProgress from "nprogress";
import { useEffect } from "react";

import nProgressStyles from "~/nprogress.css";
import styles from "~/tailwind.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "ContestDojo",
  viewport: "width=device-width,initial-scale=1",
  "msapplication-TileColor": "#f40808",
  "theme-color": "#ffffff",
});

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#f40808" },
  { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
  { rel: "stylesheet", href: styles },
  { rel: "stylesheet", href: nProgressStyles },
];

export default function App() {
  const transition = useTransition();

  useEffect(() => {
    if (transition.state === "loading" || transition.state === "submitting") {
      nProgress.start();
    } else {
      nProgress.done();
    }
  }, [transition.state]);

  return (
    <html lang="en" className="h-full bg-gray-100">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
