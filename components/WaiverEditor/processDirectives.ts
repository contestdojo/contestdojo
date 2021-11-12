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

const processDirectives = () => (tree) => {
  visit(tree, "textDirective", (node) => {
    if (node.name === "field") {
      setNodeData(node, h("cd-field-inline", node.attributes ?? {}));
    }
  });

  visit(tree, "leafDirective", (node) => {
    if (node.name === "signature") {
      setNodeData(node, h("cd-signature", node.attributes ?? {}));
    }

    if (node.name === "field") {
      setNodeData(node, h("cd-field", node.attributes ?? {}));
    }
  });
};

export const renderDirectives = (options) => (tree) => {
  const { values } = options;
  visit(tree, "textDirective", (node) => {
    if (node.name === "field") {
      setNodeData(node, h("span", { class: "cd-field-inline" }, values[node.attributes?.id]));
    }
  });

  visit(tree, "leafDirective", (node) => {
    if (node.name === "signature") {
      setNodeData(node, h("img", { height: 120, width: 300, src: values[node.attributes?.id], class: "cd-signature" }));
    }

    if (node.name === "field") {
      setNodeData(node, h("span", { class: "cd-field" }, values[node.attributes?.id]));
    }
  });
};

export default processDirectives;
