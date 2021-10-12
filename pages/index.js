/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { useRouter } from "next/router";

import AuthWrapper from "~/components/AuthWrapper";
import { useUserData } from "~/helpers/utils";

const HomePage = () => {
  const router = useRouter();
  const { data: user } = useUserData();

  if (user.type == "coach") {
    router.replace("/coach");
  } else if (user.type == "student") {
    router.replace("/student");
  } else if (user.type == "admin") {
    router.replace("/admin");
  }

  return null;
};

const Home = () => (
  <AuthWrapper>
    <HomePage />
  </AuthWrapper>
);

export default Home;
