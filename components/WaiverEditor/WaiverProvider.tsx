/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { createContext, useContext, useState } from "react";

const WaiverContext = createContext();

export const useWaiver = () => useContext(WaiverContext);
export const useWaiverState = (key) => {
  const { values, updateValue } = useWaiver();
  return [values[key], (value) => updateValue(key, value)];
};

const WaiverProvider = ({ children }) => {
  const [values, setValues] = useState({});
  const updateValue = (key, value) => setValues((v) => ({ ...v, [key]: value }));

  return <WaiverContext.Provider value={{ values, updateValue }}>{children}</WaiverContext.Provider>;
};

export default WaiverProvider;
