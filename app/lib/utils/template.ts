/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] ?? match;
  });
}

export function getAvailableVariables(type: "organization" | "student"): string[] {
  if (type === "organization") {
    return [
      "org.name",
      "org.address",
      "org.city",
      "org.state",
      "org.country",
      "org.zip",
      "coach.fname",
      "coach.lname",
      "coach.email",
    ];
  } else {
    return [
      "student.fname",
      "student.lname",
      "student.email",
      "student.grade",
      "student.number",
      "org.name",
    ];
  }
}
