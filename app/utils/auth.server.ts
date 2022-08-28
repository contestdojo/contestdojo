import { createCookie, redirect, Response } from "@remix-run/node";
import { fromUnixTime, isBefore, subMinutes } from "date-fns";
import { auth, firestore } from "./firebase.server";

export type User = {
  uid: string;
  email?: string;
  displayName?: string;
  isAdmin: boolean;
};

const session = createCookie("session", {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 5,
});

async function migrateLegacyProfile(uid: string) {
  const userSnap = await firestore.collection("users").doc(uid).get();
  const user = userSnap.data();
  if (!user) return;

  if (user.fname && user.lname) {
    await auth.updateUser(uid, { displayName: `${user.fname} ${user.lname}` });
  }

  if (user.type === "admin") {
    await auth.setCustomUserClaims(uid, { admin: true });
  }
}

export async function loginWithIdToken(idToken: string, redirectTo: string) {
  const decodedIdToken = await auth.verifyIdToken(idToken, true);

  if (isBefore(fromUnixTime(decodedIdToken.auth_time), subMinutes(new Date(), 5))) {
    throw new Response("Recent sign-in required", { status: 401 });
  }

  await migrateLegacyProfile(decodedIdToken.uid);

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: 1000 * 60 * 60 * 24 * 5,
  });

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await session.serialize(sessionCookie),
    },
  });
}

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
    isAdmin: user.customClaims?.admin === true,
  };
}

export async function requireAdmin(request: Request) {
  const user = await requireSession(request);
  if (!user.isAdmin) {
    throw new Response("You must be an admin to view this page.", { status: 401 });
  }
  return user;
}
