/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";
import { useFirestore, useFirestoreDoc } from "reactfire";

export const OrgContext = createContext();
export const useOrg = () => useContext(OrgContext);

const OrgProvider = ({ children }) => {
  const router = useRouter();
  const firestore = useFirestore();

  const { orgId } = router.query;
  const orgRef = firestore.collection("orgs").doc(orgId);
  const { data: org } = useFirestoreDoc(orgRef);

  if (!org.exists) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Organization Not Found</AlertTitle>
          <AlertDescription>The organization you are trying to access was not found.</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <OrgContext.Provider
      value={{
        ref: orgRef,
        data: org.data(),
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};

export default OrgProvider;
