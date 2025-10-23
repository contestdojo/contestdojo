/*
 * Copyright (c) 2024 Oliver Ni
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { marked } from "marked";

export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined>
): string {
  // Support {{key|fallback1|fallback2}} syntax for variable fallbacks
  return template.replace(/\{\{([\w.]+(?:\|[\w.]+)*)\}\}/g, (match, keysString) => {
    // Split by | to get all potential keys to try
    const keys = keysString.split("|");

    // Try each key in order until we find a non-empty value
    for (const key of keys) {
      const value = variables[key.trim()];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    // If no value found, return empty string
    return "";
  });
}

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  return await marked(markdown);
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
      "org.coach.fname",
      "org.coach.lname",
      "org.coach.email",
    ];
  } else {
    return [
      "student.fname",
      "student.lname",
      "student.email",
      "student.grade",
      "student.number",
      "student.org.name",
      "student.org.address",
      "student.org.city",
      "student.org.state",
      "student.org.country",
      "student.org.zip",
      "student.org.coach.fname",
      "student.org.coach.lname",
      "student.org.coach.email",
    ];
  }
}
