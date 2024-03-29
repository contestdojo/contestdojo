/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { createContext, useContext } from "react";
import { useFirestore, useFirestoreDoc } from "reactfire";

export const EntityContext = createContext();
export const useEntity = () => useContext(EntityContext);

const EntityProvider = ({ children }) => {
  const router = useRouter();
  const firestore = useFirestore();

  const { entityId } = router.query;
  const entityRef = firestore.collection("entities").doc(entityId);
  const { data: entity } = useFirestoreDoc(entityRef);

  if (!entity.exists) {
    return (
      <Alert status="error">
        <AlertIcon />
        <Box>
          <AlertTitle>Entity Not Found</AlertTitle>
          <AlertDescription>The entity you are trying to access was not found.</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <EntityContext.Provider
      value={{
        ref: entityRef,
        data: entity.data(),
      }}
    >
      {children}
    </EntityContext.Provider>
  );
};

export default EntityProvider;
