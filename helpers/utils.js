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
