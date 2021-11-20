/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useEffect, useState } from "react";
import { useFirestore, useFirestoreDocData, useFunctions, useUser } from "reactfire";

dayjs.extend(duration);

export const delay = (time) => {
  return new Promise((resolve) => {
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

  const wrapAction =
    (func, onSuccess) =>
    async (...args) => {
      setFormState({ isLoading: multiple ? args[0].toString() : true, error: null });
      await delay(300);
      try {
        await func(...args);
        setFormState({ isLoading: false, error: null });
        if (onSuccess) await onSuccess();
      } catch (err) {
        setFormState({ isLoading: false, error: err });
      }
    };

  return [formState, wrapAction];
};

export const useTime = (refreshCycle = 100) => {
  const functions = useFunctions();
  const date = functions.httpsCallable("date");

  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    (async () => {
      const { datetime } = await date();
      const offset = dayjs(datetime).valueOf() - dayjs().valueOf();
      const intervalId = setInterval(() => {
        setNow(dayjs().add(offset, "ms"));
      }, refreshCycle);
      return () => clearInterval(intervalId);
    })();
  }, [refreshCycle, setInterval, clearInterval, setNow]);

  return now;
};

export const useLocalStorage = (key, initialValue) => {
  const [state, _setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  const setState = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      _setState(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  return [state, setState];
};

export const toDict = (obj, x) => {
  obj[x.id] = { ...x, ...obj[x.id] };
  return obj;
};
