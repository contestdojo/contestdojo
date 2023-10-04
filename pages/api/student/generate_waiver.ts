/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import Api2Pdf from "api2pdf";
import { NextApiRequest, NextApiResponse } from "next";
import rehypeFilter from "react-markdown/lib/rehype-filter";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { renderDirectives } from "~/components/WaiverEditor/processDirectives";

const prelude = `
<style>
@import url("https://rsms.me/inter/inter.css");
html {
  font-size: 11pt;
  font-family: 'Inter', sans-serif;
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
  background-color: #F7FAFC;
  border: 1px solid #CBD5E0;
  border-radius: 2px;
  padding: 2px 5px;
}
</style>
`;

const a2pClient = new Api2Pdf(process.env.API2PDF_KEY);

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

  const result = await a2pClient.chromeHtmlToPdf(`${prelude}${html.value}`);
  const resp = await fetch(result.FileUrl);
  const pdf = await resp.arrayBuffer();

  res.send(Buffer.from(pdf));
};

export default handler;
