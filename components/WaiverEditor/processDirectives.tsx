/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import { h } from "hastscript";
import { visit } from "unist-util-visit";

const setNodeData = (node, el) => {
  const data = node.data || (node.data = {});
  data.hName = el.tagName;
  data.hProperties = el.properties;
  data.hChildren = el.children;
};

const processDirectives = (options) => (tree, file) => {
  visit(tree, "textDirective", (node) => {
    switch (node.name) {
      case "var":
        setNodeData(node, h("span", options?.vars?.[node.attributes?.id]));
        break;

      case "field":
        setNodeData(node, h("cd-field-inline", node.attributes ?? {}));
        break;
    }
  });

  visit(tree, "leafDirective", (node) => {
    switch (node.name) {
      case "signature":
        setNodeData(node, h("cd-signature", node.attributes ?? {}));
        break;

      case "field":
        setNodeData(node, h("cd-field", node.attributes ?? {}));
        break;
    }
  });
};

export default processDirectives;
