/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { getNestedPath } from "./object-utils";

/* Copyright (c) 2021 Oliver Ni */

export type Rule = {
  field: string;
  rule: "=" | "!=" | "=~" | "!~" | "in";
  value: string;
};

export type Authorization = {
  mode: "any-allow" | "all-allow" | "any-deny" | "all-deny";
  rules: Rule[];
};

export const testRule = (rule: Rule, object: any) => {
  const value = getNestedPath(object, rule.field)?.toString()?.trim();

  if (rule.rule === "=") return rule.value == value;
  if (rule.rule === "!=") return rule.value != value;
  if (rule.rule === "=~") return new RegExp(rule.value).test(value);
  if (rule.rule === "!~") return !new RegExp(rule.value).test(value);

  if (rule.rule === "in")
    return rule.value
      .split("\n")
      .map((x) => x.trim)
      .includes(value);
};

export const testAuthorization = (authorization: Authorization, object: any) => {
  const tr = (x: Rule) => testRule(x, object);
  if (authorization.mode === "any-allow") return authorization.rules.some(tr);
  if (authorization.mode === "all-allow") return authorization.rules.every(tr);
  if (authorization.mode === "any-deny") return !authorization.rules.some(tr);
  if (authorization.mode === "all-deny") return !authorization.rules.every(tr);
};
