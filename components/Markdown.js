/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Heading } from "@chakra-ui/react";
import ChakraUIRenderer, { defaults } from "chakra-ui-markdown-renderer";
import ReactMarkdown from "react-markdown";

const chakraRendererOptions = {
  ...defaults,
  heading: (props) => {
    const { level, children } = props;
    const sizes = ["md", "sm", "xs", "xs", "xs", "xs"];
    return (
      <Heading my={4} as={`h${level}`} size={sizes[`${level - 1}`]} {...getCoreProps(props)}>
        {children}
      </Heading>
    );
  },
};

const getCoreProps = (props) => (props["data-sourcepos"] ? { "data-sourcepos": props["data-sourcepos"] } : {});

const Markdown = ({ children }) => (
  <ReactMarkdown renderers={ChakraUIRenderer(chakraRendererOptions)} escapeHtml={false} source={children} />
);

export default Markdown;
