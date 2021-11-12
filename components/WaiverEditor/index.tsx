/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";

import { components } from "./components";
import processDirectives from "./processDirectives";

const WaiverEditor = forwardRef(({ children }, ref) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkDirective, processDirectives]} components={components}>
      {children}
    </ReactMarkdown>
  );
});

export default WaiverEditor;
