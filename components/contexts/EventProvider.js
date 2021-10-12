/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";
import { useFirestore, useFirestoreDoc } from "reactfire";

export const EventContext = createContext();
export const useEvent = () => useContext(EventContext);

const EventProvider = ({ children }) => {
  const router = useRouter();
  const firestore = useFirestore();

  let { eventId } = router.query;
  if (router.pathname.startsWith("/coach/[orgId]/smt21")) eventId = "smt21";
  if (router.pathname.startsWith("/admin/[entityId]/smt21")) eventId = "smt21";
  if (router.pathname.startsWith("/student/smt21")) eventId = "smt21";

  console.log(eventId);

  const eventRef = firestore.collection("events").doc(eventId);
  const { data: event } = useFirestoreDoc(eventRef);

  if (!event.exists) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Event Not Found</AlertTitle>
          <AlertDescription>The event you are trying to access was not found.</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <EventContext.Provider
      value={{
        ref: eventRef,
        data: event.data(),
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export default EventProvider;
