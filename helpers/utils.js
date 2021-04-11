import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useEffect, useState } from "react";
import { useFirestore, useFirestoreDocData, useUser } from "reactfire";

dayjs.extend(duration);

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

export const useFormState = ({ multiple } = {}) => {
    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });

    const wrapAction = func => async (...args) => {
        setFormState({ isLoading: multiple ? args[0] : true, error: null });
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

export const useTime = (refreshCycle = 100) => {
    const [now, setNow] = useState(dayjs());

    useEffect(() => {
        (async () => {
            const resp = await fetch("https://worldtimeapi.org/api/timezone/Etc/UTC");
            const json = await resp.json();
            const serverTime = dayjs(json["datetime"]);
            const offset = serverTime.valueOf() - dayjs().valueOf();
            const intervalId = setInterval(() => {
                setNow(dayjs().add(offset, "ms"));
            }, refreshCycle);
            return () => clearInterval(intervalId);
        })();
    }, [refreshCycle, setInterval, clearInterval, setNow]);

    return now;
};

export const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};
