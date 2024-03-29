/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { useRouter } from "next/router";
import { AuthCheck } from "reactfire";

import { useUserData } from "~/helpers/utils";

const RedirectLogin = () => {
  const router = useRouter();
  const params = new URLSearchParams({ next: router.asPath });
  router.replace(`/login?${params}`);
  return null;
};

const AuthChecker = ({ children, type }) => {
  const router = useRouter();

  const { data: userData } = useUserData();
  if (type && userData.type !== type) {
    router.replace("/");
  }

  return children;
};

const AuthWrapper = ({ children, type }) => (
  <AuthCheck fallback={<RedirectLogin />}>
    <AuthChecker type={type}>{children}</AuthChecker>
  </AuthCheck>
);

export default AuthWrapper;
