/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import pdf from "html-pdf";
import { NextApiRequest, NextApiResponse } from "next";
import rehypeFilter from "react-markdown/lib/rehype-filter";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { promisify } from "util";

import { renderDirectives } from "~/components/WaiverEditor/processDirectives";

const css = `<style>
html {
  font-size: 8pt;
}
p {
  line-height: 150%;
}
li + li {
  margin-top: 5px;
}
.cd-field,
.cd-field-inline, 
.cd-signature {
  background-color: #FCF3CF;
  border: 1px solid black;
  padding: 2px 5px 0 5px;
}
</style>`;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") res.status(405).end();

  const { waiver, values } = req.body;

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(renderDirectives, { values })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeFilter, {})
    .use(rehypeStringify);

  const html = await processor.process(waiver);

  res.setHeader("Content-Type", "application/pdf");

  const render = pdf.create(`${css}${html.value}`, {
    format: "Letter",
    orientation: "portrait",
    border: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
    },
    phantomPath: path.resolve(process.cwd(), "node_modules/phantomjs-prebuilt/bin/phantomjs"),
  });

  const buffer = await promisify(render.toBuffer.bind(render))();

  res.send(buffer);
};

export default handler;
