/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import ReactMarkdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";

import { components } from "./components";
import processDirectives from "./processDirectives";
import WaiverProvider from "./WaiverProvider";

const WaiverEditor = ({ children, vars }) => {
  return (
    <WaiverProvider>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkDirective, [processDirectives, { vars }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </WaiverProvider>
  );
};

export default WaiverEditor;
