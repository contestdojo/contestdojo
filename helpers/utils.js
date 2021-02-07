import { useRouter } from "next/router";
import { useContext } from "react";
import { useFirestore, useFirestoreDocData, useUser } from "reactfire";

export const delay = time => {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
};

export const useUserRef = () => {
    const { data: user } = useUser();
    const firestore = useFirestore();
    const userRef = firestore.collection("users").doc(user.uid);
    return userRef;
};

export const useUserData = () => {
    const ref = useUserRef();
    return { ref, ...useFirestoreDocData(ref, { idField: "uid" }) };
};

export const useEventRef = () => {
    const router = useRouter();
    const firestore = useFirestore();
    const { eventId } = router.query;
    return firestore.collection("events").doc(eventId);
};

export const useEventData = () => {
    const ref = useEventRef();
    return { ref, ...useFirestoreDocData(ref, { idField: "id" }) };
};

export const useOrgRef = () => {
    const router = useRouter();
    const firestore = useFirestore();
    const { orgId } = router.query;
    return firestore.collection("orgs").doc(orgId);
};

export const useOrgData = () => {
    const ref = useOrgRef();
    return { ref, ...useFirestoreDocData(ref, { idField: "id" }) };
};
