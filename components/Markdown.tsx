/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Box,
  Code,
  Divider,
  Heading,
  Link,
  ListItem,
  OrderedList,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  UnorderedList,
} from "@chakra-ui/react";
import { Component, forwardRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const components: { [key: string]: Component } = {
  a: ({ node, ...props }) => <Link color="blue.500" {...props} />,
  blockquote: ({ node, ...props }) => <Box pl={3} borderLeftWidth={4} {...props} />,
  code: ({ node, ...props }) => <Code {...props} />,
  h1: ({ node, ...props }) => <Heading mb={4} as="h1" size="lg" {...props} />,
  h2: ({ node, ...props }) => <Heading mb={4} as="h2" size="md" {...props} />,
  h3: ({ node, ...props }) => <Heading mb={4} as="h3" size="sm" {...props} />,
  h4: ({ node, ...props }) => <Heading mb={4} as="h4" size="xs" {...props} />,
  h5: ({ node, ...props }) => <Heading mb={4} as="h5" size="xs" {...props} />,
  h6: ({ node, ...props }) => <Heading mb={4} as="h6" size="xs" {...props} />,
  hr: ({ node, ...props }) => <Divider mb={4} {...props} />,
  li: ListItem,
  ol: ({ node, ...props }) => <OrderedList mb={4} {...props} />,
  p: ({ node, ...props }) => <Text mb={4} {...props} />,
  ul: ({ node, ...props }) => <UnorderedList mb={4} {...props} />,
  table: ({ node, ...props }) => <Table mb={4} {...props} />,
  tbody: Tbody,
  td: Td,
  th: Th,
  thead: Thead,
  tr: Tr,
};

const Markdown = forwardRef(({ children }, ref) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
});

export default Markdown;
