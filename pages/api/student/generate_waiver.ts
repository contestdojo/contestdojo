/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import chromium from "chrome-aws-lambda";
import { NextApiRequest, NextApiResponse } from "next";
import rehypeFilter from "react-markdown/lib/rehype-filter";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { renderDirectives } from "~/components/WaiverEditor/processDirectives";

const css = `<style>
html {
  font-size: 12pt;
  font-family: sans-serif;
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
  padding: 2px 5px;
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

  const browser = await chromium.puppeteer.launch(
    process.env.AWS_LAMBDA_FUNCTION_VERSION
      ? {
          args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath,
          headless: true,
        }
      : { headless: true }
  );
  const page = await browser.newPage();
  await page.setContent(`${css}${html.value}`);
  const pdf = await page.pdf({
    format: "Letter",
    margin: { top: "0.5in", left: "0.5in", bottom: "0.5in", right: "0.5in" },
    printBackground: true,
  });
  await browser.close();

  res.send(pdf);
};

export default handler;
