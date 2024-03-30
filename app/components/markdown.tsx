/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { Components } from "react-markdown";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Table, Tbody, Td, Th, Thead, Tr } from "./ui";

export const components: Components = {
  // eslint-disable-next-line jsx-a11y/anchor-has-content
  a: ({ node, ...props }) => <a className="text-blue-500" {...props} />,
  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 pl-3" {...props} />,
  pre: ({ node, ...props }) => (
    <pre className="rounded-lg border bg-gray-50 px-3 py-2" {...props} />
  ),
  h1: ({ node, ...props }) => <h1 className="text-2xl font-semibold" {...props} />,
  h2: ({ node, ...props }) => <h1 className="text-xl font-semibold" {...props} />,
  h3: ({ node, ...props }) => <h1 className="text-lg font-semibold" {...props} />,
  h4: ({ node, ...props }) => <h1 className="text-base font-semibold" {...props} />,
  h5: ({ node, ...props }) => <h1 className="text-sm font-semibold" {...props} />,
  h6: ({ node, ...props }) => <h1 className="text-sm uppercase text-gray-500" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-8" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-8" {...props} />,
  table: ({ node, ...props }) => (
    <div className="overflow-auto rounded-lg border">
      <Table {...props} />
    </div>
  ),
  tbody: Tbody,
  td: Td,
  th: Th,
  thead: Thead,
  tr: Tr,
};

type MarkdownProps = {
  children: string;
};

export default function Markdown({ children }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      className="flex flex-col gap-4"
    >
      {children}
    </ReactMarkdown>
  );
}
