/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useUser } from "reactfire";

import AuthWrapper from "~/components/AuthWrapper";
import { useUserData } from "~/helpers/utils";

const HomePage = () => {
  const router = useRouter();
  const { data: user } = useUser();
  const { ref: userRef, data: userData } = useUserData();

  useEffect(() => {
    if (userData?.type == "coach") {
      router.replace("/coach");
    } else if (userData?.type == "student") {
      router.replace("/student");
    } else if (userData?.type == "admin") {
      router.replace("/admin");
    } else {
      const [fname, lname] = user.displayName.split(" ", 2);
      userRef.set(
        {
          fname,
          lname,
          email: user.email,
          type: "student",
        },
        { merge: true }
      );
    }
  }, [userData]);

  return null;
};

const Home = () => (
  <AuthWrapper>
    <HomePage />
  </AuthWrapper>
);

export default Home;
