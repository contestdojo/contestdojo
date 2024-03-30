/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { createCookie, redirect } from "@remix-run/node";
import { fromUnixTime, isBefore, subMinutes } from "date-fns";

import { auth, firestore } from "~/lib/firebase.server";

export type User = {
  uid: string;
  email?: string;
  displayName?: string;
  photoUrl: string;
  type: string;
};

const session = createCookie("session", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 5,
});

async function migrateLegacyProfile(uid: string) {
  const user = await auth.getUser(uid);
  const profileSnap = await firestore.collection("users").doc(uid).get();
  const profile = profileSnap.data();

  if (!profile) return;

  if (profile.fname && profile.lname && !user.displayName) {
    await auth.updateUser(uid, { displayName: `${profile.fname} ${profile.lname}` });
  }

  await auth.setCustomUserClaims(uid, { type: profile.type });
}

export const loginWithIdToken = async (idToken: string) => {
  const decodedIdToken = await auth.verifyIdToken(idToken, true);

  if (isBefore(fromUnixTime(decodedIdToken.auth_time), subMinutes(new Date(), 5))) {
    throw new Response("Recent sign-in required", { status: 401 });
  }

  await migrateLegacyProfile(decodedIdToken.uid);

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: 1000 * 60 * 60 * 24 * 5,
  });

  return await session.serialize(sessionCookie);
};

export async function logout() {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await session.serialize("", { maxAge: 0 }),
    },
  });
}

function getSessionCookie(request: Request) {
  return session.parse(request.headers.get("Cookie"));
}

export async function requireSession(request: Request): Promise<User> {
  let decodedIdToken;

  try {
    decodedIdToken = await auth.verifySessionCookie(await getSessionCookie(request));
  } catch (error) {
    const url = new URL(request.url);
    const params = new URLSearchParams({ next: url.pathname });
    throw redirect(`/login?${params}`);
  }

  const user = await auth.getUser(decodedIdToken.uid);

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoURL ?? `https://source.boringavatars.com/beam/512/${user.uid}`,
    type: user.customClaims?.type,
  };
}

export async function requireUserType(request: Request, type: "admin" | "coach" | "student") {
  const user = await requireSession(request);
  if (user.type !== type) {
    throw new Response(`Your account must be of type ${type} to view this page.`, { status: 401 });
  }
  return user;
}
