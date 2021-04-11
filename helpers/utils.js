import { useState } from "react";
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

export const useFormState = () => {
    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });

    const wrapAction = func => async (...args) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await func(...args);
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return [formState, wrapAction];
};
